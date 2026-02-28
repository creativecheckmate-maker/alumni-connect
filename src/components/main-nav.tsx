'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  Users,
  Rss,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  Calendar,
  GraduationCap,
  MessageCircle,
  User as UserIcon,
  Home as HomeIcon,
  Info,
  Newspaper,
  Globe,
} from 'lucide-react';
import { Logo } from './logo';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';

const menuItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/directory', label: 'Alumni Directory', icon: Users },
  { href: '/feed', label: 'Community Feed', icon: Rss },
  { href: '/events', label: 'Upcoming Events', icon: Calendar },
  { href: '/jobs', label: 'Job Board', icon: Briefcase },
  { href: '/mentorship', label: 'Mentorship', icon: GraduationCap },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
];

const frontPageOptions = [
  { href: '#', label: 'About Us', icon: Info },
  { href: '#', label: 'News', icon: Newspaper },
  { href: '#', label: 'Community', icon: Globe },
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
          <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </div>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href} className="mb-1">
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="h-11 px-4 rounded-xl transition-all duration-200"
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-bold text-sm ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Explore
          </div>
          {frontPageOptions.map((item) => (
            <SidebarMenuItem key={item.label} className="mb-1">
              <SidebarMenuButton
                asChild
                className="h-11 px-4 rounded-xl transition-all duration-200"
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-bold text-sm text-muted-foreground">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-6 pt-0">
        <div className="space-y-3">
          <Button 
            asChild
            variant="ghost" 
            className="w-full justify-start gap-3 h-11 px-4 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold"
          >
            <Link href="/profile">
              <UserIcon className="h-5 w-5" /> My Profile
            </Link>
          </Button>
          <Button 
            asChild
            variant="ghost" 
            className="w-full justify-start gap-3 h-11 px-4 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold"
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" /> Settings
            </Link>
          </Button>
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
