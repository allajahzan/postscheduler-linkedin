import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

export interface Suggestion {
  _id: string;
  topic: string;
  title: string;
  description: string;
  style_prompt?: string;
  based_on?: string;
  generated_at: Date;
  valid_until: Date;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useSuggestions = (topic?: string) => {
  return useInfiniteQuery({
    queryKey: ["suggestions", topic],
    queryFn: async ({ pageParam = 1 }) => {
      const url = new URL("/suggestions", window.location.origin);
      url.searchParams.append("page", pageParam.toString());
      url.searchParams.append("limit", "8");
      if (topic && topic !== "All") {
        url.searchParams.append("topic", topic);
      }

      const { data } = await api.get<SuggestionsResponse>(
        url.pathname + url.search,
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 24 * 60 * 60 * 1000, // 1 day
  });
};
