import { useState, useEffect } from 'react';
import { mockDb } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

const ConventionConsumablesReport = () => {
  const [conventions, setConventions] = useState<any[]>([]);
  const [selectedConventionId, setSelectedConventionId] = useState<string | null>(null);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Fetch list of conventions
  useEffect(() => {
    setIsLoading(true);
    try {
      const fetchedConventions = mockDb.conventions.getAll()
        .filter(c => c.status !== 'archived')
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setConventions(fetchedConventions);
      if (fetchedConventions.length > 0) {
        setSelectedConventionId(fetchedConventions[0].id);
      }
    } catch (error) {
      console.error("Error fetching conventions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch consumables data when selectedConventionId changes
  useEffect(() => {
    if (!selectedConventionId) {
      setConsumables([]);
      return;
    }

    setIsDataLoading(true);
    try {
      const conventionConsumables = mockDb.convention_consumables.getByConvention(selectedConventionId);
      const allItems = mockDb.items.getAll();
      const conventionLocations = mockDb.convention_locations.getByConvention(selectedConventionId);

      const enhancedConsumables = conventionConsumables.map(con => {
        const item = allItems.find(i => i.id === con.item_id);
        const location = conventionLocations.find(loc => loc.id === con.convention_location_id);
        const usagePercentage = con.allocated_quantity > 0 ? (con.used_quantity / con.allocated_quantity) * 100 : 0;
        return {
          ...con,
          item_name: item?.name || 'Unknown Item',
          location_name: location?.name_override || 'Unknown Location',
          usagePercentage: Math.min(100, Math.max(0, usagePercentage)), // Clamp between 0 and 100
        };
      });
      setConsumables(enhancedConsumables);
    } catch (error) {
      console.error("Error fetching convention consumables data:", error);
      setConsumables([]);
    } finally {
      setIsDataLoading(false);
    }
  }, [selectedConventionId]);

  const selectedConvention = conventions.find(c => c.id === selectedConventionId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convention Consumables Report</h1>
          <p className="text-muted-foreground">Monitor consumable item usage during a convention.</p>
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
            <CardTitle>Consumables for: {selectedConvention.name}</CardTitle>
            <CardDescription>
              Usage from {format(new Date(selectedConvention.start_date), 'PPP')} to {format(new Date(selectedConvention.end_date), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <p>Loading consumables data...</p>
            ) : consumables.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                No consumable items tracked for this convention yet.
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Allocated</TableHead>
                      <TableHead className="text-right">Used</TableHead>
                      <TableHead>Usage %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumables.map((con) => (
                      <TableRow key={con.id}>
                        <TableCell className="font-medium">{con.item_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {con.location_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{con.allocated_quantity}</TableCell>
                        <TableCell className="text-right">{con.used_quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={con.usagePercentage} className="w-[60%]" />
                            <span className="text-xs text-muted-foreground">{con.usagePercentage.toFixed(0)}%</span>
                          </div>
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

export default ConventionConsumablesReport;
