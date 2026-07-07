"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { Loader } from "@/components/ui/loader";
import { EmptyState } from "@/components/common/empty-state";
import { SuggestionsSettingsModal } from "@/components/suggestions/suggestions-settings-modal";
import { CreatePostModal } from "@/components/posts/create-post-modal";
import { Suggestion, useSuggestions } from "@/hooks/use-suggestions";
import { SuggestionCard } from "@/components/suggestions/suggestion-card";

export default function SuggestionsPage() {
  const { data: userData, isLoading: isUserLoading } = useUser();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState("All");
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSuggestionsLoading,
  } = useSuggestions(selectedTopicFilter);

  const isLoading = isUserLoading || isSuggestionsLoading;
  const userPreferences = userData?.user?.preferences;

  const handleUseSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleCreatePostSuccess = () => {
    setSelectedSuggestion(null);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl w-full px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              AI Post Suggestions
            </h1>
            <p className="text-sm text-muted-foreground">
              Curated post ideas based on the latest news in your selected
              topics.{" "}
              <span className="text-primary font-medium">
                New suggestions arrive every morning.
              </span>
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            <Settings />
            Topics
          </Button>
        </div>

        {/* Active Topics */}
        {userPreferences?.suggestions_enabled &&
          userPreferences?.topics &&
          userPreferences.topics.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopicFilter("All")}
                className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                  selectedTopicFilter === "All"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                All
              </button>
              {userPreferences.topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopicFilter(topic)}
                  className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                    selectedTopicFilter === topic
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader />
            </div>
          ) : !userPreferences?.suggestions_enabled ? (
            <EmptyState>
              You haven't set up your post suggestions yet.
            </EmptyState>
          ) : data?.pages[0].suggestions.length === 0 ? (
            <EmptyState>
              You're all caught up! New suggestions arrive every morning.
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.pages.map((page, i) => (
                <div key={i} className="contents">
                  {page.suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion._id?.toString()}
                      suggestion={suggestion}
                      onUse={handleUseSuggestion}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {!isLoading && hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>

      <SuggestionsSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        initialTopics={userPreferences?.topics}
      />

      {selectedSuggestion && (
        <CreatePostModal
          isOpen={true}
          onClose={() => setSelectedSuggestion(null)}
          onSuccess={handleCreatePostSuccess}
          initialData={{
            title: selectedSuggestion.title,
            description: selectedSuggestion.description,
            generate_image: true,
          }}
        />
      )}
    </ProtectedRoute>
  );
}
