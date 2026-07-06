"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

const PREDEFINED_TOPICS = [
  "AI",
  "Data Engineering",
  "Web Development",
  "Design",
  "Marketing",
  "SaaS",
  "Startups",
  "Machine Learning",
  "Cloud Computing",
  "Cybersecurity",
  "Productivity",
];

interface SuggestionsSetupModalProps {
  onClose: () => void;
  initialTopics?: string[];
}

export function SuggestionsSetupModal({
  onClose,
  initialTopics = [],
}: SuggestionsSetupModalProps) {
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
      toast.success("Preferences updated successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update preferences"
      );
    },
  });

  const handleSubmit = () => {
    let finalTopics = [...selectedTopics];
    if (showOther && customTopic.trim()) {
      // Split by comma if user enters multiple custom topics
      const customTopics = customTopic
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      finalTopics = [...finalTopics, ...customTopics];
      
      // Remove duplicates
      finalTopics = Array.from(new Set(finalTopics));
    }
    
    if (finalTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }

    updatePreferences.mutate(finalTopics);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Get AI Post Suggestions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select the topics you usually post about. We'll find the latest news
            and generate high-quality post ideas for you.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {PREDEFINED_TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="size-3.5" />}
                {topic}
              </button>
            );
          })}
          
          <button
            onClick={() => setShowOther(!showOther)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              showOther
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Other
          </button>
        </div>

        {showOther && (
          <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-200">
            <input
              type="text"
              placeholder="Tell what you wanna get post suggestions about (comma separated)"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full border-b border-border bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              autoFocus
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={updatePreferences.isPending}
            className="rounded-full"
          >
            Not now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updatePreferences.isPending}
            className="rounded-full px-6"
          >
            {updatePreferences.isPending ? "Saving..." : "Start getting suggestions"}
          </Button>
        </div>
      </div>
    </div>
  );
}
