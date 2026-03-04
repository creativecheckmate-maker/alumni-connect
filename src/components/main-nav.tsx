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
  User as UserIcon,
  Home as HomeIcon,
  Info,
  Newspaper,
  Globe,
  Edit,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { Logo } from './logo';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAIL } from '@/lib/config';
import type { SiteContent } from '@/lib/definitions';

function SidebarEditDialog({ initialData }: { initialData: any }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', 'global_sidebar'), {
        id: 'global_sidebar',
        pageId: 'global',
        sectionId: 'sidebar',
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Sidebar Updated", description: "Navigation labels saved." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save labels." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sidebar Labels</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {Object.keys(initialData).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize text-[10px]">{key.replace(/([A-Z])/g, ' $1')}</Label>
              <Input 
                className="h-8 text-xs"
                value={data[key]} 
                onChange={(e) => setData({ ...data, [key]: e.target.value })} 
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MainNavProps {
  logoPart1?: string;
  logoPart2?: string;
}

export function MainNav({ logoPart1, logoPart2 }: MainNavProps) {
  const pathname = usePathname();
  const auth = useAuth();
  const { user, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const router = useRouter();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const sidebarDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'global_sidebar'), [firestore]);
  const { data: sidebarContent } = useDoc<SiteContent>(sidebarDocRef);

  const defaultSidebar = {
    home: 'Home',
    dashboard: 'Dashboard',
    directory: 'Alumni Directory',
    feed: 'Community Feed',
    events: 'Upcoming Events',
    jobs: 'Job Board',
    mentorship: 'Mentorship',
    notifications: 'Notifications',
    analytics: 'Career Insights',
    about: 'About Us',
    news: 'News',
    community: 'Community Hub',
    signOut: 'Sign Out',
    joinButton: 'Join the Network',
    profile: 'My Profile',
    settings: 'Settings'
  };

  const labels = sidebarContent?.data || defaultSidebar;

  const menuItems = [
    { href: '/', label: labels.home, icon: HomeIcon, public: true },
    { href: '/dashboard', label: labels.dashboard, icon: LayoutGrid, public: false },
    { href: '/directory', label: labels.directory, icon: Users, public: true },
    { href: '/feed', label: labels.feed, icon: Rss, public: false },
    { href: '/events', label: labels.events, icon: Calendar, public: true },
    { href: '/jobs', label: labels.jobs, icon: Briefcase, public: true },
    { href: '/mentorship', label: labels.mentorship, icon: GraduationCap, public: true },
    { href: '/analytics', label: labels.analytics, icon: TrendingUp, public: true },
    { href: '/notifications', label: labels.notifications, icon: Bell, public: false },
  ];

  const frontPageOptions = [
    { href: '/about', label: labels.about, icon: Info },
    { href: '/news', label: labels.news, icon: Newspaper },
    { href: '/community', label: labels.community, icon: Globe },
  ];

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
          <Logo part1={logoPart1} part2={logoPart2} />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu>
          <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Main Menu
            {isAdmin && isEditMode && <SidebarEditDialog initialData={labels} />}
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
                <UserIcon className="h-5 w-5" /> {labels.profile}
              </Link>
            </Button>
            <Button 
              asChild
              variant="ghost" 
              className="w-full justify-start gap-3 h-11 px-4 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold"
            >
              <Link href="/settings">
                <Settings className="h-5 w-5" /> {labels.settings}
              </Link>
            </Button>
            <Button 
              variant="default" 
              className="w-full justify-between h-12 rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleLogout}
            >
              <span className="font-bold">{labels.signOut}</span>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login" className="w-full">
               <Button className="w-full rounded-xl font-bold h-12">{labels.joinButton}</Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}