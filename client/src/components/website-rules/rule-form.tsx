import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertWebsiteRuleSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Extend the schema with validation
const formSchema = insertWebsiteRuleSchema.extend({
  domain: z.string().min(3, "Domain must be at least 3 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function WebsiteRuleForm({ ruleId }: { ruleId?: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!ruleId;
  
  // Query to fetch the rule if in edit mode
  const { data: rule, isLoading: isLoadingRule } = useQuery({
    queryKey: ["/api/website-rules", ruleId],
    enabled: isEditMode,
    queryFn: async () => {
      const rules = await queryClient.fetchQuery({
        queryKey: ["/api/website-rules"],
      });
      return rules.find((r: any) => r.id === ruleId);
    },
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
      isAllowed: true,
      isTimeLimited: false,
      appliedTo: "All Users",
      createdBy: user?.id || 0,
    },
  });

  // Set form values when rule data is loaded
  useEffect(() => {
    if (rule && isEditMode) {
      form.reset({
        domain: rule.domain,
        isAllowed: rule.isAllowed,
        isTimeLimited: rule.isTimeLimited,
        appliedTo: rule.appliedTo,
        createdBy: rule.createdBy,
      });
    }
  }, [rule, form, isEditMode]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/website-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-rules"] });
      toast({
        title: "Success",
        description: "Website rule has been created",
      });
      navigate("/website-rules");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("PUT", `/api/website-rules/${ruleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/website-rules"] });
      toast({
        title: "Success",
        description: "Website rule has been updated",
      });
      navigate("/website-rules");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoadingRule) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <FormControl>
                <Input placeholder="example.com or *.example.com" {...field} />
              </FormControl>
              <FormDescription>
                Use * as a wildcard prefix (e.g., *.example.com)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAllowed"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Access Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === "allow")}
                  defaultValue={field.value ? "allow" : "block"}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="allow" />
                    </FormControl>
                    <FormLabel className="font-normal">Allow</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="block" />
                    </FormControl>
                    <FormLabel className="font-normal">Block</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isTimeLimited"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Time Limited</FormLabel>
                <FormDescription>
                  Restrict access to specific times of day
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appliedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apply To</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who this rule applies to" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All Users">All Users</SelectItem>
                  <SelectItem value="Group: Students">Group: Students</SelectItem>
                  <SelectItem value="Group: Staff">Group: Staff</SelectItem>
                  <SelectItem value="Group: Guests">Group: Guests</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate("/website-rules")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Rule" : "Create Rule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
