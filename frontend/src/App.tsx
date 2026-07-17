import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import InviteAcceptance from "./pages/auth/InviteAcceptance";
import ResendVerification from "./pages/auth/ResendVerification";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import WorkspaceLayout from "./pages/overview/WorkspaceLayout";
import HomeView from "./pages/overview/HomeView";
import SettingsView from "./pages/overview/SettingsView";
import MembersView from "./pages/overview/MembersView";
import ActivityView from "./pages/overview/ActivityView";
import PlaceholderView from "./pages/overview/PlaceholderView";
import ProjectView from "./pages/overview/ProjectView";
import WorkspacesList from "./pages/workspaces/WorkspacesList";
import ErrorFallback from "./pages/ErrorFallback";

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0E12] text-white">
      <h1 className="text-2xl font-bold">Landing Page</h1>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/invite" element={<InviteAcceptance />} />
      <Route path="/resend-verification" element={<ResendVerification />} />

      <Route
        path="/workspaces"
        element={
          <ProtectedRoute>
            <WorkspacesList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspace/:workspaceId"
        element={
          <ProtectedRoute>
            <WorkspaceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeView />} />
        <Route path="inbox" element={<PlaceholderView title="Inbox" />} />
        <Route path="tasks" element={<PlaceholderView title="My tasks" />} />
        <Route path="members" element={<MembersView />} />
        <Route
          path="clients"
          element={<PlaceholderView title="Client views" />}
        />
        <Route path="settings" element={<SettingsView />} />
        <Route path="activity" element={<ActivityView />} />
        <Route path="projects/:id" element={<ProjectView />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<ErrorFallback />} />
    </Routes>
  );
}
