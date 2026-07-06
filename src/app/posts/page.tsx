"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { usePosts, Post, useDeletePost } from "@/hooks/use-posts";
import { useUser } from "@/hooks/use-auth";
import { PostCard, EmptySlotCard } from "@/components/posts/post-card";
import { CreatePostModal } from "@/components/posts/create-post-modal";
import { EditPostModal } from "@/components/posts/edit-post-modal";
import { DeleteConfirmModal } from "@/components/common/delete-confirm-modal";
import { EmptyState } from "@/components/common/empty-state";
import { SuggestionsSetupModal } from "@/components/suggestions/suggestions-setup-modal";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Loader } from "@/components/ui/loader";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "published">(
    "scheduled",
  );

  const {
    data: scheduledData,
    isLoading: isScheduledLoading,
    fetchNextPage: fetchNextScheduled,
    hasNextPage: hasNextScheduled,
    isFetchingNextPage: isFetchingNextScheduled,
  } = usePosts("pending", activeTab === "scheduled");

  const {
    data: publishedData,
    isLoading: isPublishedLoading,
    fetchNextPage: fetchNextPublished,
    hasNextPage: hasNextPublished,
    isFetchingNextPage: isFetchingNextPublished,
  } = usePosts("done", activeTab === "published");

  const deletePost = useDeletePost();
  const { data: userData, isLoading: isUserLoading } = useUser();
  const quota = userData?.quota || {
    used: 0,
    limit: 3,
    next_reset_at: null,
  };
  const userPreferences = userData?.user?.preferences;

  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Trigger modal if preferences not set
  useMemo(() => {
    if (userData && userPreferences?.suggestions_enabled === false) {
      setShowSuggestionsModal(true);
    }
  }, [userData, userPreferences?.suggestions_enabled]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);

  const scheduledPosts = useMemo(
    () => scheduledData?.pages.flatMap((p) => p.posts) || [],
    [scheduledData],
  );

  const publishedPosts = useMemo(
    () => publishedData?.pages.flatMap((p) => p.posts) || [],
    [publishedData],
  );

  const isLimitReached = quota.used >= quota.limit;

  const tokenWarning = useMemo(() => {
    const expiresAt = userData?.user?.linkedin_token_expires_at;
    if (!expiresAt) return false;
    const daysLeft = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return daysLeft < 7 ? daysLeft : false;
  }, [userData]);

  const nextResetText = useMemo(() => {
    if (!isLimitReached || !quota.next_reset_at) return "";
    const hoursLeft = Math.max(
      0,
      Math.ceil(
        (new Date(quota.next_reset_at).getTime() - Date.now()) /
          (1000 * 60 * 60),
      ),
    );
    if (hoursLeft > 24) {
      const days = Math.floor(hoursLeft / 24);
      return `Next slot frees up in ${days} ${days === 1 ? "day" : "days"}`;
    }
    return `Next slot frees up in ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"}`;
  }, [isLimitReached, quota.next_reset_at]);

  const isLoading =
    (activeTab === "scheduled" ? isScheduledLoading : isPublishedLoading) ||
    isUserLoading;

  const openCreate = () => {
    setEditingPost(null);
    setIsCreateModalOpen(true);
  };

  const handleConfirmDeletePost = () => {
    if (!deletingPost) return;
    deletePost.mutate(deletingPost._id, {
      onSuccess: () => {
        setDeletingPost(null);
      },
    });
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl w-full px-6 py-10">
        {/* LinkedIn Token Expiry Warning */}
        {tokenWarning !== false && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-amber-400"
            />
            <div className="text-[13px]">
              <span className="font-semibold text-amber-400">
                LinkedIn token expires in {tokenWarning}{" "}
                {tokenWarning === 1 ? "day" : "days"}.
              </span>{" "}
              <span className="text-muted-foreground">
                Reconnect from your profile to avoid interruptions.
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex gap-5 items-end justify-between">
          <div className="">
            <h1 className="text-xl font-bold tracking-tight">Your Posts</h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{quota.used}</span> of{" "}
              <span className="font-mono">{quota.limit}</span> slots used
            </p>
          </div>

          <div className="relative group/btn">
            <Button
              onClick={openCreate}
              disabled={isLimitReached}
              className="disabled:cursor-not-allowed"
            >
              <Plus />
              Schedule Post
            </Button>
            {isLimitReached && (
              <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 hidden w-max max-w-xs rounded-full border bg-card px-3 py-2 text-xs text-muted-foreground font-medium shadow-lg group-hover/btn:block">
                {nextResetText || ""}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-5 border-b">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "scheduled" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Scheduled ({userData?.postCounts?.pending || 0})
          </button>
          <button
            onClick={() => setActiveTab("published")}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "published" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Published ({userData?.postCounts?.done || 0})
          </button>
        </div>

        {/* Posts Grid */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader />
            </div>
          ) : (
            <>
              {activeTab === "scheduled" &&
                Array.from({
                  length: Math.max(0, quota.limit - quota.used),
                }).map((_, i) => (
                  <EmptySlotCard key={`empty-${i}`} onClick={openCreate} />
                ))}

              {(activeTab === "scheduled"
                ? scheduledPosts
                : publishedPosts
              ).map((post, index) => (
                <PostCard
                  key={post._id}
                  post={post}
                  index={index}
                  onEdit={setEditingPost}
                  onDelete={setDeletingPost}
                />
              ))}

              {activeTab === "scheduled" &&
                scheduledPosts.length === 0 &&
                quota.used >= quota.limit && (
                  <EmptyState>
                    You have filled all your post slots. {nextResetText || ""}.
                  </EmptyState>
                )}

              {activeTab === "published" && publishedPosts.length === 0 && (
                <EmptyState>You don't have any published posts yet.</EmptyState>
              )}
            </>
          )}
        </div>

        {/* Load More Button */}
        {!isLoading &&
          (activeTab === "scheduled" ? hasNextScheduled : hasNextPublished) && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() =>
                  activeTab === "scheduled"
                    ? fetchNextScheduled()
                    : fetchNextPublished()
                }
                disabled={
                  activeTab === "scheduled"
                    ? isFetchingNextScheduled
                    : isFetchingNextPublished
                }
                className="min-w-[140px]"
              >
                {(
                  activeTab === "scheduled"
                    ? isFetchingNextScheduled
                    : isFetchingNextPublished
                ) ? (
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

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
        }}
      />

      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
      />

      <DeleteConfirmModal
        title="Delete Post"
        description={`Are you sure you want to delete the post "${deletingPost?.title}"? (From this application). This action cannot be undone.`}
        isOpen={!!deletingPost}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleConfirmDeletePost}
        isPending={deletePost.isPending}
      />

      {showSuggestionsModal && (
        <SuggestionsSetupModal onClose={() => setShowSuggestionsModal(false)} />
      )}
    </ProtectedRoute>
  );
}
