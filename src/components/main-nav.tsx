
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  Users,
  Rss,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  Home,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Logo } from './logo';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/directory', label: 'Alumni Directory', icon: Users },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/mentorship', label: 'Job and Mentorship', icon: Briefcase },
  { href: '/notifications', label: 'News and Updates', icon: Bell },
  { href: '/donate', label: 'Donate', icon: Heart },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
];

export function MainNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  return (
    <Sidebar className="border-r-0 shadow-xl">
      <SidebarHeader className="p-6">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href} className="mb-1">
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  className="h-11 px-4 rounded-xl transition-all duration-200"
                  tooltip={item.label}
                >
                  <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-bold text-sm ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <div className="space-y-3">
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 px-4 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold">
              <Settings className="h-5 w-5" /> Settings
            </Button>
          </Link>
          <Button 
            variant="default" 
            className="w-full justify-between h-12 rounded-xl shadow-lg shadow-primary/20"
            onClick={handleLogout}
          >
            <span className="font-bold">Sign Out</span>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
