import { useState, useEffect } from 'react';
import { mockDb } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Clock, Edit, Plus, Trash, LogIn, LogOut, Settings, FileText, Package } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CombinedLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  source: 'audit' | 'convention';
  convention_id?: string;
  convention_name?: string;
}

const UserActivityReport = () => {
  const [logs, setLogs] = useState<CombinedLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all'); // 'all' or user ID
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const auditLogs = mockDb.audit_logs.getAll();
      const conventionLogs = mockDb.convention_logs.getAll();
      const profiles = mockDb.profiles.getAll();
      const conventions = mockDb.conventions.getAll(); // To get convention names

      setUsers([{ id: 'all', name: 'All Users' }, ...profiles]); // Add 'All Users' option

      const combined: CombinedLog[] = [];

      auditLogs.forEach(log => {
        const user = profiles.find(p => p.id === log.user_id);
        combined.push({
          id: `audit-${log.id}`,
          timestamp: log.created_at,
          user_id: log.user_id,
          user_name: user?.name || log.user_id,
          action: log.action,
          details: `Entity: ${log.entity} (${log.entity_id || ''}) ${log.changes ? `- Changes: ${JSON.stringify(log.changes)}` : ''}`,
          source: 'audit',
        });
      });

      conventionLogs.forEach(log => {
        const user = profiles.find(p => p.id === log.user_id);
        const convention = conventions.find(c => c.id === log.convention_id);
        combined.push({
          id: `conv-${log.id}`,
          timestamp: log.created_at,
          user_id: log.user_id,
          user_name: user?.name || (log.user_id === 'user-system' ? 'System' : log.user_id),
          action: 'convention_log',
          details: log.log_message,
          source: 'convention',
          convention_id: log.convention_id,
          convention_name: convention?.name || 'Unknown Convention',
        });
      });

      // Sort combined logs by timestamp descending
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(combined);

    } catch (error) {
      console.error("Error fetching activity report data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActionIcon = (action: string, source: 'audit' | 'convention') => {
    if (source === 'convention') return <FileText className="h-3 w-3" />; // Generic for convention logs

    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create')) return <Plus className="h-3 w-3" />;
    if (lowerAction.includes('update')) return <Edit className="h-3 w-3" />;
    if (lowerAction.includes('delete')) return <Trash className="h-3 w-3" />;
    if (lowerAction.includes('login') || lowerAction.includes('signin')) return <LogIn className="h-3 w-3" />;
    if (lowerAction.includes('logout') || lowerAction.includes('signout')) return <LogOut className="h-3 w-3" />;
    if (lowerAction.includes('setting')) return <Settings className="h-3 w-3" />;
    if (lowerAction.includes('item')) return <Package className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  const filteredLogs = logs.filter(log => selectedUserId === 'all' || log.user_id === selectedUserId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Activity Report</h1>
          <p className="text-muted-foreground">Summary of actions performed by users.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/reports"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Link>
        </Button>
      </div>

       <div className="flex flex-col sm:flex-row gap-4 items-center">
          <label htmlFor="user-select" className="text-sm font-medium">Filter by User:</label>
          <Select
            value={selectedUserId}
            onValueChange={(value) => setSelectedUserId(value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-[250px]" id="user-select">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} {user.id !== 'all' && user.email ? `(${user.email})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Showing {filteredLogs.length} most recent activities {selectedUserId !== 'all' ? `for ${users.find(u=>u.id === selectedUserId)?.name}` : ''}.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading activity data...</p>
          ) : filteredLogs.length === 0 ? (
             <div className="text-center text-muted-foreground py-8">
                <User className="mx-auto h-12 w-12 mb-4" />
                No activity found {selectedUserId !== 'all' ? `for ${users.find(u=>u.id === selectedUserId)?.name}` : 'matching the criteria'}.
              </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Time</TableHead>
                    <TableHead className="w-[180px]">User</TableHead>
                    <TableHead>Action / Details</TableHead>
                    <TableHead className="w-[100px]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        <div className="text-[10px]">{format(new Date(log.timestamp), 'PPp')}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                         <div className="flex items-center gap-1">
                           <User className="h-3 w-3" /> {log.user_name}
                         </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 mb-1">
                          {getActionIcon(log.action, log.source)}
                          <span className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground break-words">{log.details}</p>
                        {log.source === 'convention' && log.convention_name && (
                           <Badge variant="outline" className="mt-1 text-xs">Convention: {log.convention_name}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.source === 'audit' ? 'secondary' : 'outline'}>
                          {log.source === 'audit' ? 'System' : 'Convention'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityReport;
