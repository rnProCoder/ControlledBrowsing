import { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

export function AppLayout({
  children,
  pageTitle = "",
  pageDescription = "",
}: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-[#F3F2F1]">
          <div className="max-w-7xl mx-auto">
            {(pageTitle || pageDescription) && (
              <div className="mb-8">
                {pageTitle && (
                  <h1 className="text-2xl font-semibold text-gray-700 mb-2">{pageTitle}</h1>
                )}
                {pageDescription && (
                  <p className="text-gray-400">{pageDescription}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
