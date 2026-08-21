import { Toaster } from "@product/components/ui/toaster";
import { Toaster as Sonner } from "@product/components/ui/sonner";
import { TooltipProvider } from "@product/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignRedirect from "./pages/CampaignRedirect";
import ICPPage from "./pages/ICPPage";
import AvatarStudioPage from "./pages/AvatarStudioPage";
import ContentPage from "./pages/ContentPage";
import FilmPage from "./pages/FilmPage";
import ReportsPage from "./pages/ReportsPage";
import Recon from "./pages/Recon";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { BASE_PATH } from "./config";
import { VerificationProvider } from "./context/VerificationProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* basename, not a hard-coded prefix on every route.

          This SPA is served by the Next app at /app (one route, fed by a
          rewrite — see next.config.mjs). Every <Route path> below is written
          from "/" and stays that way; the basename is what makes "/auth"
          resolve to /app/auth in the address bar, and what makes a deployment
          that serves the product at the root of app.videofunker.ai work by
          changing one env var instead of every route in this file. */}
      <BrowserRouter basename={BASE_PATH}>
        <VerificationProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId" element={<ProtectedRoute><CampaignRedirect /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId/:section" element={<ProtectedRoute><CampaignRedirect /></ProtectedRoute>} />
          <Route path="/icp" element={<ProtectedRoute><ICPPage /></ProtectedRoute>} />
          <Route path="/avatar-studio" element={<ProtectedRoute><AvatarStudioPage /></ProtectedRoute>} />
          <Route path="/data-avatar" element={<Navigate to="/avatar-studio" replace />} />
          <Route path="/content" element={<ProtectedRoute><ContentPage /></ProtectedRoute>} />
          <Route path="/film" element={<ProtectedRoute><FilmPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/recon" element={<ProtectedRoute><Recon /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </VerificationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
