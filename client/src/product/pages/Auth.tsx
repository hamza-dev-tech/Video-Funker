import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, KeyRound, MailCheck as MailCheckIcon } from "lucide-react";
import AuthShell from "@product/components/auth/AuthShell";
import {
  AuthField,
  AuthHeading,
  AuthSubmit,
  AuthSwitch,
  PasswordStrength,
  ResetSteps,
} from "@product/components/auth/AuthParts";
import { useToast } from "@product/hooks/use-toast";
import { useAuth } from "@product/hooks/useAuth";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  LoginFormData,
  SignupFormData,
  ForgotPasswordFormData,
  VerifyOtpFormData,
  ResetPasswordFormData,
} from "@product/lib/auth-validation";
import {
  requestPasswordResetOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
} from "@product/lib/password-reset-api";
import { VerifyEmailModal } from "@product/components/auth/VerifyEmailModal";
import { useVerification } from "@product/context/VerificationProvider";

type AuthMode = "login" | "signup" | "forgot" | "verify" | "reset" | "welcome";

/**
 * The two entry modes a URL is allowed to select.
 *
 * Only these two. The other four (`forgot`, `verify`, `reset`, `welcome`) are
 * steps in a flow that carry state this component holds in memory — a reset OTP,
 * the email being verified — so arriving at them straight from a link would
 * render a form with nothing behind it.
 */
const URL_MODES: AuthMode[] = ["login", "signup"];

