import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@product/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteAvatarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarName?: string;
  onConfirm: () => Promise<void>;
}

export function DeleteAvatarModal({
  open,
  onOpenChange,
  avatarName,
  onConfirm,
}: DeleteAvatarModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this avatar?</AlertDialogTitle>
          <AlertDialogDescription>
            {avatarName ? `"${avatarName}"` : "This presenter"} will no longer be
            available for new videos. Videos already filmed with it are unaffected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Deleting" : "Delete avatar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
