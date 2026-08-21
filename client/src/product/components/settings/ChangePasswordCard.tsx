import { useState } from "react";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Label } from "@product/components/ui/label";
import { Loader2, KeyRound, Check } from "lucide-react";
import { useAuth } from "@product/hooks/useAuth";
import { useToast } from "@product/hooks/use-toast";

/**
 * Changing your password while signed in.
 *
 * The endpoint (`PUT /auth/password`) and the client function
 * (`useAuth().updatePassword`) both already existed and were reachable from
 * nowhere. A signed-in customer who wanted to change their password had to sign
 * out and use "forgot password" — pretending to have lost access to an account
 * they were sitting inside — which sends an email code for no reason and reads
 * as a product that forgot to finish this screen.
 *
 * The whole feature was one form.
 */

const MIN_LENGTH = 8;

export function ChangePasswordCard() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    /*
      Checked here as well as on the server, and each message names the actual
      problem rather than saying the form is invalid.
    */
    if (!current) return setError("Enter your current password.");
    if (next.length < MIN_LENGTH)
      return setError(`Your new password needs at least ${MIN_LENGTH} characters.`);
    if (next === current)
      return setError("Your new password is the same as your current one.");
    if (next !== confirm) return setError("The two new passwords don't match.");

    setSaving(true);
    try {
      await updatePassword(current, next);
      reset();
      setDone(true);
      toast({
        title: "Password changed",
        description: "Use your new password next time you sign in.",
      });
      // The confirmation is a state, not a permanent banner.
      setTimeout(() => setDone(false), 6000);
    } catch (err: any) {
      // The server distinguishes a wrong current password from everything
      // else, so pass its message through rather than flattening it.
      setError(err?.message || "Couldn't change your password. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[14px] border border-border/70 bg-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" strokeWidth={1.9} />
        </span>
        <div>
          <p className="font-display text-[15.5px] font-bold text-foreground">Password</p>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
            Change it here without signing out.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="current-password" className="text-[13px] font-semibold">
            Current password
          </Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-[13px] font-semibold">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => {
                setNext(e.target.value);
                setError(null);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-[13px] font-semibold">
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError(null);
              }}
            />
          </div>
        </div>

        {error && (
          <p className="text-[13px] font-medium text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-0.5">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Changing" : "Change password"}
          </Button>
          {done && (
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              Changed
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default ChangePasswordCard;
