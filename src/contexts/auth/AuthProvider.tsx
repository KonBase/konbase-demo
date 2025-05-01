import React, { createContext, useEffect, useState } from 'react';
import { AuthContextType, AuthState, AuthUser, AuthUserProfile } from './AuthTypes';
import { supabase, isMock } from '@/lib/supabase';
import { mockDb } from '@/lib/mockData';
import { Session } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { USER_ROLES, UserRoleType } from '@/types/user';
import { handleOAuthRedirect } from '@/utils/oauth-redirect-handler';
import { saveSessionData, clearSessionData } from '@/utils/session-utils';

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for the auth context
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    userProfile: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Get user session and set up auth subscription
  useEffect(() => {
    const setupAuth = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        // Handle OAuth redirects if applicable
        const redirectResult = await handleOAuthRedirect();
        if (redirectResult.success && redirectResult.session) {
          await updateUserState(redirectResult.session);
          return;
        }
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await updateUserState(session);
        } else {
          setState(prev => ({
            ...prev, 
            isLoading: false, 
            loading: false, 
            isAuthenticated: false
          }));
        }
        
        // Listen for auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (session?.user) {
              await updateUserState(session);
            } else {
              setState({
                session: null,
                user: null,
                userProfile: null,
                loading: false,
                error: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        );
        
        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
      } catch (error: any) {
        console.error("Error setting up auth:", error);
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
          isLoading: false,
        }));
      }
    };

    setupAuth();
  }, []);

  // Fetch user profile and update state
  const updateUserState = async (session: Session) => {
    try {
      const supabaseUser = session.user;
      let profile: AuthUserProfile | null = null;
      let error: any = null;

      if (isMock()) {
        // --- MOCK MODE ---
        console.log(`[Mock] Fetching profile for user ${supabaseUser.id}`);
        profile = mockDb.profiles.getById(supabaseUser.id);
        if (!profile) {
           console.warn(`[Mock] Profile not found for user ${supabaseUser.id}. Creating fallback.`);
           profile = {
             id: supabaseUser.id,
             email: supabaseUser.email || 'mock@example.com',
             name: 'Mock User',
             role: 'member',
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           };
        } else {
           console.log(`[Mock] Profile found:`, profile);
        }
      } else {
        // --- REAL MODE ---
        const { data: fetchedProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (fetchError) error = fetchError;
        profile = fetchedProfile as AuthUserProfile;
      }

      if (error) throw error;
      if (!profile) throw new Error("User profile not found.");

      // Ensure the role is a valid UserRoleType or default to 'guest'
      const userRole = profile?.role as UserRoleType || 'guest';

      // Create extended user object with profile data
      const user: AuthUser = {
        ...supabaseUser,
        name: profile?.name || "",
        profileImage: profile?.profile_image || "",
        role: userRole,
        email: profile?.email || supabaseUser.email || "",
      };

      if (!isMock()) {
        saveSessionData(session);
      }

      setState(prev => ({
        ...prev,
        session,
        user,
        userProfile: profile,
        loading: false,
        error: null,
        isAuthenticated: true,
        isLoading: false,
      }));
      console.log(`State updated. Role: ${profile.role}`);

    } catch (error: any) {
      console.error("Error getting user profile:", error);
      setState(prev => ({
        ...prev,
        user: null,
        userProfile: null,
        isAuthenticated: false,
        loading: false,
        error: error.message,
        isLoading: false,
      }));
    }
  };

  // Function to manually refresh the user profile
  const refreshProfile = async () => {
    if (state.session) {
      setState(prev => ({ ...prev, loading: true }));
      try {
        await updateUserState(state.session);
      } catch (error) {
        console.error("Error refreshing profile:", error);
      } finally {
         setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      console.warn("Cannot refresh profile: No active session.");
    }
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.session) {
        await updateUserState(data.session);
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
      
    } catch (error: any) {
      console.error("Error signing up:", error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      clearSessionData();
      
    } catch (error: any) {
      console.error("Error signing out:", error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Check if user has required role
  const hasRole = (requiredRole: UserRoleType): boolean => {
    if (!state.user || !state.user.role) return false;
    
    const userRoleLevel = USER_ROLES[state.user.role as UserRoleType]?.level || 0;
    const requiredRoleLevel = USER_ROLES[requiredRole]?.level || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  // Check if user has permission
  const hasPermission = (permission: string): boolean => {
    if (!state.user || !state.user.role) return false;
    
    const role = USER_ROLES[state.user.role as UserRoleType];
    if (!role) return false;
    
    return role.permissions.includes(permission) || role.permissions.includes('admin:all');
  };

  // Check role access with server validation
  const checkRoleAccess = async (role: UserRoleType): Promise<boolean> => {
    if (!state.session) return false;
    
    try {
      return hasRole(role);
    } catch (error) {
      console.error("Error checking role access:", error);
      return false;
    }
  };

  // Function to elevate user to super admin (for testing)
  const elevateToSuperAdmin = async (): Promise<{success: boolean, message: string}> => {
    if (!state.isAuthenticated || !state.user) {
      return { success: false, message: 'You must be logged in to perform this action' };
    }

    if (isMock()) {
       return { success: false, message: 'Super admin elevation via this method is not available in mock mode. Use the RoleGuard elevation.' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', state.user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Super Admin Activated",
        description: "Your privileges have been elevated.",
      });

      return { success: true, message: 'You are now a super admin' };
    } catch (error: any) {
      console.error("Error elevating to super admin:", error);
      return { success: false, message: error.message };
    }
  };

  // Function to handle OAuth sign-in (Google, Discord, etc.)
  const signInWithOAuth = async (provider: 'google' | 'discord') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      if (isMock()) {
        // Simulate OAuth sign-in in mock mode
        toast({
          title: `${provider} sign in (mock)`,
          description: `OAuth sign in with ${provider} is not available in mock mode.`,
          variant: "destructive",
        });
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      // Only call signInWithOAuth if supabase.auth supports it
      if ('signInWithOAuth' in supabase.auth && typeof supabase.auth.signInWithOAuth === 'function') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/`,
          }
        });
        if (error) throw error;
      } else {
        throw new Error("OAuth sign-in is not supported in the current environment.");
      }
      
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast({
        title: `${provider} sign in failed`,
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Legacy/convenience methods
  const login = signIn;
  const logout = signOut;

  // Prepare the context value
  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    hasPermission,
    hasRole,
    checkRoleAccess,
    login,
    logout,
    elevateToSuperAdmin,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
