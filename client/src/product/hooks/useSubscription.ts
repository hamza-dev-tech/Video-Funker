import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@product/hooks/use-toast";
import {
  fetchPlans,
  fetchSubscription,
  fetchUsage,
  fetchCampaignUsage,
  startCheckout,
  openBillingPortal,
  cancelSubscription,
  resumeSubscription,
  type PlanDefinition,
  type SubscriptionView,
  type UsageView,
  type CampaignVideoUsage,
} from "@product/lib/subscription-api";

const SUBSCRIPTION_KEY = ["subscription"];
const PLANS_KEY = ["plans"];
const USAGE_KEY = ["usage"];

/** Fetches the current plan + campaign-count usage. */
export function useUsage() {
  const query = useQuery<UsageView>({
    queryKey: USAGE_KEY,
    queryFn: fetchUsage,
  });

  return {
    usage: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Fetches per-campaign video usage so the UI can flag maxed-out campaigns. */
export function useCampaignUsage(campaignId?: string) {
  const query = useQuery<CampaignVideoUsage>({
    queryKey: ["campaign-usage", campaignId],
    queryFn: () => fetchCampaignUsage(campaignId as string),
    enabled: !!campaignId,
  });

  return {
    usage: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Fetches the backend-driven plan catalog. */
export function usePlans() {
  const query = useQuery<PlanDefinition[]>({
    queryKey: PLANS_KEY,
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 5,
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<SubscriptionView>({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: fetchSubscription,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });

  const checkout = useMutation({
    mutationFn: (priceId?: string) => startCheckout(priceId),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Checkout failed", description: err.message });
    },
  });

  const portal = useMutation({
    mutationFn: () => openBillingPortal(),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Could not open billing portal",
        description: err.message,
      });
    },
  });

  const cancel = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: (data) => {
      queryClient.setQueryData(SUBSCRIPTION_KEY, data);
      toast({
        title: "Subscription canceled",
        description: "Your plan will remain active until the end of the period.",
      });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Cancellation failed", description: err.message });
    },
  });

  const resume = useMutation({
    mutationFn: () => resumeSubscription(),
    onSuccess: (data) => {
      queryClient.setQueryData(SUBSCRIPTION_KEY, data);
      toast({ title: "Subscription resumed", description: "Your plan will keep renewing." });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Could not resume", description: err.message });
    },
  });

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: invalidate,
    startCheckout: checkout.mutate,
    isCheckingOut: checkout.isPending,
    openPortal: portal.mutate,
    isOpeningPortal: portal.isPending,
    cancelSubscription: cancel.mutate,
    isCanceling: cancel.isPending,
    resumeSubscription: resume.mutate,
    isResuming: resume.isPending,
  };
}
