import { MainLayout } from "@product/components/layout/MainLayout";
import { PageHeader } from "@product/components/layout/PageHeader";
import { ModuleCard } from "@product/components/dashboard/ModuleCard";
import { StatsCard } from "@product/components/dashboard/StatsCard";
import { WorkflowTimeline } from "@product/components/dashboard/WorkflowTimeline";
import { RecentActivity } from "@product/components/dashboard/RecentActivity";
import { useDashboardStats } from "@product/hooks/useDashboardStats";
import {
  Rocket,
  Search,
  FileStack,
  Activity,
  TrendingUp,
} from "lucide-react";

const workflowSteps = [
  { id: "1", title: "Campaign Setup", description: "Create your campaign", status: "completed" as const },
  { id: "2", title: "ICP Creation", description: "Define target customer profile", status: "completed" as const },
  { id: "3", title: "Research running", description: "AI-powered insights", status: "current" as const },
  { id: "4", title: "Content & Outreach", description: "Generate and distribute", status: "upcoming" as const },
];

const activities = [
  { id: "1", type: "icp" as const, title: "New ICP Created", description: "TechCorp SaaS Profile v2", time: "2m ago" },
  { id: "2", type: "document" as const, title: "ICP Generated", description: "Campaign report saved", time: "15m ago" },
  { id: "3", type: "icp" as const, title: "Research complete", description: "42 prospects enriched", time: "1h ago" },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  const modules = [
    {
      icon: Rocket,
      title: "Campaigns",
      description: "Create and manage your marketing campaigns",
      href: "/campaigns",
      status: "active" as const,
      stats: { label: "Campaigns", value: stats?.campaignCount ?? 0 },
    },
    {
      icon: Search,
      title: "Prospect research",
      description: "Prospect research powered by your ICP data",
      href: "/recon",
      status: "active" as const,
      stats: { label: "Insights", value: stats?.insightsCount ?? 0 },
    },
  ];

  return (
    <MainLayout>
      <div>
        {/* "Your AI-powered revenue content operating system" was three
            category words stacked on one another, and told a returning user
            nothing. A dashboard heading should say where you are. */}
        <PageHeader title="Overview" description="Where every campaign stands, and what to pick up next." />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatsCard icon={FileStack} label="Campaigns" value={isLoading ? "..." : stats?.campaignCount ?? 0} variant="primary" />
          <StatsCard icon={Activity} label="ICPs" value={isLoading ? "..." : stats?.icpCount ?? 0} variant="accent" />
          <StatsCard icon={TrendingUp} label="Recon Insights" value={isLoading ? "..." : stats?.insightsCount ?? 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <WorkflowTimeline steps={workflowSteps} />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity activities={activities} />
          </div>
        </div>

        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          Jump into
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <ModuleCard key={module.href} {...module} delay={index * 50} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
