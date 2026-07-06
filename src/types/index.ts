import { ObjectId } from "mongodb";

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  password?: string;
  linkedin_access_token?: string;
  linkedin_person_urn?: string;
  linkedin_token_expires_at?: Date;
  profile_picture?: string;
  preferences?: {
    suggestions_enabled: boolean;
    topics: string[];
  };
  created_at: Date;
}



// MongoDB document structure
export interface SuggestionTopic {
  _id?: ObjectId;
  topic: string;
  suggestions: {
    title: string;
    description: string;
    style_prompt?: string;
    based_on?: string;
  }[];
  generated_at: Date;
  valid_until: Date;
}

export interface PostDocument {
  _id?: ObjectId;
  user_id: ObjectId;
  date: string;
  time: string;
  title: string;
  description: string;
  image_url: string;
  generate_image: boolean;
  prompt?: string;
  status: "pending" | "done";
  created_at: Date;
  updated_at: Date;
}

export interface NotificationDocument {
  _id?: ObjectId;
  user_id: ObjectId | null;
  post_id: ObjectId | null;
  type: "error" | "success" | "warning";
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}
