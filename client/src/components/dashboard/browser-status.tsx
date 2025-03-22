import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, BarChart2, Bell } from "lucide-react";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function BrowserStatus() {
  const { data: settings, isLoading } = useQuery({ 
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await apiRequest("PUT", "/api/settings", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const handleSettingChange = (setting: string, value: boolean) => {
    if (isLoading || !settings) return;
    
    const newSettings = { ...settings, [setting]: value };
    updateSettingsMutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Browser Status</h2>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-5 bg-gray-200 rounded w-40"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Browser Status</h2>
      <div className="space-y-4">
        <CustomSwitch
          id="toggle-filtering"
          label="Filtering Status"
          icon={<Shield className="text-[#107C10] h-4 w-4" />}
          defaultChecked={settings?.filteringEnabled}
          onChange={(checked) => handleSettingChange("filteringEnabled", checked)}
        />

        <CustomSwitch
          id="toggle-logging"
          label="Activity Logging"
          icon={<BarChart2 className="text-[#0078D4] h-4 w-4" />}
          defaultChecked={settings?.loggingEnabled}
          onChange={(checked) => handleSettingChange("loggingEnabled", checked)}
        />

        <CustomSwitch
          id="toggle-alerts"
          label="Alert Notifications"
          icon={<Bell className="text-[#D83B01] h-4 w-4" />}
          defaultChecked={settings?.alertsEnabled}
          onChange={(checked) => handleSettingChange("alertsEnabled", checked)}
        />
      </div>
    </div>
  );
}
