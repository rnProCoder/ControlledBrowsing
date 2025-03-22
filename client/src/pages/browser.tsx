import { useState, FormEvent, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Loader2,
  RefreshCw,
  Shield,
  XCircle,
  Search,
  Globe,
  Info
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function Browser() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [url, setUrl] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [accessRule, setAccessRule] = useState<any>(null);
  
  // Get app settings
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const checkAccessMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiRequest("POST", "/api/check-access", { domain });
      return res.json();
    },
    onSuccess: (data) => {
      setAccessDenied(!data.isAllowed);
      setAccessRule(data.rule);
      if (!data.isAllowed) {
        toast({
          title: "Access Denied",
          description: `This website (${getDomainFromUrl(url)}) is blocked by your administrator.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not check website access: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Helper function to extract domain from a URL
  const getDomainFromUrl = (url: string): string => {
    try {
      if (!url.includes('://')) {
        url = 'https://' + url;
      }
      const domain = new URL(url).hostname;
      return domain;
    } catch (error) {
      return url;
    }
  };

  const handleNavigate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (!url) return;
    
    let processedUrl = url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    setLoading(true);
    const domain = getDomainFromUrl(processedUrl);
    
    try {
      await checkAccessMutation.mutateAsync(domain);
      setCurrentUrl(processedUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    setUrl("google.com");
    handleNavigate();
  };

  const handleRefresh = () => {
    handleNavigate();
  };

  // Set default homepage on first load
  useEffect(() => {
    if (!currentUrl) {
      setUrl("google.com");
      handleNavigate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout
      pageTitle="Secure Browser"
      pageDescription="Browse the web with administrative controls"
    >
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {/* Would go back in browser history */}}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {/* Would go forward in browser history */}}
                disabled={loading}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleGoHome}
                disabled={loading}
              >
                <Home className="h-4 w-4" />
              </Button>
              
              <form onSubmit={handleNavigate} className="flex-1 flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter a URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-9 pr-9 h-10"
                    disabled={loading}
                  />
                  {url && (
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setUrl("")}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="ml-2"
                  disabled={!url || loading}
                >
                  Go
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {!settings?.filteringEnabled && (
        <Alert className="mb-6 border-yellow-300 bg-yellow-50 text-yellow-800">
          <Info className="h-4 w-4" />
          <AlertTitle>Filtering Disabled</AlertTitle>
          <AlertDescription>
            Content filtering is currently disabled by your administrator. All websites are accessible.
          </AlertDescription>
        </Alert>
      )}

      {accessDenied ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center">
          <div className="max-w-md mx-auto">
            <Shield className="h-16 w-16 mx-auto mb-4 text-[#A80000]" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Blocked</h2>
            <p className="text-gray-600 mb-6">
              Your administrator has blocked access to <span className="font-semibold">{getDomainFromUrl(currentUrl)}</span>.
            </p>
            
            {accessRule && (
              <div className="bg-gray-50 p-4 rounded-md text-left mb-6">
                <p className="text-sm font-medium text-gray-600 mb-2">Policy Information:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li><span className="font-medium">Domain:</span> {accessRule.domain}</li>
                  <li><span className="font-medium">Type:</span> {accessRule.isAllowed ? "Allow" : "Block"}</li>
                  <li><span className="font-medium">Applied To:</span> {accessRule.appliedTo}</li>
                </ul>
              </div>
            )}
            
            <Button
              onClick={handleGoHome}
              className="bg-[#0078D4] hover:bg-[#005A9E]"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="mb-4 w-full max-w-md mx-auto grid grid-cols-2">
            <TabsTrigger value="browse">
              <Globe className="mr-2 h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="popular">
              <Star className="mr-2 h-4 w-4" />
              Popular Sites
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="mt-0">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-20 text-center">
                <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-[#0078D4]" />
                <p className="text-gray-500">Loading website...</p>
              </div>
            ) : currentUrl ? (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm font-normal flex items-center">
                    <div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
                    {getDomainFromUrl(currentUrl)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="border p-4 rounded-md aspect-video flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">
                        For security and privacy reasons, content from {getDomainFromUrl(currentUrl)} is not shown in this demo.
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        In a real application, an iframe or web view would display the website here.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Enter a URL to start browsing</h2>
                <p className="text-gray-500 mb-6">
                  Type a website address in the search bar above and click Go
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="popular" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Popular Websites</CardTitle>
                <CardDescription>
                  Quick access to commonly used websites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "Google", url: "google.com", icon: "🔍" },
                    { name: "Microsoft", url: "microsoft.com", icon: "🪟" },
                    { name: "Wikipedia", url: "wikipedia.org", icon: "📚" },
                    { name: "YouTube", url: "youtube.com", icon: "📺" },
                    { name: "BBC News", url: "bbc.com/news", icon: "📰" },
                    { name: "Weather", url: "weather.gov", icon: "☁️" },
                    { name: "Calculator", url: "calculator.net", icon: "🧮" },
                    { name: "Dictionary", url: "dictionary.com", icon: "📖" }
                  ].map((site) => (
                    <Button
                      key={site.name}
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center px-2 py-4"
                      onClick={() => {
                        setUrl(site.url);
                        handleNavigate();
                      }}
                    >
                      <span className="text-2xl mb-2">{site.icon}</span>
                      <span className="text-sm">{site.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
}

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