const Auth = () => {
  /**
   * `?mode=signup` opens the sign-up form.
   *
   * The marketing site has "Start free" buttons on nine pages and a /signup
   * redirect pointing here. Without this they all landed on the SIGN IN form
   * and the visitor had to find the small "Sign up" link at the bottom to do
   * the thing they had just clicked a button to do. `useSearchParams` was
   * already imported for this and never called.
   *
   * Read once, as the initial state rather than in an effect: setting it after
   * mount renders the login form first and visibly swaps it.
   */
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => {
    const requested = searchParams.get("mode") as AuthMode | null;
    return requested && URL_MODES.includes(requested) ? requested : "login";
  });
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [welcomeEmail, setWelcomeEmail] = useState("");
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshUser } = useVerification();

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signIn, signUp } = useAuth();

  // Redirect authenticated users (but not during the welcome onboarding step)
  useEffect(() => {
    if (!loading && user && mode !== "welcome") {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, mode]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Signup form
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        refreshUser();
        navigate("/", { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Account created!",
          description: "You have successfully signed up and are now logged in.",
        });
        refreshUser();
        setWelcomeEmail(data.email);
        setMode("welcome");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password forms
  const forgotForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: "", otp: "" },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const goToForgot = () => {
    forgotForm.reset({ email: loginForm.getValues("email") || "" });
    setMode("forgot");
  };

  const handleForgot = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await requestPasswordResetOtp(data.email);
      if (error) {
        toast({
          variant: "destructive",
          title: "Request failed",
          description: error.message,
        });
      } else {
        setResetEmail(data.email);
        verifyForm.reset({ email: data.email, otp: "" });
        toast({
          title: "Check your email",
          description: "If an account exists, a 6-digit OTP has been sent.",
        });
        setMode("verify");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (data: VerifyOtpFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await verifyResetOtp(data.email, data.otp);
      if (error) {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: error.message,
        });
      } else {
        setResetOtp(data.otp);
        resetForm.reset({ password: "", confirmPassword: "" });
        toast({
          title: "OTP verified",
          description: "You can now set a new password.",
        });
        setMode("reset");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await resetPasswordWithOtp(
        resetEmail,
        resetOtp,
        data.password,
      );
      if (error) {
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Password reset",
          description: "Your password has been updated. Please sign in.",
        });
        setResetEmail("");
        setResetOtp("");
        loginForm.reset({ email: resetEmail, password: "" });
        setMode("login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
    A full-screen spinner rather than the form, because `loading` here means
    "we are asking the API whether the stored token is still valid". Showing
    the sign-in form during that check flashes a login screen at someone who is
    already signed in, and they start typing into a form that is about to be
    replaced.
  */
  if (loading) {
    return (
      <div className="vf-auth flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const signupPassword = signupForm.watch("password") || "";
  const resetPassword = resetForm.watch("password") || "";

  return (
    <AuthShell busy={isSubmitting}>
      {/*
        `key={mode}` remounts this block on every step change, which is what
        replays the staggered entrance. Without it React reconciles the two
        forms into the same nodes and the new screen simply appears, which
        reads as a flicker rather than a transition.
      */}
      <div key={mode} className="space-y-7">
        {/* ── Sign in ─────────────────────────────────────────────────── */}
        {mode === "login" && (
          <>
            <AuthHeading title="Welcome back" sub="Sign in to your workspace." />

            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <AuthField
                label="Email"
                icon={Mail}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                delay={200}
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register("email")}
              />

              <AuthField
                label="Password"
                icon={Lock}
                id="password"
                reveal
                autoComplete="current-password"
                placeholder="Your password"
                delay={260}
                error={loginForm.formState.errors.password?.message}
                action={
                  <button type="button" onClick={goToForgot} className="vf-auth-link text-[13px]">
                    Forgot password?
                  </button>
                }
                {...loginForm.register("password")}
              />

              <div className="pt-1">
                <AuthSubmit loading={isSubmitting} loadingLabel="Signing in" delay={320}>
                  Sign in
                </AuthSubmit>
              </div>
            </form>

            <AuthSwitch
              prompt="New to Video Funker?"
              action="Create an account"
              onClick={() => setMode("signup")}
              delay={380}
            />
          </>
        )}

        {/* ── Sign up ─────────────────────────────────────────────────── */}
        {mode === "signup" && (
          <>
            <AuthHeading
              title="Create your account"
              sub="Your first video is free. No card, no commitment."
            />

            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <AuthField
                label="Work email"
                icon={Mail}
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                delay={200}
                error={signupForm.formState.errors.email?.message}
                {...signupForm.register("email")}
              />

              <div>
                <AuthField
                  label="Password"
                  icon={Lock}
                  id="signup-password"
                  reveal
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  delay={260}
                  hint="8+ characters, with an uppercase, a lowercase and a number."
                  error={signupForm.formState.errors.password?.message}
                  {...signupForm.register("password")}
                />
                <PasswordStrength value={signupPassword} />
              </div>

              <AuthField
                label="Confirm password"
                icon={Lock}
                id="confirm-password"
                reveal
                autoComplete="new-password"
                placeholder="Type it once more"
                delay={320}
                error={signupForm.formState.errors.confirmPassword?.message}
                {...signupForm.register("confirmPassword")}
              />

              <div className="pt-1">
                <AuthSubmit loading={isSubmitting} loadingLabel="Creating account" delay={380}>
                  Create account
                </AuthSubmit>
              </div>
            </form>

            <AuthSwitch
              prompt="Already have an account?"
              action="Sign in"
              onClick={() => setMode("login")}
              delay={440}
            />
          </>
        )}

        {/* ── Forgot password ─────────────────────────────────────────── */}
        {mode === "forgot" && (
          <>
            <ResetSteps current={0} />
            <AuthHeading
              title="Reset your password"
              sub="Tell us the email on the account and we'll send a 6-digit code."
            />

            <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
              <AuthField
                label="Email"
                icon={Mail}
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                delay={200}
                error={forgotForm.formState.errors.email?.message}
                {...forgotForm.register("email")}
              />

              <div className="pt-1">
                <AuthSubmit loading={isSubmitting} loadingLabel="Sending code" delay={260}>
                  Send code
                </AuthSubmit>
              </div>
            </form>

            <AuthSwitch action="Back to sign in" onClick={() => setMode("login")} delay={320} />
          </>
        )}

        {/* ── Enter code ──────────────────────────────────────────────── */}
        {mode === "verify" && (
          <>
            <ResetSteps current={1} />
            <AuthHeading
              title="Enter your code"
              sub={
                <>
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-foreground">
                    {resetEmail || "your email"}
                  </span>
                  . It expires in 10 minutes.
                </>
              }
            />

            <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-4">
              <AuthField
                label="Verification code"
                icon={KeyRound}
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                delay={200}
                className="text-center text-[19px] font-semibold tracking-[0.55em]"
                error={verifyForm.formState.errors.otp?.message}
                {...verifyForm.register("otp")}
              />

              <div className="pt-1">
                <AuthSubmit loading={isSubmitting} loadingLabel="Checking code" delay={260}>
                  Continue
                </AuthSubmit>
              </div>
            </form>

            <AuthSwitch
              prompt="Didn't get it?"
              action="Send another"
              onClick={() => setMode("forgot")}
              delay={320}
            />
          </>
        )}

        {/* ── New password ────────────────────────────────────────────── */}
        {mode === "reset" && (
          <>
            <ResetSteps current={2} />
            <AuthHeading title="Choose a new password" sub="You'll use this to sign in from now on." />

            <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
              <div>
                <AuthField
                  label="New password"
                  icon={Lock}
                  id="reset-password"
                  reveal
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  delay={200}
                  hint="8+ characters, with an uppercase, a lowercase and a number."
                  error={resetForm.formState.errors.password?.message}
                  {...resetForm.register("password")}
                />
                <PasswordStrength value={resetPassword} />
              </div>

              <AuthField
                label="Confirm password"
                icon={Lock}
                id="reset-confirm-password"
                reveal
                autoComplete="new-password"
                placeholder="Type it once more"
                delay={260}
                error={resetForm.formState.errors.confirmPassword?.message}
                {...resetForm.register("confirmPassword")}
              />

              <div className="pt-1">
                <AuthSubmit loading={isSubmitting} loadingLabel="Saving" delay={320}>
                  Save and sign in
                </AuthSubmit>
              </div>
            </form>

            <AuthSwitch action="Back to sign in" onClick={() => setMode("login")} delay={380} />
          </>
        )}

        {/* ── Verify email (straight after signup) ────────────────────── */}
        {mode === "welcome" && (
          <div className="text-center">
            <div
              className="vf-auth-in mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ animationDelay: "80ms", background: "hsl(var(--primary) / 0.1)" }}
            >
              <MailCheckIcon className="h-7 w-7 text-primary" />
            </div>

            <div className="mt-6">
              <AuthHeading
                title="You're in. One last thing."
                sub={
                  <>
                    We sent a code to{" "}
                    <span className="font-semibold text-foreground">
                      {welcomeEmail || "your email"}
                    </span>
                    . Verifying unlocks campaigns, content and video generation.
                  </>
                }
              />
            </div>

            <div className="mt-7 space-y-4">
              <AuthSubmit onClick={() => setWelcomeModalOpen(true)} delay={260}>
                Verify email
              </AuthSubmit>

              <AuthSwitch
                action="Skip for now"
                onClick={() => navigate("/", { replace: true })}
                delay={320}
              />
            </div>
          </div>
        )}
      </div>

      <VerifyEmailModal
        open={welcomeModalOpen}
        onOpenChange={setWelcomeModalOpen}
        email={welcomeEmail}
        onVerified={() => {
          setWelcomeModalOpen(false);
          navigate("/", { replace: true });
        }}
      />
    </AuthShell>
  );
};

export default Auth;
