import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from '@/contexts/auth';
import { AssociationProvider } from './contexts/AssociationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { SessionRecovery } from '@/components/SessionRecovery';
import AuthGuard from './components/guards/AuthGuard';
import { RoleGuard } from './components/auth/RoleGuard'; // Use named import for RoleGuard
import { UserRoleType } from '@/types/user';
import { isConfigured } from '@/lib/config-store';
import { Suspense, lazy, useEffect } from 'react';
import CookieConsent from "react-cookie-consent";
import clarity from '@microsoft/clarity';
import { Link } from 'react-router-dom';

// Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/error/Unauthorized'));

// Admin pages
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));

// Association pages
const AssociationProfile = lazy(() => import('./pages/association/AssociationProfile'));
const AssociationMembers = lazy(() => import('./pages/association/AssociationMembers'));
const AssociationDetails = lazy(() => import('./pages/association/AssociationDetails'));
const AssociationsList = lazy(() => import('./pages/association/AssociationsList'));

// Convention pages
const ConventionsList = lazy(() => import('./pages/conventions/ConventionsList'));
const ConventionDetails = lazy(() => import('./pages/conventions/ConventionDetails'));
const ConventionArchive = lazy(() => import('./pages/conventions/ConventionArchive'));
const ConventionEquipment = lazy(() => import('./pages/conventions/ConventionEquipment'));
const ConventionLocations = lazy(() => import('./pages/conventions/ConventionLocations'));
const ConventionLogs = lazy(() => import('./pages/conventions/ConventionLogs'));
const ConventionRequirements = lazy(() => import('./pages/conventions/ConventionRequirements'));
const ConventionConsumables = lazy(() => import('./pages/conventions/ConventionConsumables'));
const ConventionTemplates = lazy(() => import('./pages/conventions/ConventionTemplates'));

// Inventory pages
const InventoryList = lazy(() => import('./pages/inventory/InventoryList'));
const InventoryItems = lazy(() => import('./pages/inventory/InventoryItems'));
const ItemCategories = lazy(() => import('./pages/inventory/ItemCategories'));
const ItemLocations = lazy(() => import('./pages/inventory/ItemLocations'));
const StorageLocations = lazy(() => import('./pages/inventory/StorageLocations'));
const WarrantiesDocuments = lazy(() => import('./pages/inventory/WarrantiesDocuments'));
const EquipmentSets = lazy(() => import('./pages/inventory/EquipmentSets'));
const ImportExport = lazy(() => import('./pages/inventory/ImportExport'));

// Reports
const ReportsList = lazy(() => import('./pages/reports/ReportsList'));
const InventoryStatusReport = lazy(() => import('./pages/reports/InventoryStatusReport'));
const ConventionEquipmentReport = lazy(() => import('./pages/reports/ConventionEquipmentReport'));
const ConventionConsumablesReport = lazy(() => import('./pages/reports/ConventionConsumablesReport'));
const UserActivityReport = lazy(() => import('./pages/reports/UserActivityReport'));
const AuditLogReport = lazy(() => import('./pages/reports/AuditLogReport'));

// Auth pages
import Login from './pages/auth/Login';
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback')); // Import the new AuthCallback component
const AssociationSetup = lazy(() => import('./pages/setup/AssociationSetup'));

// Layouts
import RootLayout from './layouts/RootLayout';

