import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { WebsiteRuleForm } from "@/components/website-rules/rule-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Globe, Plus, Search, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { WebsiteRule } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WebsiteRules() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [editRuleId, setEditRuleId] = useState<number | null>(null);

  // Parse URL for edit parameter
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const editId = params.get("edit");
    if (editId) {
      const id = parseInt(editId);
      if (!isNaN(id)) {
        setEditRuleId(id);
        setDialogOpen(true);
      }
    }
  }, [location]);

  // Fetch website rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ["/api/website-rules"],
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/website-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-rules"] });
      toast({
        title: "Success",
        description: "Website rule has been deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter rules based on search term
  const filteredRules = rules?.filter((rule: WebsiteRule) => 
    rule.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle add button click
  const handleAddRule = () => {
    setEditRuleId(null);
    setDialogOpen(true);
  };

  // Handle edit button click
  const handleEditRule = (id: number) => {
    setEditRuleId(id);
    setDialogOpen(true);
    setLocation(`/website-rules?edit=${id}`, { replace: true });
  };

  // Handle delete button click
  const handleDeleteRule = (id: number) => {
    setSelectedRuleId(id);
    setDeleteDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    if (editRuleId) {
      setLocation("/website-rules", { replace: true });
      setEditRuleId(null);
    }
  };

  // Confirm delete
  const confirmDelete = () => {
    if (selectedRuleId !== null) {
      deleteMutation.mutate(selectedRuleId);
    }
    setDeleteDialogOpen(false);
  };

  // Helper function to determine the status text from a rule
  const getStatusFromRule = (rule: WebsiteRule) => {
    if (rule.isTimeLimited) return "Time Limited";
    return rule.isAllowed ? "Allowed" : "Blocked";
  };

  return (
    <AppLayout
      pageTitle="Website Access Rules"
      pageDescription="Manage which websites users can access"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-80">
            <Input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Button 
            variant="default" 
            onClick={handleAddRule}
            className="bg-[#0078D4] hover:bg-[#005A9E]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Rule
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="py-3 px-4 font-medium">Domain</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Applied To</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : filteredRules?.length > 0 ? (
                filteredRules.map((rule: WebsiteRule) => (
                  <tr key={rule.id} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Globe className="text-[#0078D4] mr-2 h-5 w-5" />
                        <span>{rule.domain}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={getStatusFromRule(rule)} />
                    </td>
                    <td className="py-4 px-4">{rule.appliedTo}</td>
                    <td className="py-4 px-4 space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-gray-500 hover:text-[#0078D4]"
                        onClick={() => handleEditRule(rule.id)}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-gray-500 hover:text-[#A80000]"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    {searchTerm 
                      ? "No rules match your search. Try a different keyword." 
                      : "No website rules found. Add your first rule to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRuleId ? "Edit Website Rule" : "Add New Website Rule"}</DialogTitle>
            <DialogDescription>
              {editRuleId 
                ? "Modify the access rule for this website domain." 
                : "Create a new rule to control access to a website domain."}
            </DialogDescription>
          </DialogHeader>
          <WebsiteRuleForm ruleId={editRuleId || undefined} />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this website rule. This action cannot be undone.
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
    </AppLayout>
  );
}
