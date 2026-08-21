import { MainLayout } from "@product/components/layout/MainLayout";
import { PageHeader } from "@product/components/layout/PageHeader";
import { BillingPanel } from "@product/components/subscription/BillingPanel";

export default function Subscription() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHeader title="Subscription" description="Your plan, what it includes, and when it renews." />

        <BillingPanel />
      </div>
    </MainLayout>
  );
}
