import { createBrowserRouter } from "react-router-dom";
import AppLayout          from "@/components/layout/AppLayout";
import ProtectedRoute     from "@/components/layout/ProtectedRoute";
import LandingPage        from "@/pages/LandingPage";
import LoginPage          from "@/pages/LoginPage";
import SignupPage         from "@/pages/SignupPage";
import DemoPage           from "@/pages/DemoPage";
import DashboardPage      from "@/pages/DashboardPage";
import ProjectsPage       from "@/pages/ProjectsPage";
import ProjectDetailPage  from "@/pages/ProjectDetailPage";
import InvitationAcceptPage from "@/pages/InvitationAcceptPage";
import PersonalTasksPage  from "@/pages/PersonalTasksPage";
import TeamSpacePage      from "@/pages/TeamSpacePage";
import SettingsPage       from "@/pages/SettingsPage";
import NotFoundPage       from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  // Public
  { path: "/",       element: <LandingPage /> },
  { path: "/login",  element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/demo",   element: <DemoPage /> },
  { path: "/invitations/:token", element: <InvitationAcceptPage /> },

  // App（認証が必要）
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard",    element: <DashboardPage /> },
          { path: "/projects",     element: <ProjectsPage /> },
          { path: "/projects/:id", element: <ProjectDetailPage /> },
          { path: "/tasks",        element: <PersonalTasksPage /> },
          { path: "/team",         element: <TeamSpacePage /> },
          { path: "/settings",     element: <SettingsPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);
