import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface User {
  name: string;
  email: string;
  created_at: string;
  profile_picture?: string;
  linkedin_token_expires_at?: string;
  preferences?: {
    suggestions_enabled: boolean;
    topics: string[];
  };
}

export interface Quota {
  used: number;
  limit: number;
  next_reset_at: string | null;
}

export interface PostCounts {
  pending: number;
  done: number;
}

export const useUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await api.get<{
        user: User;
        quota: Quota;
        postCounts: PostCounts;
      }>("/user/me");
      return data;
    },
    retry: false,
    staleTime: 0,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.cancelQueries();
      queryClient.setQueryData(["user"], null);

      router.replace("/login");
      toast.success("Logged out successfully");
    },
    onError: () => {
      toast.error("Failed to logout");
    },
  });
};
