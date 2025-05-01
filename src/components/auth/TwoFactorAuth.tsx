import React, { useState, useEffect } from 'react';
import { supabase, isMock } from '@/lib/supabase'; // Import isMock
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QrCode, ShieldCheck, KeyRound, Info, Trash2 } from 'lucide-react';
import * as QRCodeReact from 'qrcode.react'; // Use namespace import
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { logDebug, handleError } from '@/utils/debug';
import { useTranslation } from '@/utils/languageUtils';
import { mockDb } from '@/lib/mockData'; // Import mockDb for profile updates

// Define the expected shape of the data returned by useAuth, including missing properties
interface ExpectedAuthData {
  profile: {
    id?: string;
    email?: string;
    two_factor_enabled?: boolean;
  } | null | undefined; // Allow null and undefined
  refreshProfile?: () => Promise<void>;
}

const TwoFactorAuth = () => {
  const auth = useAuth();
  const profile = (auth as any).profile ?? null;
  const refreshProfile = (auth as any).refreshProfile;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<'loading_profile' | 'initial' | 'generate' | 'verify' | 'recovery' | 'complete'>(
    () => {
      logDebug('TwoFactorAuth: Calculating initial setupStep', { profileExists: profile !== undefined && profile !== null, isEnabled: profile?.two_factor_enabled });
      if (profile === undefined) return 'loading_profile';
      if (profile === null) return 'loading_profile'; // Treat null profile also as loading initially
      return profile.two_factor_enabled ? 'complete' : 'initial';
    }
  );
  const [secret, setSecret] = useState<string | null>(null);
  const [keyUri, setKeyUri] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>([]);

  useEffect(() => {
    logDebug('TwoFactorAuth profile update detected.', { profileExists: profile !== undefined && profile !== null, isEnabled: profile?.two_factor_enabled, currentStep: setupStep });

    if (profile === undefined || profile === null) {
      if (setupStep !== 'loading_profile') {
        logDebug('Profile context is undefined or null, ensuring step is loading_profile.', null, 'info');
        setSetupStep('loading_profile');
      }
    } else {
      const isEnabled = profile.two_factor_enabled === true;

      if (isEnabled) {
        if (setupStep !== 'complete') {
          logDebug('Profile indicates 2FA enabled, setting step to complete.', null, 'info');
          setSetupStep('complete');
          setSecret(null);
          setKeyUri(null);
          setVerificationCode('');
          setRecoveryKeys([]);
        }
      } else {
        if (setupStep === 'loading_profile' || setupStep === 'complete') {
          logDebug('Profile indicates 2FA disabled, setting step to initial.', null, 'info');
          setSetupStep('initial');
          setSecret(null);
          setKeyUri(null);
          setVerificationCode('');
          setRecoveryKeys([]);
        }
      }
    }
  }, [profile]);

  const triggerRefreshProfile = async () => {
    if (typeof refreshProfile === 'function') {
      logDebug('Triggering profile refresh...', { currentProfile: profile }, 'info'); // Log current profile
      try {
        await refreshProfile();
        logDebug('Profile refresh function executed.', null, 'info');
      } catch (refreshError) {
        handleError(refreshError, 'Error during triggerRefreshProfile');
        toast({ variant: 'destructive', title: t('Error'), description: t('Failed to refresh profile data.') });
      }
    } else {
      logDebug('refreshProfile function not available in AuthContext.', null, 'warn');
      toast({ variant: 'destructive', title: t('Error'), description: t('Could not refresh profile data. Please reload the page.') });
    }
  };

  const handleGenerateSecret = async () => {
    setIsLoading(true);
    setError(null);
    setSetupStep('generate');
    logDebug('Generating TOTP secret...');
    try {
      if (isMock()) {
        logDebug('Using mock secret generation.');
        const mockSecret = 'MOCKSECRET1234567890';
        const mockKeyUri = `otpauth://totp/KonBaseDemo:${profile?.email}?secret=${mockSecret}&issuer=KonBaseDemo`;
        await new Promise(resolve => setTimeout(resolve, 500));
        setSecret(mockSecret);
        setKeyUri(mockKeyUri);
        setSetupStep('verify');
        logDebug('Mock secret generated.');
      } else {
        const { data, error: funcError } = await supabase.functions.invoke('generate-totp-secret');
        if (funcError) throw funcError;
        if (data?.secret && data?.keyUri) {
          logDebug('TOTP secret generated successfully.', { secretLength: data.secret.length, uriLength: data.keyUri.length });
          setSecret(data.secret);
          setKeyUri(data.keyUri);
          setSetupStep('verify');
        } else {
          throw new Error(t('Failed to generate secret. Invalid data returned.'));
        }
      }
    } catch (err) {
      setError(t('Error generating QR code. Please try again.'));
      handleError(err, 'Error in handleGenerateSecret');
      setSetupStep('initial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!secret || !verificationCode) return;
    setIsLoading(true);
    setError(null);
    logDebug('Verifying TOTP code...', { codeLength: verificationCode.length });
    try {
      const codeToVerify = verificationCode.trim().replace(/\s/g, '');
      let verified = false;

      if (isMock()) {
        logDebug('Using mock code verification.');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (codeToVerify === '123456') {
          verified = true;
          logDebug('Mock code verified successfully.');
        } else {
          logDebug('Mock code verification failed.');
        }
      } else {
        const { data, error: funcError } = await supabase.functions.invoke('verify-totp', {
          body: { secret, token: codeToVerify },
        });
        if (funcError) throw funcError;
        verified = data?.verified;
      }

      if (verified) {
        await generateRecoveryKeys();
      } else {
        const errorMessage = t('Invalid verification code. Please check the code and try again.');
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || t('Error verifying code.'));
      handleError(err, 'Error in handleVerifyCode');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecoveryKeys = async () => {
    setIsLoading(true);
    logDebug('Generating recovery keys...');
    try {
      if (isMock()) {
        logDebug('Using mock recovery key generation.');
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockKeys = Array.from({ length: 10 }, (_, i) => `MOCK-KEY-${i + 1}`);
        setRecoveryKeys(mockKeys);
        setSetupStep('recovery');
        logDebug('Mock recovery keys generated.');
      } else {
        const { data, error: funcError } = await supabase.functions.invoke('generate-recovery-keys');
        if (funcError) throw funcError;
        if (data?.keys && Array.isArray(data.keys) && data.keys.length > 0) {
          logDebug('Recovery keys generated successfully.', { count: data.keys.length });
          setRecoveryKeys(data.keys);
          setSetupStep('recovery');
        } else {
          throw new Error(t('Failed to generate recovery keys. Invalid data returned.'));
        }
      }
    } catch (err) {
      setError(t('Error generating recovery keys. Please try again.'));
      handleError(err, 'Error in generateRecoveryKeys');
      setSetupStep('verify');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!secret || recoveryKeys.length === 0) {
      setError(t('Cannot complete setup. Missing secret or recovery keys.'));
      logDebug('Complete setup aborted, missing data.', { hasSecret: !!secret, recoveryKeyCount: recoveryKeys.length }, 'warn');
      return;
    }
    setIsLoading(true);
    setError(null);
    logDebug('Completing 2FA setup...');
    try {
      if (isMock()) {
        logDebug('Using mock complete setup.');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (profile?.id) {
          mockDb.profiles.update(profile.id, { two_factor_enabled: true });
          logDebug('Mock profile updated for 2FA completion. Triggering refresh...', null, 'info');
        }
        toast({ title: t('Success'), description: t('Two-Factor Authentication enabled successfully!') });
        await triggerRefreshProfile();
      } else {
        const { data, error: funcError } = await supabase.functions.invoke('complete-2fa-setup', {
          body: { secret: secret, recoveryKeys: recoveryKeys }
        });
        if (funcError) throw funcError;
        if (data?.success) {
          logDebug('Complete-2fa-setup function succeeded.', data);
          toast({ title: t('Success'), description: t('Two-Factor Authentication enabled successfully!') });
          logDebug('Real 2FA setup complete. Triggering refresh...', null, 'info');
          await triggerRefreshProfile();
        } else {
          throw new Error(data?.message || t('Failed to complete setup.'));
        }
      }
    } catch (err: any) {
      setError(err.message || t('Error completing setup.'));
      handleError(err, 'Error in handleCompleteSetup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm(t('Are you sure you want to disable Two-Factor Authentication? This will reduce your account security.'))) {
      return;
    }

    setIsLoading(true);
    setError(null);
    logDebug('Disabling 2FA...');
    try {
      if (isMock()) {
        logDebug('Using mock disable 2FA.');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (profile?.id) {
          mockDb.profiles.update(profile.id, { two_factor_enabled: false });
          logDebug('Mock profile updated for 2FA disable. Triggering refresh...', null, 'info');
        }
        toast({ title: t('Success'), description: t('Two-Factor Authentication disabled.') });
        await triggerRefreshProfile();
      } else {
        const { data, error: funcError } = await supabase.functions.invoke('disable-2fa');
        if (funcError) throw funcError;
        if (data?.success) {
          logDebug('Disable-2fa function succeeded.', data);
          toast({ title: t('Success'), description: t('Two-Factor Authentication disabled.') });
          logDebug('Real 2FA disable complete. Triggering refresh...', null, 'info');
          await triggerRefreshProfile();
        } else {
          throw new Error(data?.message || t('Failed to disable 2FA.'));
        }
      }
    } catch (err: any) {
      setError(err.message || t('Error disabling 2FA.'));
      handleError(err, 'Error in handleDisable2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      logDebug(`Copied ${type} to clipboard.`);
      toast({ title: t('Copied'), description: t(`${type} copied to clipboard.`) });
    }).catch(err => {
      handleError(err, `Failed to copy ${type} to clipboard`);
      toast({ variant: 'destructive', title: t('Error'), description: t(`Failed to copy ${type}.`) });
    });
  };

  if (setupStep === 'loading_profile') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t("Two-Factor Authentication")}
          </CardTitle>
          <CardDescription>{t("Checking your 2FA status...")}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-20">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            {t("Two-Factor Authentication")}
          </CardTitle>
          <CardDescription>{t("2FA is currently enabled for your account.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>{t("Security Enhanced")}</AlertTitle>
            <AlertDescription>
              {t("Your account is protected with Two-Factor Authentication.")}
            </AlertDescription>
          </Alert>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button
            variant="destructive"
            onClick={handleDisable2FA}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {t("Disable 2FA")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {t("Two-Factor Authentication")}
        </CardTitle>
        <CardDescription>
          {setupStep === 'initial' && t("Add an extra layer of security to your account.")}
          {setupStep === 'generate' && t("Generating your unique setup key...")}
          {setupStep === 'verify' && t("Scan the QR code and verify.")}
          {setupStep === 'recovery' && t("Save your recovery keys.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {setupStep === 'generate' && (
          <div className="flex flex-col items-center justify-center space-y-2 h-40">
            <Spinner size="lg" />
            <p className="text-muted-foreground">{t("Generating secret...")}</p>
          </div>
        )}

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {setupStep === 'initial' && (
          <div className="space-y-4 text-center">
            <p>{t("Protect your account by enabling Two-Factor Authentication (2FA).")}</p>
            <Button onClick={handleGenerateSecret} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <QrCode className="mr-2 h-4 w-4" />}
              {t("Enable 2FA")}
            </Button>
          </div>
        )}

        {setupStep === 'verify' && keyUri && (
          <div className="space-y-4">
            <p>{t("1. Scan the QR code below with your authenticator app (like Google Authenticator, Authy, etc.).")}</p>
            <div className="flex justify-center p-4 bg-white rounded-md">
              <QRCodeReact.QRCodeSVG value={keyUri} size={160} />
            </div>
            <p className="text-sm text-center">{t("Or manually enter the setup key:")}</p>
            <div className="flex items-center justify-center gap-2 bg-muted p-2 rounded">
              <code className="text-sm break-all">{secret}</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(secret || '', t('Setup Key'))}>
                {t("Copy")}
              </Button>
            </div>
            <Label htmlFor="verificationCode">{t("Enter the 6-digit code from your authenticator app:")}</Label>
            <Alert variant="default" className="mt-2">
              <Info className="h-4 w-4" />
              <AlertTitle>{t("Demo Information")}</AlertTitle>
              <AlertDescription>
                {t("For demo purposes, use the code:")} <code className="font-bold">123456</code>
              </AlertDescription>
            </Alert>
            <Input
              id="verificationCode"
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123 456"
              className="text-center tracking-widest"
            />
            <Button onClick={handleVerifyCode} disabled={isLoading || verificationCode.length !== 6} className="w-full">
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {t("Verify & Continue")}
            </Button>
            <Button variant="outline" onClick={() => { setSetupStep('initial'); setError(null); setSecret(null); setKeyUri(null); setVerificationCode(''); }} disabled={isLoading} className="w-full">
              {t("Cancel")}
            </Button>
          </div>
        )}

        {setupStep === 'recovery' && (
          <div className="space-y-4">
            <h3 className="font-semibold">{t("2. Save Your Recovery Keys")}</h3>
            <Alert variant="default">
              <KeyRound className="h-4 w-4" />
              <AlertTitle>{t("Important!")}</AlertTitle>
              <AlertDescription>
                {t("Store these recovery keys in a safe place. If you lose access to your authenticator app, you can use these keys to log in.")}
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 border rounded-md bg-muted">
              {recoveryKeys.map((key) => (
                <code key={key} className="text-sm p-1">{key}</code>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => copyToClipboard(recoveryKeys.join('\n'), t('Recovery Keys'))} className="flex-1">
                {t("Copy Keys")}
              </Button>
              <Button onClick={handleCompleteSetup} disabled={isLoading || recoveryKeys.length === 0} className="flex-1">
                {isLoading ? <Spinner size="sm" className="mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {t("Complete Setup")}
              </Button>
            </div>
            <Button variant="outline" onClick={() => { setSetupStep('verify'); setError(null); setRecoveryKeys([]); }} disabled={isLoading} className="w-full">
              {t("Back")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;
