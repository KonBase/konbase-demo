import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Spinner } from '@/components/ui/spinner';
import { UserRoleType } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import { isMock } from '@/lib/supabase';
import { ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  allowedRoles: UserRoleType[];
  children: ReactNode;
  fallbackPath?: string;
  enforceTwoFactor?: boolean;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallbackPath = '/unauthorized',
  enforceTwoFactor = false
}: RoleGuardProps) {
  const { userProfile, hasRole, loading, isAuthenticated, isLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setShowTwoFactorDialog(false);

    if (isLoading || loading) {
      setChecking(true);
      return;
    }

    setChecking(false);

    if (!isAuthenticated) {
      console.log("RoleGuard: User not authenticated.");
      setAccessGranted(false);
      return;
    }

    if (!userProfile) {
      console.warn("RoleGuard: User authenticated but profile not loaded yet.");
      setChecking(true);
      setAccessGranted(null);
      return;
    }

    const hasRequiredRole = allowedRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      console.log(`RoleGuard: Access denied. Role '${userProfile.role}' not in allowed roles [${allowedRoles.join(', ')}].`);
      setAccessGranted(false);
      return;
    }

    const needsTwoFactorCheck = enforceTwoFactor || hasRole('system_admin') || hasRole('super_admin');

    if (!isMock() && needsTwoFactorCheck && !userProfile.two_factor_enabled) {
      console.log("RoleGuard: 2FA required but not enabled.");
      setShowTwoFactorDialog(true);
      setAccessGranted(false);
      return;
    }

    console.log("RoleGuard: Access granted.");
    setAccessGranted(true);

  }, [isLoading, loading, isAuthenticated, userProfile, allowedRoles, hasRole, enforceTwoFactor]);

  if (loading || checking || accessGranted === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (showTwoFactorDialog) {
    return (
      <AlertDialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Two-Factor Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              For enhanced security, Two-Factor Authentication (2FA) is required.
              Please set up 2FA in your security settings to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate(fallbackPath)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/settings?tab=security')}>
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (accessGranted === false) {
    if (isMock()) {
      return (
        <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Your current role does not grant access to this page.
            {userProfile ? ` (Your role: ${userProfile.role})` : ''}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      );
    } else {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  if (accessGranted === true) {
    return <>{children}</>;
  }

  console.warn("RoleGuard reached unexpected end state.");
  return <Navigate to={fallbackPath} replace />;
}
