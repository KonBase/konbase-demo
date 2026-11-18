import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { isMock } from '@/lib/supabase'; // Import isMock
import { mockDb } from '@/lib/mockData'; // Import mockDb
import { Lock, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth/useAuth';

/**
 * NOTE: This button elevates the current user to 'super_admin' in the MOCK DEMO environment only.
 * It updates the mock database directly.
 * Use code: 123456
 */
export function SuperAdminElevationButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  // Get userProfile and refreshProfile from useAuth
  const { userProfile, refreshProfile } = useAuth();

  const handleElevation = async () => {
    if (!isMock()) {
       toast({ title: "Error", description: "This elevation method is only available in demo mode.", variant: "destructive" });
       return;
    }

    if (securityCode !== '123456') {
      toast({
        title: 'Incorrect Code',
        description: 'The demo security code is incorrect.',
        variant: "destructive",
      });
      return;
    }

    if (!userProfile || !refreshProfile) {
       toast({ title: "Error", description: "User profile or refresh function not available.", variant: "destructive" });
       return;
    }

    setIsProcessing(true);
    try {
      console.log(`[Mock] Elevating user ${userProfile.id} to super_admin via Admin Button.`);
      // Update mock database
      mockDb.profiles.update(userProfile.id, { role: 'super_admin' });

      // Refresh auth state
      await refreshProfile();

      toast({
        title: 'Elevation Successful (Demo)',
        description: 'You now have super admin privileges in this demo session.',
        variant: "default",
      });

      setIsDialogOpen(false);
      setSecurityCode(''); // Clear code after use

    } catch (error: any) {
      console.error('Error during mock elevation:', error);
      toast({
        title: 'Elevation Failed',
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Only render the button in mock mode
  if (!isMock()) {
    return null;
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto whitespace-nowrap">
        <ShieldAlert className="mr-2 h-4 w-4" />
        Elevate to Super Admin (Demo)
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Super Admin Elevation (Demo)</DialogTitle>
            <DialogDescription>
              Enter the demo security code (<code className="font-bold">123456</code>) to gain temporary super admin privileges for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                id="securityCode"
                placeholder="Demo Security Code"
                type="password"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                className="font-mono"
                autoComplete="off"
                maxLength={6} // Match the code length
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>This action is for demo purposes only.</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsDialogOpen(false); setSecurityCode(''); }} // Clear code on cancel
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleElevation}
              disabled={isProcessing || securityCode !== '123456'} // Disable if code is wrong or processing
            >
              {isProcessing ? 'Processing...' : 'Confirm Elevation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
