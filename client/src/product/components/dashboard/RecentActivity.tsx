import { cn } from "@product/lib/utils";
import { FileText, Target, Sparkles, UserPlus, Bell } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "icp" | "content" | "onboarding" | "notification" | "document";
  title: string;
  description: string;
  time: string;
}

const iconMap = {
  icp: Target,
  content: Sparkles,
  onboarding: UserPlus,
  notification: Bell,
  document: FileText,
};

const colorMap = {
  icp: "bg-primary/20 text-primary",
  content: "bg-accent/20 text-accent",
  onboarding: "bg-success/20 text-success",
  notification: "bg-warning/20 text-warning",
  document: "bg-secondary text-foreground",
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-6">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colorMap[activity.type])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{activity.title}</h4>
                <p className="truncate text-[14px] text-muted-foreground">{activity.description}</p>
              </div>
              <span className="whitespace-nowrap text-[12.5px] text-muted-foreground">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
