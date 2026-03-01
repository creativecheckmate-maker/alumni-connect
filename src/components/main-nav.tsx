
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
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';

const menuItems = [
  { href: '/', label: 'Home', icon: HomeIcon, public: true },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, public: false },
  { href: '/directory', label: 'Alumni Directory', icon: Users, public: true },
  { href: '/feed', label: 'Community Feed', icon: Rss, public: false },
  { href: '/events', label: 'Upcoming Events', icon: Calendar, public: true },
  { href: '/jobs', label: 'Job Board', icon: Briefcase, public: true },
  { href: '/mentorship', label: 'Mentorship', icon: GraduationCap, public: true },
  { href: '/notifications', label: 'Notifications', icon: Bell, public: false },
  { href: '/messages', label: 'Messages', icon: MessageCircle, public: false },
];

const frontPageOptions = [
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/community', label: 'Community Hub', icon: Globe },
];

export function MainNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const filteredItems = menuItems.filter(item => item.public || !!user);

  return (
    <Sidebar className="border-r-0 shadow-xl" collapsible="offcanvas">
      <SidebarHeader className="p-6">
        <Link href="/">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu>
          <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </div>
          {filteredItems.map((item) => (
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
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-6 pt-0">
        {user ? (
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
              className="w-full justify-between h-12 rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleLogout}
            >
              <span className="font-bold">Sign Out</span>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login" className="w-full">
               <Button className="w-full rounded-xl font-bold h-12">Join the Network</Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
