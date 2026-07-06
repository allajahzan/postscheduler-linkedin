import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { UserDocument } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      console.error("LinkedIn Auth Error:", error);
      return NextResponse.redirect(
        new URL("/login?error=linkedin_auth_failed", request.url),
      );
    }

    // Exchange code for access token
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "",
          client_id: process.env.LINKEDIN_CLIENT_ID || "",
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
        }).toString(),
      },
    );

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Failed to get access token:", errorText);
      return NextResponse.redirect(
        new URL("/login?error=token_exchange_failed", request.url),
      );
    }

    const { access_token, expires_in } = await tokenRes.json();

    // Get user's LinkedIn profile
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      console.error("Failed to get profile:", errorText);
      return NextResponse.redirect(
        new URL("/login?error=profile_fetch_failed", request.url),
      );
    }

    const { sub, name, email, picture } = await profileRes.json();
    const linkedinPersonUrn = `urn:li:person:${sub}`;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    const db = await getDb();

    // Check if user exists by email or LinkedIn URN
    const existingUser = await db.collection<UserDocument>("users").findOne({
      $or: [{ email }, { linkedin_person_urn: linkedinPersonUrn }],
    });

    let userId: string;

    if (existingUser) {
      // Update existing user with new token and potentially new picture
      await db.collection<UserDocument>("users").updateOne(
        { _id: existingUser._id },
        {
          $set: {
            linkedin_access_token: access_token,
            linkedin_person_urn: linkedinPersonUrn,
            linkedin_token_expires_at: tokenExpiresAt,
            profile_picture: picture || existingUser.profile_picture,
          },
        },
      );
      userId = existingUser._id!.toString();
    } else {
      // Create new user (Signup)
      const newUser: UserDocument = {
        name,
        email,
        linkedin_access_token: access_token,
        linkedin_person_urn: linkedinPersonUrn,
        linkedin_token_expires_at: tokenExpiresAt,
        profile_picture: picture,
        created_at: new Date(),
      };

      const result = await db
        .collection<UserDocument>("users")
        .insertOne(newUser);
      userId = result.insertedId.toString();
    }

    // Generate JWT cookie to log the user in
    const token = await signToken({ userId });

    const response = NextResponse.redirect(
      new URL("/posts?linkedin=connected", request.url),
    );

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=internal_error", request.url),
    );
  }
}
