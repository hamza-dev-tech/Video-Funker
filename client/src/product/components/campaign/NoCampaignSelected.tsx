import { useNavigate } from "react-router-dom";
import { Button } from "@product/components/ui/button";
import { Rocket } from "lucide-react";
import { EmptyState } from "@product/components/layout/EmptyState";

/**
 * What ICP, Content, Film and Reports show when no campaign is chosen.
 *
 * Every one of those screens is a view onto one campaign's data, so with none
 * selected there is nothing to render — this is the state, not an error. It
 * uses the same EmptyState as the rest of the product so arriving here does not
 * feel like hitting a different application.
 */
export function NoCampaignSelected() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8">
      <EmptyState
        icon={Rocket}
        title="Pick a campaign to work in"
        description="This screen shows one campaign's work. Choose one from the switcher above, or open the full list."
        action={
          <Button variant="cta" onClick={() => navigate("/campaigns")} className="gap-2">
            <Rocket className="h-4 w-4" />
            Browse campaigns
          </Button>
        }
      />
    </div>
  );
}