// Import mobile hook
import { isMobileUserAgent } from './hooks/isMobile';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Define role permissions for different routes
  const memberRoles: UserRoleType[] = ['member', 'manager', 'admin', 'system_admin', 'super_admin', 'guest'];
  const managerRoles: UserRoleType[] = ['manager', 'admin', 'system_admin', 'super_admin'];
  const adminRoles: UserRoleType[] = ['admin', 'system_admin', 'super_admin'];

  //Define mobile flag
  const isMobile:void = isMobileUserAgent();

  useEffect(() => {
    isConfigured();

  }, []); // Run only once on mount

  const handleAcceptCookie = () => {
    if (typeof window !== 'undefined' && typeof clarity !== 'undefined') {
      clarity.init("reid6zycx7");
      // Signal consent to Clarity for GDPR/CCPA compliance
      clarity.consent(); 
      console.log("Clarity initialized and consent signaled.");
    }
  };

  const handleDeclineCookie = () => {
    // Optional: Handle decline logic if needed, e.g., remove existing cookies
    console.log("Cookie consent declined.");
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <AuthProvider>
            <AssociationProvider>
              <SessionRecovery />
              <Suspense fallback={<div role="status" aria-live="polite" className="p-8 text-center">Loading…</div>}>
              <Routes>
                {/* Public routes accessible without authentication */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} /> {/* Add the OAuth callback route */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/error" element={<ErrorPage />} />
                <Route path="/setup" element={<AssociationSetup />} /> 

                {/* Protected routes wrapped by AuthGuard and RootLayout */}


                <Route element={<AuthGuard><RootLayout /></AuthGuard>}>

                  {/* Dashboard */}
                  <Route
                      index
                      path="dashboard"
                      element={
                        <RoleGuard allowedRoles={managerRoles} fallbackPath={"/profile"}>
                          <Dashboard />
                        </RoleGuard>
                  } />
                  {/* Profile */}
                  <Route path="profile" element={<ProfilePage />} />
                  {/* Settings */}
                  <Route path="settings" element={<Settings />} />
                  {/* Admin Panel (with RoleGuard) */}
                  <Route
                      path="admin/*"
                      element={
                        <RoleGuard allowedRoles={adminRoles}>
                          <AdminPanel />
                        </RoleGuard>
                      }
                  />
                  {/* Association Management (with RoleGuard) */}
                  <Route
                    path="association/*"
                    element={
                      <RoleGuard allowedRoles={managerRoles}> {/* Example: Managers and above */}
                        {/* Define nested routes for association management */}
                        <Routes>
                          <Route index element={<AssociationsList />} />
                          <Route path="profile" element={<AssociationProfile />} />
                          <Route path="members" element={<AssociationMembers />} />
                          <Route path="details/:id" element={<AssociationDetails />} />
                        </Routes>
                      </RoleGuard>
                    }
                  />

                  {/* Convention Management (with RoleGuard) */}
                  <Route
                    path="conventions/*"
                    element={
                      <RoleGuard allowedRoles={memberRoles}> {/* Example: Members and above */}
                        {/* Define nested routes for conventions */}
                        <Routes>
                          <Route index element={<ConventionsList />} />
                          <Route path=":id" element={<ConventionDetails />} /> {/* Changed path to use :id */}
                          <Route path="archive" element={<ConventionArchive />} />
                          <Route path=":id/equipment" element={<ConventionEquipment />} /> {/* Nested under :id */}
                          <Route path=":id/locations" element={<ConventionLocations />} /> {/* Nested under :id */}
                          <Route path=":id/logs" element={<ConventionLogs />} /> {/* Nested under :id */}
                          <Route path=":id/requirements" element={<ConventionRequirements />} /> {/* Nested under :id */}
                          <Route path=":id/consumables" element={<ConventionConsumables />} /> {/* Nested under :id */}
                          <Route path="templates" element={<ConventionTemplates />} />
                          {/* Add a route for creating conventions, potentially using a template */}
                          {/* <Route path="create" element={<CreateConventionPage />} /> */}
                        </Routes>
                      </RoleGuard>
                    }
                  />

                  {/* Inventory Management (with RoleGuard) */}
                  <Route
                    path="inventory/*"
                    element={
                      <RoleGuard allowedRoles={memberRoles}> {/* Example: Members and above */}
                        {/* Define nested routes for inventory */}
                        <Routes>
                          <Route index element={<InventoryList />} />
                          <Route path="items" element={<InventoryItems />} />
                          <Route path="categories" element={<ItemCategories />} />
                          <Route path="locations" element={<ItemLocations />} />
                          <Route path="storage" element={<StorageLocations />} />
                          <Route path="warranties" element={<WarrantiesDocuments />} />
                          <Route path="sets" element={<EquipmentSets />} />
                          <Route path="import-export" element={<ImportExport />} />
                        </Routes>
                      </RoleGuard>
                    }
                  />

                  {/* Reports (with RoleGuard) */}
                  <Route
                    path="reports/*"
                    element={
                      <RoleGuard allowedRoles={managerRoles}> {/* Example: Managers and above */}
                        <Routes>
                          <Route index element={<ReportsList />} />
                          <Route path="inventory-status" element={<InventoryStatusReport />} />
                          <Route path="convention-equipment" element={<ConventionEquipmentReport />} />
                          <Route path="convention-consumables" element={<ConventionConsumablesReport />} />
                          <Route path="user-activity" element={<UserActivityReport />} />
                          <Route path="audit-log" element={<AuditLogReport />} />
                        </Routes>
                      </RoleGuard>
                    }
                  />

                  {/* Catch-all for unmatched protected routes */}
                  <Route path="*" element={<NotFound />} />
                </Route> {/* End of protected routes */}

                {/* Catch-all for unmatched top-level routes */}
                <Route path="*" element={<NotFound />} />

              </Routes>
              </Suspense>
              <CookieConsent
              location="bottom" // This prop might conflict with fixed positioning, but react-cookie-consent might handle it.
              buttonText="Accept"
              declineButtonText="Decline"
              cookieName="konbaseUserConsent" 
              
              // Apply Tailwind classes via specific props for styling and animation
              containerClasses="fixed inset-x-0 bottom-0 z-[9999] border-t border-border bg-background text-foreground shadow-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-500 ease-out" 
              contentClasses="flex-grow text-sm text-center md:text-left mb-2 md:mb-0"
              // Use shadcn/ui button styles via Tailwind classes
              buttonClasses="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full md:w-auto"
              declineButtonClasses="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-9 px-4 py-2 w-full md:w-auto mt-2 md:mt-0 md:ml-2" 

              // Remove inline styles, colors are handled by Tailwind classes now
              expires={150}
              enableDeclineButton
              onAccept={handleAcceptCookie}
              onDecline={handleDeclineCookie}
              ariaAcceptLabel="Accept cookies"
              ariaDeclineLabel="Decline cookies"
            >
              This website uses cookies to enhance the user experience and analyze site traffic using Microsoft Clarity. By clicking "Accept", you consent to the use of these cookies. You can learn more in our{" "}
              <Link 
                to="https://konbase.cfd/privacy-policy#cookies" 
                // Apply Tailwind classes directly to the Link
                className="font-medium text-primary underline underline-offset-4 hover:no-underline" // Adjusted link style slightly
              >
                Privacy Policy
              </Link>.
            </CookieConsent>
            </AssociationProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
