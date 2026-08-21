import { Button } from "@product/components/ui/button";
import { Badge } from "@product/components/ui/badge";
import { Loader2, AlertTriangle, Check, User } from "lucide-react";
import type { HeygenAvatar } from "@product/lib/heygen-api";
import { cn } from "@product/lib/utils";

interface StepAvatarProps {
  avatars: HeygenAvatar[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
  onLoadMore: () => void;
}

export function StepAvatar({
  avatars,
  loading,
  loadingMore,
  error,
  hasMore,
  selectedId,
  onSelect,
  onClear,
  onLoadMore,
}: StepAvatarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <User className="w-5 h-5 text-primary" /> Select an Avatar
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose the avatar that will present your video.
          </p>
        </div>
        {selectedId && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading avatars...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      ) : avatars.length === 0 ? (
        <p className="text-sm text-muted-foreground">No avatars available.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[460px] overflow-y-auto pr-1">
            {avatars.map((a) => {
              const selected = selectedId === a.avatar_id;
              const isCustom = a.type === "custom";
              /*
                An avatar that is still being built cannot render a video.

                The server already sends each avatar's status and this grid
                ignored it, so a presenter created a minute earlier looked
                exactly like a finished one. Selecting it, waiting, and then
                getting HeyGen's raw internal error text in a red toast was the
                first anyone heard of it — on a click the app could have
                answered instantly.

                Blocked rather than warned, deliberately: unlike the face check
                on a photo, this is not a guess. A presenter that is not ready
                will fail, every time.
              */
              const notReady = !!a.status && a.status !== "completed";
              const failed = a.status === "failed";
              return (
                <button
                  type="button"
                  key={a.avatar_id}
                  disabled={notReady}
                  title={
                    failed
                      ? "This presenter failed to generate."
                      : notReady
                        ? "Still being created. It becomes selectable when it is ready."
                        : a.name
                  }
                  onClick={() => onSelect(a.avatar_id)}
                  className={cn(
                    "group relative rounded-xl border overflow-hidden bg-card transition-all text-left",
                    notReady && "cursor-not-allowed opacity-60",
                    selected
                      ? "border-primary ring-2 ring-primary/40 shadow-md"
                      : notReady
                        ? "border-border"
                        : "border-border hover:border-primary/50 hover:shadow-sm",
                  )}
                >
                  <div className="aspect-square bg-[#f8fafc] overflow-hidden relative">
                    {a.preview_image_url ? (
                      <img
                        src={a.preview_image_url}
                        alt={a.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      variant={isCustom ? "default" : "secondary"}
                      className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0 h-4"
                    >
                      {isCustom ? "Custom" : "HeyGen"}
                    </Badge>
                    {selected && !notReady && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    {notReady && (
                      <span
                        className={cn(
                          "absolute inset-x-0 bottom-0 px-1.5 py-1 text-center text-[10px] font-medium backdrop-blur-sm",
                          failed
                            ? "bg-destructive/85 text-destructive-foreground"
                            : "bg-foreground/70 text-background",
                        )}
                      >
                        {failed ? "Failed" : "Still preparing"}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p
                      className="text-xs font-medium text-foreground truncate"
                      title={a.name}
                    >
                      {a.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
