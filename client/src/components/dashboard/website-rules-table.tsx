import { useQuery, useMutation } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Globe, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WebsiteRule } from "@shared/schema";

export function WebsiteRulesTable({ limit = 4 }: { limit?: number }) {
  const [_, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["/api/website-rules"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/website-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-rules"] });
    },
  });

  const handleDelete = (id: number) => {
    setSelectedRuleId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRuleId !== null) {
      deleteMutation.mutate(selectedRuleId);
    }
    setDeleteDialogOpen(false);
  };

  const getStatusFromRule = (rule: WebsiteRule) => {
    if (rule.isTimeLimited) return "Time Limited";
    return rule.isAllowed ? "Allowed" : "Blocked";
  };

  const limitedRules = rules?.slice(0, limit);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-700">Website Access Rules</h2>
          <Button 
            variant="default" 
            className="text-sm bg-[#0078D4] hover:bg-[#005A9E]"
            onClick={() => navigate("/website-rules")}
          >
            <span className="flex items-center">
              <span className="mr-1">+</span>
              <span>Add Rule</span>
            </span>
          </Button>
        </div>
        <div className="animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-36"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Website Access Rules</h2>
        <div className="flex items-center">
          <Button 
            variant="default" 
            className="text-sm bg-[#0078D4] hover:bg-[#005A9E]"
            onClick={() => navigate("/website-rules")}
          >
            <span className="flex items-center">
              <span className="mr-1">+</span>
              <span>Add Rule</span>
            </span>
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Domain</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Applied To</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {limitedRules?.map((rule) => (
              <tr key={rule.id} className="border-b border-gray-100">
                <td className="py-3 pr-4">
                  <div className="flex items-center">
                    <Globe className="text-[#0078D4] mr-2 h-4 w-4" />
                    <span>{rule.domain}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={getStatusFromRule(rule)} />
                </td>
                <td className="py-3 pr-4">{rule.appliedTo}</td>
                <td className="py-3 space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-[#0078D4]"
                    onClick={() => navigate(`/website-rules?edit=${rule.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-[#A80000]"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            
            {limitedRules?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  No website rules found. Add your first rule to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {rules && rules.length > limit && (
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              className="text-[#0078D4]"
              onClick={() => navigate("/website-rules")}
            >
              View All Rules
            </Button>
          </div>
        )}
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the website rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#A80000] hover:bg-[#A80000]/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
