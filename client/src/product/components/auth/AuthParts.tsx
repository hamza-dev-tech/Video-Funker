import { forwardRef, ReactNode, useState } from "react";
import { Eye, EyeOff, Loader2, LucideIcon } from "lucide-react";
import { cn } from "@product/lib/utils";

/**
 * The pieces every sign-in screen is built from.
 *
 * They exist because the six screens in Auth.tsx were the same forty lines of
 * markup copied six times — icon, input, reveal toggle, error paragraph — and
 * every visual fix had to be made six times or it was made inconsistently.
 * One field component means the focus ring, the error state and the reveal
 * button are the same everywhere by construction.
 */

/* ── Heading ─────────────────────────────────────────────────────────────── */

export const AuthHeading = ({ title, sub }: { title: string; sub: ReactNode }) => (
  <div className="vf-auth-in" style={{ animationDelay: "120ms" }}>
    <h2 className="vf-auth-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-foreground">
      {title}
    </h2>
    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{sub}</p>
  </div>
);

/* ── Field ───────────────────────────────────────────────────────────────── */

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
  /** Renders the reveal toggle and flips the input's type. */
  reveal?: boolean;
  /** Sits opposite the label — used for "Forgot password?". */
  action?: ReactNode;
  hint?: string;
  /** Steps the entrance animation. */
  delay?: number;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, icon: Icon, error, reveal, action, hint, delay = 0, className, ...props }, ref) => {
    const [shown, setShown] = useState(false);
    const id = props.id || props.name;

    return (
      <div className="vf-auth-in" style={{ animationDelay: `${delay}ms` }}>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
            {label}
          </label>
          {action}
        </div>

        <div className="relative">
          <Icon
            className={cn(
              "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 transition-colors",
              error ? "text-destructive" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
          <input
            ref={ref}
            id={id}
            /*
              The type flips rather than the input being replaced, so React keeps
              the same DOM node and the caret does not jump to the end when the
              eye is clicked mid-word.
            */
            {...props}
            type={reveal ? (shown ? "text" : "password") : props.type}
            aria-invalid={error ? true : undefined}
            className={cn("vf-auth-input", reveal && "pr-11", error && "vf-auth-input-error", className)}
          />
          {reveal && (
            <button
              type="button"
              onClick={() => setShown((s) => !s)}
              /* tabIndex -1: the tab order should run label → field → next
                 field. A reveal toggle between them makes a keyboard user press
                 Tab twice per password, every time. */
              tabIndex={-1}
              aria-label={shown ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {shown ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          )}
        </div>

        {/* Error wins over hint: showing "min 8 characters" underneath "password
            is too short" says the same thing twice and buries the correction. */}
        {error ? (
          <p className="vf-auth-err mt-1.5 text-[13px] font-medium text-destructive">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  }
);
AuthField.displayName = "AuthField";

/* ── Password strength ───────────────────────────────────────────────────── */

/**
 * Scored against the rule the form actually enforces — 8 characters, an
 * uppercase, a lowercase and a number — so the meter and the validator can
 * never disagree. A meter that reads "strong" on a password the server then
 * rejects is worse than no meter.
 */
export const passwordScore = (value: string) => {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (value.length >= 12 && /[^A-Za-z0-9]/.test(value)) score++;
  return score;
};

const STRENGTH = [
  { label: "", color: "" },
  { label: "Weak", color: "hsl(var(--destructive))" },
  { label: "Fair", color: "#d96b00" },
  { label: "Good", color: "hsl(var(--success))" },
  { label: "Strong", color: "hsl(var(--success))" },
];

export const PasswordStrength = ({ value }: { value: string }) => {
  const score = passwordScore(value);
  if (!value) return null;
  const { label, color } = STRENGTH[score];

  return (
    <div className="mt-2.5 flex items-center gap-2.5" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className="h-[3px] flex-1 rounded-full transition-colors duration-300"
            style={{ background: step <= score ? color : "hsl(var(--muted))" }}
          />
        ))}
      </div>
      <span className="w-11 text-right text-[12px] font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

/* ── Submit ──────────────────────────────────────────────────────────────── */

interface AuthSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
  delay?: number;
}

export const AuthSubmit = ({
  loading,
  loadingLabel,
  children,
  delay = 0,
  ...props
}: AuthSubmitProps) => (
  <div className="vf-auth-in" style={{ animationDelay: `${delay}ms` }}>
    <button
      {...props}
      disabled={loading || props.disabled}
      /* Orange, matching "Start free" on the marketing site. The product's own
         navy primary is the right colour for actions inside the workspace, but
         this button is the other end of the same journey as the homepage CTA
         and should look like it. */
      className="vf-auth-cta"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  </div>
);

/* ── Footer link ─────────────────────────────────────────────────────────── */

export const AuthSwitch = ({
  prompt,
  action,
  onClick,
  delay = 0,
}: {
  prompt?: string;
  action: string;
  onClick: () => void;
  delay?: number;
}) => (
  <p
    className="vf-auth-in text-center text-[14.5px] text-muted-foreground"
    style={{ animationDelay: `${delay}ms` }}
  >
    {prompt ? `${prompt} ` : null}
    <button type="button" onClick={onClick} className="vf-auth-link">
      {action}
    </button>
  </p>
);

/* ── Reset-flow steps ────────────────────────────────────────────────────── */

/**
 * Numbered because this genuinely is a sequence — email, then code, then new
 * password — and a person halfway through it needs to know how much is left.
 * Nothing else in this screen is numbered, which is what keeps the numbers
 * meaning something.
 */
const RESET_STEPS = ["Email", "Code", "New password"];

export const ResetSteps = ({ current }: { current: 0 | 1 | 2 }) => (
  <ol className="vf-auth-in mb-7 flex items-center gap-2" style={{ animationDelay: "60ms" }}>
    {RESET_STEPS.map((label, i) => {
      const state = i < current ? "done" : i === current ? "now" : "next";
      return (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span className={cn("vf-auth-step", `is-${state}`)}>{i + 1}</span>
          <span
            className={cn(
              "hidden text-[12.5px] sm:block",
              state === "now" ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          {i < RESET_STEPS.length - 1 && (
            <span
              className="ml-1 h-px flex-1 transition-colors"
              style={{ background: i < current ? "hsl(var(--primary))" : "hsl(var(--border))" }}
            />
          )}
        </li>
      );
    })}
  </ol>
);
