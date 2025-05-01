import { useState, useEffect } from 'react';
import { mockDb } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Clock, FileSpreadsheet } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

const AuditLogReport = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    try {
      const auditLogs = mockDb.audit_logs.getAll();
      const profiles = mockDb.profiles.getAll();

      const enhancedLogs = auditLogs.map(log => {
        const user = profiles.find(p => p.id === log.user_id);
        return {
          ...log,
          user_name: user?.name || log.user_id,
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort descending

      setLogs(enhancedLogs);

    } catch (error) {
      console.error("Error fetching audit log data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

 const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.user_name.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.entity?.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower) ||
      (log.changes && JSON.stringify(log.changes).toLowerCase().includes(searchLower)) ||
      log.ip_address?.toLowerCase().includes(searchLower)
    );
  });


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detailed Audit Log Report</h1>
          <p className="text-muted-foreground">Full audit trail for security and compliance.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/reports"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Link>
        </Button>
      </div>

       <div className="flex justify-end">
         <Input
           placeholder="Search logs..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="max-w-sm"
         />
       </div>


      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>Showing {filteredLogs.length} most recent audit log entries.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading audit log data...</p>
          ) : filteredLogs.length === 0 ? (
             <div className="text-center text-muted-foreground py-8">
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" />
                No audit logs found {searchTerm ? 'matching your search' : ''}.
              </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Time</TableHead>
                    <TableHead className="w-[180px]">User</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details / Changes</TableHead>
                    <TableHead className="w-[100px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        <div className="text-[10px]">{format(new Date(log.created_at), 'PPp')}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                         <div className="flex items-center gap-1">
                           <User className="h-3 w-3" /> {log.user_name}
                         </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.entity ? `${log.entity} ${log.entity_id ? `(${log.entity_id})` : ''}` : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                         {log.changes ? (
                            <pre className="whitespace-pre-wrap break-all font-mono text-xs bg-muted/50 p-1 rounded max-w-md">{JSON.stringify(log.changes, null, 2)}</pre>
                          ) : (
                            '-'
                          )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.ip_address || '-'}
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

export default AuditLogReport;
