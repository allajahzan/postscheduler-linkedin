"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/form-fields";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { SuggestionTopics } from "./suggestion-topics";

interface SuggestionsSetupProps {
  onClose: () => void;
  initialTopics?: string[];
}

export function SuggestionsSetup({
  onClose,
  initialTopics = [],
}: SuggestionsSetupProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialTopics);
  const [showOther, setShowOther] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  const queryClient = useQueryClient();

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics((prev) => prev.filter((t) => t !== topic));
    } else {
      setSelectedTopics((prev) => [...prev, topic]);
    }
  };

  const updatePreferences = useMutation({
    mutationFn: async (topics: string[]) => {
      const res = await api.patch("/user/preferences", {
        suggestions_enabled: true,
        topics,
      });
      return res.data;
    },
    onSuccess: (_, newTopics) => {
      queryClient.setQueryData(["user"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          user: {
            ...old.user,
            preferences: {
              ...old.user.preferences,
              suggestions_enabled: true,
              topics: newTopics,
            },
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Preferences saved");
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update preferences",
      );
    },
  });

  const handleSubmit = () => {
    let finalTopics = [...selectedTopics];
    if (showOther && customTopic.trim()) {
      const customTopics = customTopic
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      finalTopics = [...finalTopics, ...customTopics];
      finalTopics = Array.from(new Set(finalTopics));
    }

    if (finalTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }

    updatePreferences.mutate(finalTopics);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-card">
      <div className="relative w-full max-w-2xl p-6 flex flex-col gap-5 h-auto overflow-y-auto">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">
            Get AI Post Suggestions
          </h2>
          <p className="text-sm text-muted-foreground">
            Select the topics you usually post about. We'll find the latest news
            and generate high-quality post ideas for you.
          </p>
        </div>

        <SuggestionTopics
          selectedTopics={selectedTopics}
          toggleTopic={toggleTopic}
          showOther={showOther}
          setShowOther={setShowOther}
          customTopic={customTopic}
          setCustomTopic={setCustomTopic}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={updatePreferences.isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            Not now
          </Button>
          <SubmitButton
            type="button"
            onClick={handleSubmit}
            isPending={updatePreferences.isPending}
            loadingText="Saving..."
          >
            Start getting suggestions
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
