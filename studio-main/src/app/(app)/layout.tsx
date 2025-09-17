"use client";

import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const adminOnlyRoutes = ['/reports', '/settings'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, role, settings } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && settings.appName) {
        document.title = settings.appName;
    }
  }, [settings, loading]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (role === 'cashier' || role === 'worker') {
        if (adminOnlyRoutes.includes(pathname)) {
          router.replace('/dashboard'); // Or a dedicated 'unauthorized' page
        }
      }
    }
  }, [user, loading, role, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block">
          <div className="h-svh w-[16rem] bg-sidebar p-4">
             <Skeleton className="h-8 w-3/4 mb-6" />
             <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
             </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
                <div className="w-full flex-1"></div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </header>
            <main className="flex-1 p-4 sm:p-6">
                <Skeleton className="h-32 w-full" />
            </main>
        </div>
      </div>
    );
  }

  return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar>
            <AppSidebar />
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <div className="flex h-full flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
                {children}
              </main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
  );
}
