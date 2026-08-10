import { Button } from "@/components/ui/button";
import { WorkingItem } from "@/types/extension";
import { Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WorkingListProps {
  items: WorkingItem[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const WorkingList = ({ items, onRetry, onDismiss }: WorkingListProps) => {
  if (items.length === 0) return null;

  return (
    <div className="border-b shrink-0">
      <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b">
        <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          Working ({items.filter((i) => i.status === "tailoring").length})
          {items.some((i) => i.status === "failed") && (
            <span className="text-destructive ml-1">
              · {items.filter((i) => i.status === "failed").length} failed
            </span>
          )}
        </h2>
      </div>
      <div className="max-h-[160px] overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-2 border-b last:border-b-0 ${
              item.status === "failed"
                ? "bg-destructive/5"
                : "bg-amber-50/50 dark:bg-amber-950/10"
            }`}
          >
            {/* Status icon */}
            {item.status === "tailoring" ? (
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {item.sourceTitle || "Job Description"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {item.status === "failed" ? (
                  <span className="text-destructive">{item.error || "Failed"}</span>
                ) : (
                  <>Tailoring... · {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</>
                )}
              </p>
            </div>

            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1"
              onClick={() => onRetry(item.id)}
              title={item.status === "tailoring" ? "Cancel and retry" : "Retry"}
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onDismiss(item.id)}
              title="Dismiss"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
