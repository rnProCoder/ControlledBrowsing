import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DownloadCloud,
  Search,
  BarChart2,
  Calendar,
  Filter,
  SlidersHorizontal,
  FileDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ActivityReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch browsing activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/browsing-activities"],
  });

  // Fetch users for the user dropdown
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Helper function to get username by ID
  const getUserName = (userId: number) => {
    const user = users?.find((u) => u.id === userId);
    return user?.fullName || user?.username || "Unknown";
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter activities based on search term and status filter
  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch = activity.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalActivities = activities?.length || 0;
  const blockedCount = activities?.filter(a => a.status === "Blocked").length || 0;
  const allowedCount = activities?.filter(a => a.status === "Allowed").length || 0;
  const warningCount = activities?.filter(a => a.status === "Warning").length || 0;
  
  const blockRate = totalActivities > 0 ? Math.round((blockedCount / totalActivities) * 100) : 0;

  return (
    <AppLayout
      pageTitle="Activity Reports"
      pageDescription="Monitor and analyze user browsing activity"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Activities</CardTitle>
            <BarChart2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
            <p className="text-xs text-gray-500 mt-1">Total browsing attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Block Rate</CardTitle>
            <FileDown className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Of total browsing attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Allowed</CardTitle>
            <div className="h-2 w-2 rounded-full bg-[#107C10]"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allowedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Successful browsing attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Blocked</CardTitle>
            <div className="h-2 w-2 rounded-full bg-[#A80000]"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Blocked browsing attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Browsing Activity Log</CardTitle>
          <CardDescription>
            Complete history of all browsing attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
            <div className="flex gap-4 flex-1 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search by domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Allowed">Allowed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
              <Button variant="outline" className="text-sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                More Filters
              </Button>
              <Button variant="default" className="text-sm bg-[#0078D4] hover:bg-[#005A9E]">
                <DownloadCloud className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Activities Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-32"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell className="text-right"><div className="h-8 bg-gray-200 rounded w-8 ml-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredActivities?.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2 bg-gray-200 text-gray-700">
                            <AvatarFallback>{getUserName(activity.userId).charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{getUserName(activity.userId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{activity.domain}</TableCell>
                      <TableCell>{formatDate(activity.timestamp)}</TableCell>
                      <TableCell>{formatTime(activity.timestamp)}</TableCell>
                      <TableCell>
                        <StatusBadge status={activity.status as any} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">Open menu</span>
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Add to Blocklist</DropdownMenuItem>
                            <DropdownMenuItem>Add to Allowlist</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter !== "all"
                        ? "No activities match your search criteria."
                        : "No browsing activities recorded yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
