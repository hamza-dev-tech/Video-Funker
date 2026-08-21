import { ReactNode } from "react";
import { Play } from "lucide-react";
import RibbonField from "./RibbonField";

/**
 * The frame every sign-in screen sits in.
 *
 * A split: the brand argument on the left over the marketing site's own ribbon
 * field, the form on the right on white. The dark half is doing work beyond
 * decoration — against navy, the white form panel reads as the one thing on
 * the page to act on, which a 50/50 pastel gradient never managed.
 *
 * Below 1024px the left panel is dropped entirely rather than stacked. It is
 * argument, not instruction; on a phone it would push the form below the fold,
 * and someone opening a login on their phone has already decided.
 */

/**
 * The headline, deliberately not the marketing site's tagline.
 *
 * The site opens with "AI writes it. A lifelike presenter delivers it. You book
 * meetings." That works on a homepage, where the visitor does not yet know what
 * the product is and the three-beat rhythm carries them through the mechanism.
 * It reads as sales copy on a sign-in screen, and it leads with the commodity —
 * every tool on the market says "AI writes it", so the first four words of the
 * page are the least distinctive thing about the company.
 *
 * This leads with the outcome and puts the surprise last, on the accent:
 * showing up on camera weekly is the thing the buyer wants and cannot do; not
 * having to film is the thing only this product offers. Two sentences, plain
 * words, no adjectives doing the work.
 */
const HEADLINE_LEAD = "Show up on camera every week.";
const HEADLINE_ACCENT = "Without ever filming.";

interface AuthShellProps {
  children: ReactNode;
  /** Drives the trace along the card's top edge while a request is in flight. */
  busy?: boolean;
}

export const AuthShell = ({ children, busy }: AuthShellProps) => (
  <div className="vf-auth flex min-h-screen bg-background">
    {/* ── Brand panel ──────────────────────────────────────────────────── */}
    <div className="relative hidden overflow-hidden lg:flex lg:w-[46%] xl:w-1/2">
      <RibbonField />

      {/*
        A vignette over the field. Ribbons drift wherever the noise sends them,
        so on some frames a bright one passes directly under the headline; this
        keeps the type's contrast constant no matter what the animation does.
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(3,20,38,.86) 0%, rgba(4,26,48,.52) 55%, rgba(4,26,48,.24) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
        {/* Lockup. The full logo is dark-on-transparent and disappears against
            navy, so the mark sits in a white tile and the wordmark is set in
            the site's display face. Swap in a reversed logo here if one exists. */}
        <div className="vf-auth-in flex items-center gap-3" style={{ animationDelay: "40ms" }}>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg">
            <img src="/brand/mark.png" alt="" className="h-7 w-7 object-contain" />
          </span>
          <span className="vf-auth-display text-[22px] font-bold tracking-tight text-white">
            Video Funker
          </span>
        </div>

        <div className="max-w-[30rem]">
          <h1
            className="vf-auth-in vf-auth-display text-[clamp(30px,3.2vw,44px)] font-bold leading-[1.08] tracking-[-0.025em] text-white"
            style={{ animationDelay: "140ms" }}
          >
            {HEADLINE_LEAD}{" "}
            {/* The accent bar echoes the highlighter under "Video wins." on the
                homepage — the same motif, so the two pages rhyme. */}
            <span className="vf-auth-mark relative whitespace-nowrap">
              {HEADLINE_ACCENT}
              <span className="vf-auth-mark-bar" aria-hidden="true" />
            </span>
          </h1>

          <p
            className="vf-auth-in mt-6 text-[17px] leading-relaxed text-[#b9d6f2]"
            style={{ animationDelay: "240ms" }}
          >
            One intake call becomes a month of scripts, presenter-led video and
            outreach — published while you get on with the business.
          </p>

          {/* One artefact, floating — the same device the homepage uses to show
              the output rather than describe it. */}
          <div
            className="vf-auth-in vf-auth-float mt-10 w-[19rem] rounded-2xl border p-4 backdrop-blur-md"
            style={{
              animationDelay: "360ms",
              background: "rgba(255,255,255,.09)",
              borderColor: "rgba(255,255,255,.16)",
              boxShadow: "0 24px 60px rgba(3,20,38,.45)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full"
                style={{ background: "#ff901b" }}
              >
                <Play className="h-4 w-4 fill-current" style={{ color: "#2a1a04" }} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-white">
                  Why your ICP ignores cold email
                </p>
                <p className="text-[12px] text-[#8bc6ff]">Presenter video · 47s</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-5 text-[12px] text-[#b9d6f2]">
              <span>
                <span className="font-semibold text-white">12.4k</span> views
              </span>
              <span>
                <span className="font-semibold text-white">38</span> replies
              </span>
              <span>
                <span className="font-semibold text-white">6</span> meetings
              </span>
            </div>
          </div>
        </div>

        <p
          className="vf-auth-in text-[13px] text-[#8bc6ff]"
          style={{ animationDelay: "460ms" }}
        >
          Built for founder-led B2B teams
        </p>
      </div>
    </div>

    {/* ── Form panel ───────────────────────────────────────────────────── */}
    <div className="vf-auth-formside flex w-full items-center justify-center px-5 py-12 lg:w-[54%] xl:w-1/2 sm:px-10">
      <div className="w-full max-w-[27rem]">
        {/* The lockup the small screens get, since the brand panel is gone. */}
        <div className="vf-auth-in mb-8 flex justify-center lg:hidden" style={{ animationDelay: "40ms" }}>
          <img src="/brand/logo.png" alt="Video Funker" className="h-8 w-auto object-contain" />
        </div>

        <div className="vf-auth-in vf-auth-rim" style={{ animationDelay: "80ms" }}>
          {/* Rendered only while submitting, so the element does not sit in the
              DOM animating a hidden bar for the life of the page. */}
          {busy && (
            <div className="vf-auth-track" role="progressbar" aria-label="Signing you in">
              <span />
            </div>
          )}
          <div className="vf-auth-card">{children}</div>
        </div>
      </div>
    </div>
  </div>
);

export default AuthShell;
