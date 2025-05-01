import { useState, useEffect } from 'react';
import { mockDb } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Info } from 'lucide-react';
import { format } from 'date-fns';

const ConventionEquipmentReport = () => {
  const [conventions, setConventions] = useState<any[]>([]);
  const [selectedConventionId, setSelectedConventionId] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Fetch list of conventions
  useEffect(() => {
    setIsLoading(true);
    try {
      const fetchedConventions = mockDb.conventions.getAll()
        .filter(c => c.status !== 'archived') // Exclude archived for selection
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setConventions(fetchedConventions);
      // Select the most recent non-archived convention by default
      if (fetchedConventions.length > 0) {
        setSelectedConventionId(fetchedConventions[0].id);
      }
    } catch (error) {
      console.error("Error fetching conventions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch equipment data when selectedConventionId changes
  useEffect(() => {
    if (!selectedConventionId) {
      setEquipment([]);
      return;
    }

    setIsDataLoading(true);
    try {
      const conventionEquipment = mockDb.convention_equipment.getByConvention(selectedConventionId);
      const allItems = mockDb.items.getAll();
      const conventionLocations = mockDb.convention_locations.getByConvention(selectedConventionId);
      const allProfiles = mockDb.profiles.getAll(); // For issuer/returner names

      const enhancedEquipment = conventionEquipment.map(eq => {
        const item = allItems.find(i => i.id === eq.item_id);
        const location = conventionLocations.find(loc => loc.id === eq.convention_location_id);
        const issuer = allProfiles.find(p => p.id === eq.issued_by);
        const returner = allProfiles.find(p => p.id === eq.returned_by);
        return {
          ...eq,
          item_name: item?.name || 'Unknown Item',
          location_name: location?.name_override || 'Unknown Location',
          issuer_name: issuer?.name || eq.issued_by,
          returner_name: returner?.name || eq.returned_by,
        };
      });
      setEquipment(enhancedEquipment);
    } catch (error) {
      console.error("Error fetching convention equipment data:", error);
      setEquipment([]);
    } finally {
      setIsDataLoading(false);
    }
  }, [selectedConventionId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'allocated': return <Badge variant="secondary">Allocated</Badge>;
      case 'issued': return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Issued</Badge>;
      case 'returned': return <Badge variant="outline">Returned</Badge>;
      case 'damaged': return <Badge variant="destructive">Damaged</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedConvention = conventions.find(c => c.id === selectedConventionId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Equipment Report</h1>
          <p className="text-muted-foreground">Track equipment status for a specific convention.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/reports"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Link>
        </Button>
      </div>

      {isLoading ? (
        <p>Loading conventions...</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <label htmlFor="convention-select" className="text-sm font-medium">Select Convention:</label>
          <Select
            value={selectedConventionId || ''}
            onValueChange={(value) => setSelectedConventionId(value)}
            disabled={conventions.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[300px]" id="convention-select">
              <SelectValue placeholder="Select a convention" />
            </SelectTrigger>
            <SelectContent>
              {conventions.map(conv => (
                <SelectItem key={conv.id} value={conv.id}>
                  {conv.name} ({format(new Date(conv.start_date), 'MMM yyyy')})
                </SelectItem>
              ))}
              {conventions.length === 0 && <SelectItem value="-" disabled>No active/planned conventions found</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedConventionId && selectedConvention && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment for: {selectedConvention.name}</CardTitle>
            <CardDescription>
              Status from {format(new Date(selectedConvention.start_date), 'PPP')} to {format(new Date(selectedConvention.end_date), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <p>Loading equipment data...</p>
            ) : equipment.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Package className="mx-auto h-12 w-12 mb-4" />
                No equipment allocated or tracked for this convention yet.
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued To/At</TableHead>
                      <TableHead>Returned By/At</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((eq) => (
                      <TableRow key={eq.id}>
                        <TableCell className="font-medium">{eq.item_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                           <div className="flex items-center gap-1">
                             <MapPin className="h-3 w-3" /> {eq.location_name}
                           </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(eq.status)}</TableCell>
                        <TableCell className="text-xs">
                          {eq.issued_by ? `${eq.issuer_name} on ${format(new Date(eq.issued_at), 'PPp')}` : '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {eq.returned_by ? `${eq.returner_name} on ${format(new Date(eq.returned_at), 'PPp')}` : '-'}
                        </TableCell>
                         <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                           {eq.notes || '-'}
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConventionEquipmentReport;
