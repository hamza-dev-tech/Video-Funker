import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@product/components/ui/dialog";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Label } from "@product/components/ui/label";
import { Textarea } from "@product/components/ui/textarea";
import { Checkbox } from "@product/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@product/components/ui/radio-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@product/components/ui/input-otp";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@product/hooks/use-toast";
import { useAuth } from "@product/hooks/useAuth";
import { sendDeleteAccountOtp, deleteAccount } from "@product/lib/account-api";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

const DATA_TYPES = [
  "Campaigns",
  "Videos",
  "AI Avatars",
  "Recon Insights",
  "Generated Content",
  "Uploaded Files",
  "Usage History",
];

const REASONS = [
  "Too expensive",
  "Missing features",
  "Technical issues",
  "Poor AI results",
  "Found another solution",
  "Privacy concerns",
  "Temporary break",
  "Other",
];

export function DeleteAccountModal({
  open,
  onOpenChange,
  email,
}: DeleteAccountModalProps) {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [typed, setTyped] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);

  const busy = sending || deleting;

  const reset = useCallback(() => {
    setStep(1);
    setReason("");
    setFeedback("");
    setConfirmed(false);
    setTyped("");
    setOtp("");
    setOtpSent(false);
    setSending(false);
    setDeleting(false);
    setSuccess(false);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (busy) return; // prevent accidental closure during a request
    if (!next) reset();
    onOpenChange(next);
  };

  const reasonValid =
    !!reason && (reason !== "Other" || feedback.trim().length > 0);

  const handleSendOtp = async () => {
    setSending(true);
    const { error } = await sendDeleteAccountOtp();
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send the code", description: error.message, variant: "destructive" });
      return;
    }
    setOtpSent(true);
    toast({
      title: "Code sent",
      description: `We've sent a verification code to ${email}.`,
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteAccount({ otp, reason, feedback: feedback.trim() });
    setDeleting(false);
    if (error) {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setSuccess(true);
    setTimeout(async () => {
      await signOut();
      navigate("/auth", { replace: true });
    }, 2200);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <p className="font-medium text-foreground">
                You are about to permanently delete your account.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              The following will be permanently removed:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {DATA_TYPES.map((d) => (
                <li key={d} className="flex items-center gap-2 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  {d}
                </li>
              ))}
            </ul>
            <p className="text-sm font-semibold text-destructive">
              This action cannot be undone.
            </p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please tell us why you're leaving (required).
            </p>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-1">
              {REASONS.map((r) => (
                <div key={r} className="flex items-center gap-3 py-1">
                  <RadioGroupItem value={r} id={`reason-${r}`} />
                  <Label htmlFor={`reason-${r}`} className="font-normal cursor-pointer">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {reason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="feedback">Tell us more</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Help us improve…"
                  rows={3}
                className="resize-none"
                />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Checkbox
                id="confirm-delete"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="confirm-delete"
                className="font-normal leading-relaxed cursor-pointer"
              >
                I understand that all my data will be permanently deleted and
                cannot be recovered.
              </Label>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            <Label htmlFor="type-delete">
              Type <span className="font-mono font-bold text-red-500">'DELETE'</span> to confirm
            </Label>
            <Input
              id="type-delete"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For your security, verify the code sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
            {!otpSent ? (
              <Button onClick={handleSendOtp} disabled={sending} className="w-full">
                {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send verification code
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={sending}
                  className="w-full"
                >
                  {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Resend code
                </Button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const canContinue =
    (step === 1) ||
    (step === 2 && reasonValid) ||
    (step === 3 && confirmed) ||
    (step === 4 && typed === "DELETE");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => busy && e.preventDefault()}
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
      >
        {success ? (
          <div className="flex flex-col items-center text-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <DialogTitle>Account deleted</DialogTitle>
            <DialogDescription>
              Your account has been permanently deleted. Signing you out…
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {step === 5 ? (
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                )}
                <DialogTitle>Delete your account</DialogTitle>
              </div>
              <DialogDescription>Step {step} of 5</DialogDescription>
            </DialogHeader>

            <div className="py-2">{renderStep()}</div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              {step > 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={busy}
                  className="sm:mr-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="sm:mr-auto"
                >
                  Cancel
                </Button>
              )}

              {step < 5 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting || otp.length < 6}
                >
                  {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete Account
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
