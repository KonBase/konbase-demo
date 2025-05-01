import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart, FileSpreadsheet, FileText, Package, Warehouse, Users, CalendarClock } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Mock Report Data Structure
interface MockReport {
  id: string;
  title: string;
  description: string;
  type: 'inventory' | 'convention' | 'user' | 'audit';
  icon: React.ElementType;
  lastRun?: Date;
  link: string;
}

// Mock Reports
const mockReports: MockReport[] = [
  {
    id: 'report-inv-status',
    title: 'Inventory Status Summary',
    description: 'Overview of current item quantities, conditions, and locations.',
    type: 'inventory',
    icon: Package,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    link: '/reports/inventory-status',
  },
  {
    id: 'report-inv-movement',
    title: 'Item Movement History',
    description: 'Track the check-in/check-out history of specific items or categories.',
    type: 'inventory',
    icon: Warehouse,
    link: '/reports/item-movement',
  },
  {
    id: 'report-conv-equipment',
    title: 'Convention Equipment Usage',
    description: 'Report on equipment allocated, issued, and returned for a specific convention.',
    type: 'convention',
    icon: CalendarClock,
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
    link: '/reports/convention-equipment',
  },
  {
    id: 'report-conv-consumables',
    title: 'Convention Consumables Tracking',
    description: 'Monitor the usage of consumable items during a convention.',
    type: 'convention',
    icon: FileText,
    link: '/reports/convention-consumables',
  },
  {
    id: 'report-user-activity',
    title: 'User Activity Overview',
    description: 'Summary of actions performed by users within the association.',
    type: 'user',
    icon: Users,
    link: '/reports/user-activity',
  },
  {
    id: 'report-audit-log',
    title: 'Detailed Audit Log',
    description: 'View the full audit trail for security and compliance purposes.',
    type: 'audit',
    icon: FileSpreadsheet,
    lastRun: new Date(Date.now() - 5 * 60 * 1000),
    link: '/reports/audit-log',
  },
];

const ReportsList = () => {
  const { currentAssociation, isLoading } = useAssociation();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-6 w-6 bg-muted rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/3 mt-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!currentAssociation) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>No Association Selected</CardTitle>
            <CardDescription>
              Please select or create an association to access reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/association'}>
              Go to Associations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view reports for your inventory and conventions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export All (Coming Soon)
          </Button>
          <Button disabled>
            <BarChart className="mr-2 h-4 w-4" />
            Create Custom Report (Coming Soon)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockReports.map((report) => (
          <Card key={report.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{report.title}</CardTitle>
              <report.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{report.description}</CardDescription>
              {report.lastRun && (
                <p className="text-xs text-muted-foreground mt-4">
                  Last run: {formatDistanceToNow(report.lastRun, { addSuffix: true })}
                </p>
              )}
            </CardContent>
            <div className="p-4 pt-0">
              <Button asChild variant="outline" className="w-full">
                <Link to={report.link}>View Report</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsList;
