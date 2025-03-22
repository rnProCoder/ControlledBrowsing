import { useLocation } from "wouter";
import { 
  PlusCircle, 
  Globe, 
  FileDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const [_, navigate] = useLocation();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
      <div className="space-y-4">
        <Button 
          variant="default" 
          className="w-full justify-between bg-[#0078D4] hover:bg-[#005A9E]"
          onClick={() => navigate("/user-management")}
        >
          <span className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Add New User</span>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-between border-[#0078D4] text-[#0078D4] hover:bg-[#C7E0F4] hover:text-[#0078D4]"
          onClick={() => navigate("/website-rules")}
        >
          <span className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <span>Manage Website Rules</span>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-between border-gray-200 text-gray-700 hover:bg-gray-50"
          onClick={() => navigate("/activity-reports")}
        >
          <span className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            <span>Export Reports</span>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
