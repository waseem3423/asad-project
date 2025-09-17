

'use client';

import {
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  PawPrint,
  Settings,
  Stethoscope,
  Truck,
  Users,
  Banknote
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth.tsx';
import React from 'react';

const allMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier', 'worker'] },
  { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'cashier'] },
  { href: '/triage', label: 'Automated Triage', icon: Stethoscope, roles: ['admin', 'worker'] },
  { href: '/customers', label: 'Customers', icon: PawPrint, roles: ['admin', 'cashier'] },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'worker'] },
  { href: '/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'worker'] },
  { href: '/expenses', label: 'Expenses', icon: Banknote, roles: ['admin', 'cashier'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role, settings } = useAuth();

  const menuItems = React.useMemo(() => {
    if (!role) return [];
    return allMenuItems.filter(item => item.roles.includes(role));
  }, [role]);

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground">
          <PawPrint className="h-7 w-7 text-primary" />
          <span>{settings.appName}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2 bg-sidebar-border" />
        <SidebarMenu>
          {role === 'admin' && (
            <SidebarMenuItem>
              <Link href="/settings">
                  <SidebarMenuButton
                    isActive={pathname === '/settings'}
                    tooltip="Settings"
                  >
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
