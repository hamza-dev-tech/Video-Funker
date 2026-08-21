import { MailWarning, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@product/components/ui/button";
import { useVerification } from "@product/context/VerificationProvider";
import { sendVerificationOtp } from "@product/lib/verification-api";
import { useToast } from "@product/hooks/use-toast";

/**
 * The strip above every screen until the account's email is confirmed.
 *
 * It has to sit at the top of a workspace someone is trying to use, on every
 * page, possibly for days — so it is written to be read once and then ignored,
 * not to alarm. That means an envelope rather than a warning triangle, a single
 * line rather than a list of five blocked features, and the plain surface
 * treatment the rest of the product uses. The old version stacked an amber
 * caution triangle on an amber wash above a sentence naming everything that did
 * not work, which reads as a fault in the product rather than one unfinished
 * step in signing up.
 *
 * The action is deliberately quiet too. Verifying is worth doing, but it is not
 * the thing the person came to this screen for, and an orange CTA here would
 * outrank the actual job on every page in the app.
 */
export function VerificationBanner() {
  const { user, isVerified, openVerificationModal } = useVerification();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  if (!user || isVerified) return null;

  const handleResend = async () => {
    setResending(true);
    const { error } = await sendVerificationOtp();
    setResending(false);
    if (error) {
      toast({ title: "Couldn't send the code", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Code sent", description: "Check your inbox for a fresh six-digit code." });
  };

  return (
    <div className="border-b border-[#f0d9b5] bg-[#fdf6ec]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-8 py-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <MailWarning className="h-[18px] w-[18px] flex-none text-[#a85800]" strokeWidth={1.9} />
          <p className="text-[14px] text-[#5c4218]">
            <span className="font-semibold text-[#432f10]">Confirm your email</span> to
            create campaigns, generate content and film video.
          </p>
        </div>

        <div className="flex flex-none items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleResend} disabled={resending}>
            {resending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Resend code
          </Button>
          <Button size="sm" onClick={() => openVerificationModal()}>
            Enter code
          </Button>
        </div>
      </div>
    </div>
  );
}
