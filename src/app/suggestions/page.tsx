"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Settings, Sparkles, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Loader } from "@/components/ui/loader";
import { EmptyState } from "@/components/common/empty-state";
import { SuggestionsSetupModal } from "@/components/suggestions/suggestions-setup-modal";
import { CreatePostModal } from "@/components/posts/create-post-modal";
import { formatDistanceToNow } from "date-fns";
import { Suggestion, useSuggestions } from "@/hooks/use-suggestions";

export default function SuggestionsPage() {
  const { data: userData, isLoading: isUserLoading } = useUser();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSuggestionsLoading,
  } = useSuggestions();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

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
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="size-8 text-primary" />
              AI Suggestions
            </h1>
            <p className="mt-2 text-muted-foreground">
              Curated post ideas based on the latest news in your selected topics.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 rounded-full"
          >
            <Settings className="size-4" />
            Edit Topics
          </Button>
        </div>

        {/* Active Topics */}
        {userPreferences?.topics && userPreferences.topics.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {userPreferences.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {topic}
              </span>
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
              <br />
              <Button
                variant="link"
                onClick={() => setShowSettingsModal(true)}
                className="mt-2 text-primary p-0 h-auto"
              >
                Click here to set them up
              </Button>
            </EmptyState>
          ) : data?.pages[0].suggestions.length === 0 ? (
            <EmptyState>
              No suggestions found for your topics yet. Check back later!
            </EmptyState>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {data?.pages.map((page, i) => (
                <div key={i} className="contents">
                  {page.suggestions.map((suggestion) => (
                    <div
                      key={suggestion._id?.toString()}
                      className="group relative p-6 flex flex-col justify-between overflow-hidden bg-linear-to-b from-card to-card/50 border border-primary/10 rounded-2xl shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
                    >
                      {/* Subtle Top Gradient Accent */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/40 via-blue-500/40 to-primary/40 opacity-50 transition-opacity group-hover:opacity-100" />
                      
                      {/* Background Watermark */}
                      <Sparkles className="absolute -right-4 -top-4 size-24 text-primary/5 transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/10" />

                      <div className="relative z-10">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="px-3 py-1 text-[11px] font-semibold tracking-wide text-primary bg-primary/10 rounded-full shadow-sm backdrop-blur-md">
                            {suggestion.topic}
                          </span>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {formatDistanceToNow(new Date(suggestion.generated_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="mb-3 text-lg font-bold leading-snug text-foreground transition-colors line-clamp-2 group-hover:text-primary">
                          {suggestion.title}
                        </h3>
                        <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                          {suggestion.description}
                        </p>
                      </div>
                      
                      <div className="relative z-10 mt-4 pt-4 flex items-center justify-between gap-3 border-t border-border/50">
                        {suggestion.based_on ? (
                          <a
                            href={suggestion.based_on}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                          >
                            <ExternalLink className="size-3.5" />
                            Read Source
                          </a>
                        ) : (
                          <div />
                        )}
                        <Button
                          size="sm"
                          className="gap-2 bg-primary/90 shadow-sm rounded-full transition-all hover:bg-primary hover:shadow-md hover:shadow-primary/25"
                          onClick={() => handleUseSuggestion(suggestion)}
                        >
                          <Zap className="size-3.5" />
                          Create Post
                        </Button>
                      </div>
                    </div>
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
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Suggestions"
              )}
            </Button>
          </div>
        )}
      </div>

      {showSettingsModal && (
        <SuggestionsSetupModal
          initialTopics={userPreferences?.topics || []}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

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
