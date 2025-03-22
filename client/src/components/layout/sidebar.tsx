import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, 
  Users, 
  List, 
  BarChart, 
  Settings,
  HelpCircle,
  Search,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.isAdmin;

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-5 h-5 mr-2" />,
      adminOnly: true
    },
    {
      label: "User Management",
      href: "/user-management",
      icon: <Users className="w-5 h-5 mr-2" />,
      adminOnly: true
    },
    {
      label: "Website Access Rules",
      href: "/website-rules",
      icon: <List className="w-5 h-5 mr-2" />,
      adminOnly: true
    },
    {
      label: "Activity Reports",
      href: "/activity-reports",
      icon: <BarChart className="w-5 h-5 mr-2" />,
      adminOnly: true
    },
    {
      label: "Browse",
      href: "/browser",
      icon: <Globe className="w-5 h-5 mr-2" />,
      adminOnly: false
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <nav className="w-64 bg-white shadow-md z-10 flex-shrink-0">
      <div className="h-full flex flex-col">
        <div className="p-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-2">
          {filteredNavItems.map((item) => (
            <li className="mb-1" key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center py-2 px-4 rounded-md hover:bg-gray-100 transition-colors",
                    location === item.href
                      ? "bg-[#C7E0F4] text-[#0078D4] font-medium"
                      : "text-gray-500"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t border-gray-100">
          <a
            href="#"
            className="flex items-center py-2 px-4 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <HelpCircle className="w-5 h-5 mr-2" />
            <span>Help & Support</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
