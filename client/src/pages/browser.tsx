import { useState, FormEvent, useEffect, useRef } from "react";
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
  Info,
  Plus,
  X
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

// Type definitions for Electron API
declare global {
  // Simple WebView element interface for Electron
  interface HTMLWebViewElement extends HTMLElement {
    src: string;
    reload: () => void;
    goBack: () => void;
    goForward: () => void;
    getTitle?: () => string; // Optional method to get page title
  }
  
  // Add webview to JSX elements
  namespace JSX {
    interface IntrinsicElements {
      // Use any for webview attributes to avoid conflicts with existing definitions
      webview: any;
    }
  }
  
  // Electron API interface
  interface Window {
    electronAPI?: {
      // Website Access Control
      checkWebsiteAccess: (domain: string) => Promise<{isAllowed: boolean, rule?: any}>;
      // Browser Activity
      createBrowsingActivity: (activityData: any) => Promise<any>;
      // Window Title Management
      setWindowTitle: (data: { url: string, pageTitle?: string }) => Promise<boolean>;
      getPageTitle: (url: string) => Promise<string>;
    };
  }
}

export default function Browser() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [url, setUrl] = useState<string>("");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [accessRule, setAccessRule] = useState<any>(null);
  const [tabs, setTabs] = useState<{id: number, url: string, title: string}[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const webviewRef = useRef<HTMLWebViewElement | null>(null);
  const isElectron = !!window.electronAPI;
  
  // Define the app settings type
  interface AppSettings {
    id: number;
    filteringEnabled: boolean;
    loggingEnabled: boolean;
    defaultBrowserHomepage?: string;
    retentionPeriodDays?: number;
    notifyOnBlocked?: boolean;
  }
  
  // Get app settings
  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  // Function to check website access through Electron IPC or web API
  const checkWebsiteAccess = async (domain: string) => {
    if (isElectron && window.electronAPI) {
      // Use Electron IPC
      return await window.electronAPI.checkWebsiteAccess(domain);
    } else {
      // Use web API
      const res = await apiRequest("POST", "/api/check-access", { domain });
      return await res.json();
    }
  };
  
  // Function to log browsing activity
  const logBrowsingActivity = async (url: string, isBlocked: boolean) => {
    try {
      if (!url || !settings?.loggingEnabled) return;
      
      const domain = getDomainFromUrl(url);
      const activityData = {
        url: url,
        domain: domain,
        timestamp: new Date().toISOString(),
        isBlocked: isBlocked,
        browserInfo: navigator.userAgent
      };
      
      if (isElectron && window.electronAPI) {
        // Use Electron IPC
        await window.electronAPI.createBrowsingActivity(activityData);
      } else {
        // Use web API
        await apiRequest("POST", "/api/browsing-activities", activityData);
      }
    } catch (error) {
      console.error("Failed to log browsing activity:", error);
    }
  };

  const checkAccessMutation = useMutation({
    mutationFn: checkWebsiteAccess,
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
      const accessResult = await checkAccessMutation.mutateAsync(domain);
      
      // Log the browsing activity regardless of whether access is allowed
      await logBrowsingActivity(processedUrl, !accessResult.isAllowed);
      
      if (accessResult.isAllowed) {
        setCurrentUrl(processedUrl);
        
        // If in Electron, navigate the webview
        if (isElectron && webviewRef.current) {
          webviewRef.current.src = processedUrl;
        }
        
        // Update the current tab
        if (tabs.length > 0) {
          const updatedTabs = [...tabs];
          updatedTabs[activeTab] = {
            ...updatedTabs[activeTab],
            url: processedUrl,
            title: getDomainFromUrl(processedUrl)
          };
          setTabs(updatedTabs);
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to the requested website.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    setUrl("google.com");
    handleNavigate();
  };

  const handleRefresh = () => {
    if (isElectron && webviewRef.current) {
      webviewRef.current.reload();
    } else {
      handleNavigate();
    }
  };

  const handleGoBack = () => {
    if (isElectron && webviewRef.current) {
      webviewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (isElectron && webviewRef.current) {
      webviewRef.current.goForward();
    }
  };

  const addNewTab = () => {
    const newTabId = tabs.length > 0 ? Math.max(...tabs.map(tab => tab.id)) + 1 : 1;
    const newTab = {
      id: newTabId,
      url: '',
      title: 'New Tab'
    };
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
  };

  const closeTab = (tabIndex: number) => {
    if (tabs.length <= 1) return;
    
    const newTabs = tabs.filter((_, index) => index !== tabIndex);
    setTabs(newTabs);
    
    // Adjust active tab if needed
    if (activeTab === tabIndex) {
      setActiveTab(Math.max(0, tabIndex - 1));
    } else if (activeTab > tabIndex) {
      setActiveTab(activeTab - 1);
    }
  };

  // Set up webview event listeners
  useEffect(() => {
    if (isElectron && webviewRef.current) {
      const webview = webviewRef.current;
      
      const handleDidStartLoading = () => {
        setLoading(true);
      };
      
      const handleDidStopLoading = () => {
        setLoading(false);
      };
      
      const handleDidNavigate = () => {
        if (webview.src) {
          // Update the URL bar
          setUrl(webview.src);
          
          // Get better page title if possible
          let pageTitle = getDomainFromUrl(webview.src);
          
          // Try to get the page title from the webview
          if (webview.getTitle) {
            pageTitle = webview.getTitle();
          }
          
          // Update the window title via Electron
          if (isElectron && window.electronAPI) {
            window.electronAPI.setWindowTitle({ url: webview.src, pageTitle });
            
            // Also try to get a better title from Electron if needed
            if (!pageTitle || pageTitle === getDomainFromUrl(webview.src)) {
              window.electronAPI.getPageTitle(webview.src)
                .then((title: string) => {
                  if (title) {
                    // Update the tab with this better title
                    const updatedTabs = [...tabs];
                    updatedTabs[activeTab] = {
                      ...updatedTabs[activeTab],
                      title: title
                    };
                    setTabs(updatedTabs);
                  }
                }).catch((err: Error) => console.error("Error getting page title:", err));
            }
          }
          
          // Update current tab
          if (tabs.length > 0) {
            const updatedTabs = [...tabs];
            updatedTabs[activeTab] = {
              ...updatedTabs[activeTab],
              url: webview.src,
              title: pageTitle || getDomainFromUrl(webview.src)
            };
            setTabs(updatedTabs);
          }
          
          // Log the navigation
          logBrowsingActivity(webview.src, false);
        }
      };
      
      // Add event listeners
      webview.addEventListener('did-start-loading', handleDidStartLoading);
      webview.addEventListener('did-stop-loading', handleDidStopLoading);
      webview.addEventListener('did-navigate', handleDidNavigate);
      
      // Clean up event listeners
      return () => {
        webview.removeEventListener('did-start-loading', handleDidStartLoading);
        webview.removeEventListener('did-stop-loading', handleDidStopLoading);
        webview.removeEventListener('did-navigate', handleDidNavigate);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectron, activeTab, tabs.length]);
  
  // Set default homepage on first load
  useEffect(() => {
    if (tabs.length === 0) {
      // Create initial tab
      setTabs([{ id: 1, url: '', title: 'New Tab' }]);
    }
    
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
      <div className="mb-2">
        <Card>
          <CardContent className="p-2">
            {/* Tab bar */}
            <div className="flex items-center space-x-1 mb-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  className={`flex items-center px-3 py-1.5 rounded-t-md cursor-pointer ${
                    activeTab === index
                      ? "bg-gray-100 border-b-2 border-primary"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveTab(index)}
                >
                  <span className="max-w-[120px] truncate text-sm">
                    {tab.title || "New Tab"}
                  </span>
                  {tabs.length > 1 && (
                    <button
                      className="ml-2 text-gray-400 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                className="p-1 rounded-md hover:bg-gray-100"
                onClick={addNewTab}
                title="New Tab"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Browser controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleGoBack}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleGoForward}
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

      {settings && !settings.filteringEnabled && (
        <Alert className="mb-4 border-yellow-300 bg-yellow-50 text-yellow-800">
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
                  <li><span className="font-medium">Applied To:</span> {accessRule.appliedTo || "All Users"}</li>
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
      ) : isElectron ? (
        // Electron browser view using webview tag
        <div className="h-[calc(100vh-220px)] w-full bg-white rounded-lg shadow-sm overflow-hidden">
          {currentUrl ? (
            // @ts-ignore - webview is a valid HTML element in Electron
            <webview
              ref={webviewRef}
              src={currentUrl}
              className="w-full h-full border"
              style={{ display: loading ? 'none' : 'flex' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Enter a URL to start browsing</h2>
                <p className="text-gray-500 mb-6">
                  Type a website address in the search bar above and click Go
                </p>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
              <Loader2 className="h-10 w-10 animate-spin text-[#0078D4]" />
            </div>
          )}
        </div>
      ) : (
        // Web application view
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
                        In the Electron app, a webview would display the website here.
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
