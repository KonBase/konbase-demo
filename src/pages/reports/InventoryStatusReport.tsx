import { useState, useEffect } from 'react';
import { mockDb } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Warehouse, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const InventoryStatusReport = () => {
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setIsLoading(true);
    try {
      const fetchedItems = mockDb.items.getAll();
      const fetchedLocations = mockDb.locations.getAll();
      const fetchedCategories = mockDb.categories.getAll();

      // Enhance items with location and category names
      const enhancedItems = fetchedItems.map(item => ({
        ...item,
        location_name: fetchedLocations.find(loc => loc.id === item.location_id)?.name || 'Unknown',
        category_name: fetchedCategories.find(cat => cat.id === item.category_id)?.name || 'Unknown',
      }));

      setItems(enhancedItems);
      setLocations(fetchedLocations);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching inventory report data:", error);
      // Handle error state if needed
    } finally {
      setIsLoading(false);
    }
  }, []);

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.purchase_price || 0) * (item.quantity || 1), 0);
  const itemsByCondition = items.reduce((acc, item) => {
    acc[item.condition] = (acc[item.condition] || 0) + (item.quantity || 1);
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Status Report</h1>
          <p className="text-muted-foreground">Overview of current item quantities, conditions, and locations.</p>
        </div>
         <Button variant="outline" asChild>
           <Link to="/reports"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Link>
         </Button>
      </div>

      {isLoading ? (
        <p>Loading report data...</p> // Replace with a proper loading skeleton if desired
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Across {categories.length} categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Estimated Value</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Based on purchase price</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items by Condition</CardTitle>
                 <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <div className="flex flex-wrap gap-2">
                    {Object.entries(itemsByCondition).map(([condition, count]) => (
                      <Badge key={condition} variant="secondary" className="capitalize">
                        {condition}: {count as number}
                      </Badge>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>List of all inventory items.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]"> {/* Adjust height as needed */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category_name}</TableCell>
                        <TableCell>{item.location_name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{item.condition}</Badge></TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default InventoryStatusReport;
