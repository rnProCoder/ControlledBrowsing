import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActivityProps {
  limit?: number;
}

export function RecentActivity({ limit = 5 }: ActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/recent-activities", { limit }],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Helper function to get username by ID
  const getUserName = (userId: number) => {
    const user = users?.find((u) => u.id === userId);
    return user?.fullName || user?.username || "Unknown";
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-700">Recent Browsing Activity</h2>
          <Button variant="link" className="text-[#0078D4] p-0">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Website</th>
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 pr-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="py-3">
                    <div className="h-6 bg-gray-200 rounded-full w-6"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Recent Browsing Activity</h2>
        <Button variant="link" className="text-[#0078D4] p-0">View All</Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">User</th>
              <th className="pb-2 font-medium">Website</th>
              <th className="pb-2 font-medium">Time</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {activities?.map((activity) => (
              <tr key={activity.id} className="border-b border-gray-100">
                <td className="py-3 pr-4">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2 bg-gray-200 text-gray-700">
                      <AvatarFallback>{getUserName(activity.userId).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{getUserName(activity.userId)}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">{activity.domain}</td>
                <td className="py-3 pr-4 text-gray-400">{formatTime(activity.timestamp)}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={activity.status as any} />
                </td>
                <td className="py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Block Domain</DropdownMenuItem>
                      <DropdownMenuItem>Add to Allowlist</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            
            {activities?.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No recent activity found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
