export function validateAndTransformImageUrl(
  imageUrl: string | undefined | null,
) {
  if (!imageUrl || imageUrl.trim() === "") {
    return {
      hasUrl: false,
      isValidUrl: false,
      looksLikeImage: false,
      finalUrl: "",
    };
  }

  const trimmedUrl = imageUrl.trim();
  const hasUrl = true;

  // Check 1 — is it a valid URL format?
  let isValidUrl = false;
  try {
    const url = new URL(trimmedUrl);
    // Must be http or https
    isValidUrl = url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    isValidUrl = false;
  }

  // Check 2 — does it look like an image? (optional but helpful)
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];
  const driveUrl = trimmedUrl.includes("drive.google.com");
  const pollinationsUrl = trimmedUrl.includes("pollinations.ai");

  // Convert Google Drive sharing link to direct download if needed
  let finalUrl = trimmedUrl;
  if (driveUrl && trimmedUrl.includes("/file/d/")) {
    const match = trimmedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      finalUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  const looksLikeImage =
    driveUrl ||
    pollinationsUrl ||
    imageExtensions.some((ext) => trimmedUrl.toLowerCase().includes(ext));

  return {
    hasUrl,
    isValidUrl,
    looksLikeImage,
    finalUrl,
    isValid: hasUrl && isValidUrl && looksLikeImage,
    reason: !hasUrl
      ? "no url provided"
      : !isValidUrl
        ? "invalid url format"
        : !looksLikeImage
          ? "url does not appear to be an image"
          : "valid",
  };
}

/**
 * Checks if an image URL is publicly accessible by performing a server-side fetch.
 * If a Google Drive link is private, it redirects to a login page which returns text/html instead of an image.
 */
export async function checkImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow" });
    if (!response.ok) return false;

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return false; // Private drive links redirect to login page (HTML)
    }
    return true;
  } catch (error) {
    return false;
  }
}
