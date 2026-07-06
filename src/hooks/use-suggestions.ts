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

export const useSuggestions = () => {
  return useInfiniteQuery({
    queryKey: ["suggestions"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get<SuggestionsResponse>(
        `/suggestions?page=${pageParam}&limit=8`
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
  });
};
