import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  Ban, 
  CheckCircle, 
  BarChart, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
    text: string;
  };
}

export function StatisticsCards() {
  const { data: users } = useQuery({ 
    queryKey: ["/api/users"],
  });

  const { data: rules } = useQuery({ 
    queryKey: ["/api/website-rules"],
  });

  const { data: activities } = useQuery({ 
    queryKey: ["/api/browsing-activities"],
  });

  // Calculate stats
  const activeUsers = users?.length || 0;
  const blockedAttempts = activities?.filter(a => a.status === "Blocked").length || 0;
  const allowedWebsites = rules?.filter(r => r.isAllowed).length || 0;
  
  const statCards: StatCard[] = [
    {
      title: "Active Users",
      value: activeUsers,
      icon: <User className="text-lg" />,
      iconBgColor: "bg-[#C7E0F4]",
      iconTextColor: "text-[#0078D4]",
      trend: {
        value: "8%",
        isPositive: true,
        text: "from yesterday"
      }
    },
    {
      title: "Blocked Attempts",
      value: blockedAttempts,
      icon: <Ban className="text-lg" />,
      iconBgColor: "bg-[#A80000]/10",
      iconTextColor: "text-[#A80000]",
      trend: {
        value: "12%",
        isPositive: false,
        text: "from yesterday"
      }
    },
    {
      title: "Allowed Websites",
      value: allowedWebsites,
      icon: <CheckCircle className="text-lg" />,
      iconBgColor: "bg-[#107C10]/10",
      iconTextColor: "text-[#107C10]",
      trend: {
        value: "0%",
        isPositive: true,
        text: "No change"
      }
    },
    {
      title: "Total Traffic",
      value: "5.7GB",
      icon: <BarChart className="text-lg" />,
      iconBgColor: "bg-[#C7E0F4]",
      iconTextColor: "text-[#0078D4]",
      trend: {
        value: "3%",
        isPositive: true,
        text: "from yesterday"
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-700 mt-1">{card.value}</p>
            </div>
            <div className={`p-2 rounded-full ${card.iconBgColor} ${card.iconTextColor}`}>
              {card.icon}
            </div>
          </div>
          {card.trend && (
            <div className={`mt-4 text-xs flex items-center ${
              card.trend.value === "0%" 
                ? "text-gray-400" 
                : card.trend.isPositive 
                  ? "text-[#107C10]" 
                  : "text-[#A80000]"
            }`}>
              {card.trend.value !== "0%" && (
                card.trend.isPositive 
                  ? <TrendingUp className="mr-1 h-3 w-3" /> 
                  : <TrendingDown className="mr-1 h-3 w-3" />
              )}
              <span>{card.trend.text}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
