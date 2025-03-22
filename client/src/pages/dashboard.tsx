import { AppLayout } from "@/components/layout/app-layout";
import { StatisticsCards } from "@/components/dashboard/statistics-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { BrowserStatus } from "@/components/dashboard/browser-status";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WebsiteRulesTable } from "@/components/dashboard/website-rules-table";

export default function Dashboard() {
  return (
    <AppLayout 
      pageTitle="Admin Dashboard" 
      pageDescription="Manage website access and monitor user activity"
    >
      <StatisticsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions />
          <BrowserStatus />
        </div>
        
        <div className="lg:col-span-2">
          <RecentActivity />
          <WebsiteRulesTable />
        </div>
      </div>
    </AppLayout>
  );
}
