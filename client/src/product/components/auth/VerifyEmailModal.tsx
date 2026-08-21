import { useState, useEffect, useCallback } from "react";
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
import { Loader2, MailCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@product/hooks/use-toast";
import { otpSchema } from "@product/lib/auth-validation";
import { sendVerificationOtp, verifyEmail } from "@product/lib/verification-api";
import type { ApiUser } from "@product/lib/api-client";

interface VerifyEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerified: (user: ApiUser) => void;
}

export function VerifyEmailModal({
  open,
  onOpenChange,
  email,
  onVerified,
}: VerifyEmailModalProps) {
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const doSend = useCallback(async () => {
    setSending(true);
    const { error } = await sendVerificationOtp();
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send the code", description: error.message, variant: "destructive" });
      return;
    }
    setHasSent(true);
    toast({
      title: "Code sent",
      description: `We've sent a verification code to ${email}.`,
    });
  }, [email, toast]);

  // Auto-send an OTP when the modal first opens.
  useEffect(() => {
    if (open && !hasSent && !success) {
      doSend();
    }
    if (!open) {
      // Reset transient state when closed.
      setOtp("");
      setSuccess(false);
      setHasSent(false);
    }
  }, [open, hasSent, success, doSend]);

  const handleVerify = async () => {
    const parsed = otpSchema.safeParse(otp);
    if (!parsed.success) {
      toast({
        title: "Invalid code",
        description: parsed.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    setVerifying(true);
    const { data, error } = await verifyEmail(otp.trim());
    setVerifying(false);
    if (error || !data) {
      toast({
        title: "Verification failed",
        description: error?.message || "Could not verify your email.",
        variant: "destructive",
      });
      return;
    }
    setSuccess(true);
    toast({ title: "Email verified", description: "Your email is now verified." });
    setTimeout(() => onVerified(data.user), 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <DialogTitle>Email confirmed</DialogTitle>
            <DialogDescription>
              You're all set. Unlocking your action…
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <MailCheck className="w-5 h-5 text-primary" />
                <DialogTitle>Confirm your email</DialogTitle>
              </div>
              {/*
                One sentence. The original listed all five gated features, which
                is the same information the person already hit a wall on — they
                are here because something was blocked, not to read a catalogue.
              */}
              <DialogDescription className="pt-2">
                We sent a six-digit code to your inbox. Enter it to unlock
                campaigns, content and video.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Email address</Label>
                <Input value={email} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Verification code</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="sm:mr-auto"
              >
                Not now
              </Button>
              <Button variant="outline" onClick={doSend} disabled={sending}>
                {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Resend code
              </Button>
              <Button
                variant="cta"
                onClick={handleVerify}
                disabled={verifying || otp.length < 6}
              >
                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {verifying ? "Checking" : "Confirm email"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
