import { useEffect, useState } from "react";
import { fetchCampaignReport } from "@product/lib/reports-api";

/**
 * Which stages of a campaign are actually finished.
 *
 * The next-step card was originally keyed to the page you were on: standing on
 * the ICP screen meant the next thing was Content, always. That is right the
 * first time through and wrong on every visit after it — someone who had
 * already written the content and filmed the video was still being told to go
 * and write the content, on a screen they had opened to check something else.
 *
 * Reading the real state costs one request, and the report endpoint is counts
 * rather than documents, so it is cheap. The alternative — threading progress
 * down through four unrelated pages — would put the same fetch in more places.
 */

export interface CampaignProgress {
  hasIcp: boolean;
  hasContent: boolean;
  hasVideo: boolean;
  /** True until the first response lands, so nothing renders on a guess. */
  loading: boolean;
}

export function useCampaignProgress(campaignId?: string): CampaignProgress {
  const [state, setState] = useState<CampaignProgress>({
    hasIcp: false,
    hasContent: false,
    hasVideo: false,
    loading: true,
  });

  useEffect(() => {
    if (!campaignId) {
      setState({ hasIcp: false, hasContent: false, hasVideo: false, loading: false });
      return;
    }

    let active = true;
    setState((s) => ({ ...s, loading: true }));

    fetchCampaignReport(campaignId)
      .then((r) => {
        if (!active) return;
        setState({
          hasIcp: r.flags.icpCompleted,
          // A content record with no script is not a finished stage — the
          // video step has nothing to work from until the script exists.
          hasContent: r.sections.some((s) => s.key === "videoScript" && s.status === "completed"),
          hasVideo: r.videoBreakdown.ready > 0,
          loading: false,
        });
      })
      .catch(() => {
        /*
          Stay silent on failure. This drives a suggestion, not a warning — an
          error here should hide the card rather than put a red box on a page
          that is otherwise working.
        */
        if (active) setState({ hasIcp: false, hasContent: false, hasVideo: false, loading: false });
      });

    return () => {
      active = false;
    };
  }, [campaignId]);

  return state;
}

export default useCampaignProgress;
