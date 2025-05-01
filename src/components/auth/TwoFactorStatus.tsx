import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, isMock } from '@/lib/supabase';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';
import { mockDb } from '@/lib/mockData';
import { useAuth } from '@/contexts/auth';

interface TwoFactorStatusProps {
  isEnabled: boolean;
  onSetupStart: () => void;
  errorMessage: string | null;
  setErrorMessage: (error: string | null) => void;
}

const TwoFactorStatus: React.FC<TwoFactorStatusProps> = ({
  isEnabled,
  onSetupStart,
  errorMessage,
  setErrorMessage,
}) => {
  const [isDisabling, setIsDisabling] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(isDebugModeEnabled());
  const { toast } = useToast();
  const { profile } = useAuth() as { profile?: { id?: string } };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? This will reduce your account security.')) {
      return;
    }
    try {
      setIsDisabling(true);
      setErrorMessage(null);
      setOperationError(null);

      logDebug('Disabling 2FA', null, 'info');

      let success = false;
      let responseData: any = null;

      if (isMock()) {
        logDebug('Using mock disable 2FA (TwoFactorStatus).');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (profile?.id) {
          mockDb.profiles.update(profile.id, { two_factor_enabled: false });
          logDebug('Mock profile updated for 2FA disable (TwoFactorStatus).');
          success = true;
          responseData = { success: true, message: 'Mock 2FA disabled' };
        } else {
          logDebug('Mock disable failed: Profile ID not found.', null, 'error');
          responseData = { success: false, error: 'Profile ID not found' };
        }
        setDebugInfo(responseData);
      } else {
        const { data, error } = await supabase.functions.invoke('disable-2fa', {});
        setDebugInfo(data || error);

        if (error) {
          console.error('Error from disable-2fa function:', error);
          setOperationError(`Failed to disable 2FA: ${error.message}`);
          throw error;
        }

        if (data && !data.success) {
          setOperationError(data.error || 'Unknown server error');
          throw new Error(data.error || 'Unknown error');
        }
        success = data?.success;
      }

      if (success) {
        logDebug('2FA disabled successfully', responseData, 'info');
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled for your account.",
        });
        window.location.reload();
      } else {
        throw new Error(responseData?.error || 'Disabling 2FA failed.');
      }

    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      const errorMsg = error?.message || 'Unknown error occurred';
      setOperationError(errorMsg);
      setErrorMessage(`Failed to disable 2FA. ${errorMsg}`);
      logDebug('Error disabling 2FA', error, 'error');

      toast({
        variant: "destructive",
        title: "Error disabling 2FA",
        description: "There was a problem disabling 2FA for your account. Please try again.",
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(prev => !prev);
  };

  return (
    <>
      {isEnabled ? (
        <>
          <Alert className="mb-4">
            <AlertTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              2FA is enabled
            </AlertTitle>
            <AlertDescription>
              Your account has an extra layer of security. You'll need to enter a verification code when you log in.
            </AlertDescription>
          </Alert>

          {(errorMessage || operationError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Error
              </AlertTitle>
              <AlertDescription>{errorMessage || operationError}</AlertDescription>
            </Alert>
          )}

          {isDebugModeEnabled() && (
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleDebugInfo} 
                className="text-xs mb-2"
              >
                {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
              
              {showDebugInfo && debugInfo && (
                <div className="p-2 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          <Button 
            variant="destructive" 
            onClick={disable2FA} 
            disabled={isDisabling}
          >
            {isDisabling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disabling...
              </>
            ) : (
              <>
                <ShieldX className="mr-2 h-4 w-4" />
                Disable 2FA
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <Alert className="mb-4">
            <AlertTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Enhance your account security
            </AlertTitle>
            <AlertDescription>
              Two-factor authentication adds an extra layer of security to your account. In addition to your password, you'll need a code from your authenticator app to sign in.
            </AlertDescription>
          </Alert>

          {(errorMessage || operationError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Error
              </AlertTitle>
              <AlertDescription>{errorMessage || operationError}</AlertDescription>
            </Alert>
          )}

          <Button onClick={onSetupStart}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Set Up 2FA
          </Button>
        </>
      )}
    </>
  );
};

export default TwoFactorStatus;
