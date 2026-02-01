import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/Auth";
import SelectTenantPage from "./pages/SelectTenant";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import SuperAdminPage from "./pages/SuperAdmin";
import SettingsPage from "./pages/Settings";
import ViewsPage from "./pages/Views";
import ViewPage from "./pages/ViewPage";
import PageEditorPage from "./pages/PageEditor";
import DataSourcesPage from "./pages/DataSources";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TenantProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/select-tenant"
                element={
                  <ProtectedRoute>
                    <SelectTenantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireTenant>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requireTenant minRole="tenant_admin">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireTenant minRole="tenant_admin">
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/views"
                element={
                  <ProtectedRoute requireTenant minRole="tenant_admin">
                    <ViewsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/views/:id/edit"
                element={
                  <ProtectedRoute requireTenant minRole="tenant_admin">
                    <PageEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/views/:slug"
                element={
                  <ProtectedRoute requireTenant>
                    <ViewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-sources"
                element={
                  <ProtectedRoute requireTenant minRole="tenant_admin">
                    <DataSourcesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute minRole="superadmin">
                    <SuperAdminPage />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TenantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
