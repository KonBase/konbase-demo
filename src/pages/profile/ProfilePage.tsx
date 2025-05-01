import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, AlertTriangle, Clock, Calendar, CheckCircle, Archive } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const ProfilePage = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const [conventions, setConventions] = useState([]);
  const [loadingConventions, setLoadingConventions] = useState(true);

  useEffect(() => {
    const fetchConventions = async () => {
      if (!profile?.id) return;

      setLoadingConventions(true);
      try {
        const { data, error } = await supabase
          .from('convention_access')
          .select('id, role, conventions(name, start_date, end_date)')
          .eq('user_id', profile.id);

        if (error) throw error;

        setConventions(data || []);
      } catch (error) {
        console.error('Error fetching conventions:', error);
      } finally {
        setLoadingConventions(false);
      }
    };

    fetchConventions();
  }, [profile?.id]);

  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300">
            <Clock className="mr-1 h-3 w-3" /> Planned
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default">
            <Calendar className="mr-1 h-3 w-3" /> Active
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Completed
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <Archive className="mr-1 h-3 w-3" /> Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Badge variant="default">Organizer</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      case 'helper':
        return (
          <Badge variant="outline" className={'bg-orange-600'}>Helper</Badge>
        );
      case 'attendee':
      default:
        return <Badge variant="outline" className="bg-muted">Attendee</Badge>;
    }
  };

  const renderConventions = () => {
    if (!conventions || conventions.length === 0) {
      return <p>No upcoming conventions found.</p>;
    }

    return conventions.map((conventionAccess) => {
      const convention = conventionAccess?.conventions;

      return (
        <div key={conventionAccess?.id || convention?.id}>
          <h4>{convention?.name ?? 'Convention Name Unavailable'}</h4>
          <p>
            Starts: {convention?.start_date ? new Date(convention.start_date).toLocaleDateString() : 'N/A'}
          </p>
          <p>
            Ends: {convention?.end_date ? new Date(convention.end_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.profile_image || ''} alt={profile?.name || 'User'} />
                  <AvatarFallback className="text-lg">
                    {profile?.name ? getInitials(profile.name) : <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.name}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {profile?.role || 'guest'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                  <p className="mt-1">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Association</p>
                  <div className="mt-1 flex items-center gap-2">
                    {profile?.association_id ? (
                      <p>Member</p>
                    ) : (
                      <button
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
                        onClick={() => console.log('Append to Association button clicked')}
                      >
                        Append to Association
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Two-Factor Authentication</p>
                <p className="mt-1">
                  {profile?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can configure 2FA in the Settings page.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-1">{profile?.email || 'No email provided'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                  {profile?.id || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Convention</CardTitle>
              <CardDescription>
                List of conventions you are associated with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingConventions ? (
                <div className="flex justify-center">
                  <Spinner size="sm" />
                </div>
              ) : conventions.length > 0 ? (
                <table className="w-full table-auto">
                  <tbody>
                    {conventions.map((convention) => {
                      // Safely access nested convention data
                      const conventionDetails = convention?.conventions;
                      const startDate = conventionDetails?.start_date ? new Date(conventionDetails.start_date) : null;
                      const endDate = conventionDetails?.end_date ? new Date(conventionDetails.end_date) : null;
                      const now = new Date();

                      const status =
                        startDate && endDate && now >= startDate && now <= endDate
                          ? 'active'
                          : startDate && now < startDate
                          ? 'planned'
                          : 'completed'; // Default to completed if dates are missing or in the past

                      const conventionName = conventionDetails?.name ?? 'Unknown Convention';
                      const conventionLogo = conventionDetails?.logo || ''; // Assuming logo is optional

                      return (
                        <tr key={convention.id} className="">
                          <td className="px-4 py-2">
                            <Avatar className="h-10 w-10">
                              {/* Use safe access for logo and name */}
                              <AvatarImage src={conventionLogo} alt={conventionName} />
                              <AvatarFallback>{conventionName[0] ?? '?'}</AvatarFallback>
                            </Avatar>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              {/* Use safe access for name */}
                              <p className="font-medium">{conventionName}</p>
                              {getStatusBadge(status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {/* Use safe access for dates */}
                              {startDate ? startDate.toLocaleDateString() : 'N/A'} - {endDate ? endDate.toLocaleDateString() : 'N/A'}
                            </p>
                          </td>
                          <td className="px-4 py-2">
                            {getRoleBadge(convention.role)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You are not associated with any conventions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
