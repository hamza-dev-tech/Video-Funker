import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { VerificationBanner } from "./VerificationBanner";

interface MainLayoutProps {
  children: React.ReactNode;
  /**
   * Skip the centred gutter for screens that lay themselves out edge to edge
   * and full height — the campaign workspace and Recon both build their own
   * scroll regions off `h-screen`, and wrapping those in padding gives the
   * page a second scrollbar.
   */
  bleed?: boolean;
}

/**
 * The frame every signed-in screen renders inside.
 *
 * The collapse state lives here rather than in the Sidebar, and that is a fix
 * rather than a preference: the sidebar is `position: fixed`, so the main
 * column has to reserve its width by hand. With the state hidden inside the
 * Sidebar the offset here was a hard-coded `ml-64` that never changed —
 * collapsing the nav left a 180px empty gutter down the left of every page,
 * which is most of what collapsing it was supposed to reclaim.
 */
/**
 * Where the collapse preference lives.
 *
 * MainLayout is rendered *inside* each page rather than as a router layout
 * route, so every navigation unmounts and remounts the entire chrome — and with
 * it any state held here. Collapse the sidebar, click Film, and it springs back
 * open; there was no way to keep it collapsed for more than one screen.
 *
 * The correct fix is to hoist MainLayout into a layout route so the chrome
 * never unmounts. That is a router change touching every page, so until then
 * the preference is read back from storage on each mount, which makes it stick
 * from the person's point of view.
 */
const COLLAPSE_KEY = "vf-sidebar-collapsed";

export function MainLayout({ children, bleed = false }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Private-mode or storage-full: the toggle still works for this screen.
      }
      return next;
    });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main
        className={`min-h-screen transition-[margin] duration-300 ${collapsed ? "ml-[76px]" : "ml-64"}`}
      >
        <VerificationBanner />
        {/* One place that owns the page gutter and the reading width. Pages
            used to bring their own `p-8`, so the left edge of the content
            moved a few pixels between screens and a wide table on a 27-inch
            monitor ran to 2,000px. */}
        {bleed ? children : <div className="mx-auto w-full max-w-[1180px] px-8 py-8">{children}</div>}
      </main>
    </div>
  );
}
