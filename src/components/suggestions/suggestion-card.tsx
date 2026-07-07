import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suggestion } from "@/hooks/use-suggestions";
import { LinkedInIcon } from "../common/linkedin-icon";
import { AppBadge } from "@/components/common/badge";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onUse: (suggestion: Suggestion) => void;
}

export function SuggestionCard({ suggestion, onUse }: SuggestionCardProps) {
  return (
    <div className="group relative p-5 flex flex-col justify-between overflow-hidden bg-linear-to-b from-card to-card/50 border border-primary/10 rounded-2xl shadow-sm transition-all hover:border-primary/30 hover:shadow-lg">
      <div className="relative z-10 space-y-2">
        <div className="mb-5 flex items-center justify-between">
          <AppBadge className="">{suggestion.topic}</AppBadge>
          <span className="text-[11px] font-medium text-muted-foreground">
            {formatDistanceToNow(new Date(suggestion.generated_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <h3 className="text-sm font-semibold transition-colors line-clamp-2">
          {suggestion.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
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
          variant="ghost"
          onClick={() => onUse(suggestion)}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ArrowUpRight />
          Select
        </Button>
      </div>
    </div>
  );
}
