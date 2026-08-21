import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@product/lib/api-client";

interface DashboardStats {
  campaignCount: number;
  icpCount: number;
  insightsCount: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const [campaigns, reconInsights] = await Promise.all([
          apiGet<any[]>("/campaigns"),
          apiGet<any[]>("/recon"),
        ]);
        return {
          campaignCount: campaigns?.length ?? 0,
          icpCount: campaigns?.length ?? 0, // 1 ICP per campaign
          insightsCount: reconInsights?.length ?? 0,
        };
      } catch {
        return { campaignCount: 0, icpCount: 0, insightsCount: 0 };
      }
    },
  });
}
