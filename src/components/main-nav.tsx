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
  TrendingUp,
  Trophy,
  MessageSquare,
  Network,
  Eye,
  EyeOff
} from 'lucide-react';
import { Logo } from './logo';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAIL } from '@/lib/config';
import type { SiteContent } from '@/lib/definitions';

function SidebarEditDialog({ initialData }: { initialData: any }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

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
      toast({ title: "Sidebar Updated", description: "Navigation settings saved." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const labels = data.labels || {};
  const visibility = data.visibility || {};

  const toggleVisibility = (key: string) => {
    setData((prev: any) => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [key]: !prev.visibility[key]
      }
    }));
  };

  const updateLabel = (key: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      labels: {
        ...prev.labels,
        [key]: value
      }
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Sidebar Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(labels).map((key) => (
              <div key={key} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-muted/50">
                <div className="flex-1 space-y-1">
                  <Label className="capitalize text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{key}</Label>
                  <Input 
                    className="h-9 text-sm font-medium"
                    value={labels[key]} 
                    onChange={(e) => updateLabel(key, e.target.value)} 
                  />
                </div>
                <div className="flex flex-col items-center gap-2 pt-4 min-w-[80px]">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Visibility</Label>
                  <div className="flex items-center gap-2">
                    {visibility[key] !== false ? <Eye className="h-3 w-3 text-primary" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                    <Switch 
                      checked={visibility[key] !== false} 
                      onCheckedChange={() => toggleVisibility(key)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 font-bold rounded-xl">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Sidebar Settings
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
    labels: {
      home: 'Home',
      dashboard: 'Dashboard',
      directory: 'Alumni Directory',
      feed: 'Community Feed',
      events: 'Upcoming Events',
      jobs: 'Job Board',
      mentorship: 'Mentorship',
      notifications: 'Notifications',
      analytics: 'Career Insights',
      leaderboard: 'Leaderboard',
      about: 'About Us',
      news: 'News',
      community: 'Community Hub',
      messages: 'Messaging',
      chat: 'Chat',
      network: 'Network',
      profile: 'My Profile',
      settings: 'Settings',
      signOut: 'Sign Out'
    },
    visibility: {} // Default all visible (true)
  };

  const config = sidebarContent?.data || defaultSidebar;
  const labels = config.labels || defaultSidebar.labels;
  const visibility = config.visibility || {};

  const isVisible = (key: string) => {
    // Admin in Edit Mode sees everything
    if (isAdmin && isEditMode) return true;
    return visibility[key] !== false;
  };

  const menuItems = [
    { href: '/', label: labels.home, icon: HomeIcon, public: true, key: 'home' },
    { href: '/dashboard', label: labels.dashboard, icon: LayoutGrid, public: false, key: 'dashboard' },
    { href: '/directory', label: labels.directory, icon: Users, public: true, key: 'directory' },
    { href: '/leaderboard', label: labels.leaderboard, icon: Trophy, public: true, key: 'leaderboard' },
    { href: '/feed', label: labels.feed, icon: Rss, public: false, key: 'feed' },
    { href: '/events', label: labels.events, icon: Calendar, public: true, key: 'events' },
    { href: '/jobs', label: labels.jobs, icon: Briefcase, public: true, key: 'jobs' },
    { href: '/mentorship', label: labels.mentorship, icon: GraduationCap, public: true, key: 'mentorship' },
    { href: '/analytics', label: labels.analytics, icon: TrendingUp, public: true, key: 'analytics' },
    { href: '/notifications', label: labels.notifications, icon: Bell, public: false, key: 'notifications' },
  ].filter(item => isVisible(item.key));

  const messageItems = [
    { href: '/messages/chat', label: labels.chat || 'Chat', icon: MessageSquare, key: 'chat' },
    { href: '/messages/network', label: labels.network || 'Network', icon: Network, key: 'network' },
  ].filter(item => isVisible(item.key));

  const exploreItems = [
    { href: '/about', label: labels.about, icon: Info, key: 'about' },
    { href: '/news', label: labels.news, icon: Newspaper, key: 'news' },
    { href: '/community', label: labels.community, icon: Globe, key: 'community' },
  ].filter(item => isVisible(item.key));

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const filteredMenuItems = menuItems.filter(item => item.public || !!user);

  return (
    <Sidebar className="border-r-0 shadow-xl" collapsible="offcanvas">
      <SidebarHeader className="p-6">
        <Link href="/">
          <Logo part1={logoPart1} part2={logoPart2} />
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu>
          {(filteredMenuItems.length > 0 || (isAdmin && isEditMode)) && (
            <>
              <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                Main Menu
                {isAdmin && isEditMode && <SidebarEditDialog initialData={config} />}
              </div>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.href} className="mb-1">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={`h-11 px-4 rounded-xl transition-all duration-200 ${visibility[item.key] === false ? 'opacity-50 grayscale bg-muted/20 border border-dashed border-primary/20' : ''}`}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-bold text-sm ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                      {isAdmin && isEditMode && visibility[item.key] === false && (
                        <EyeOff className="h-3 w-3 ml-auto text-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}

          {user && (messageItems.length > 0 || (isAdmin && isEditMode)) && (
            <>
              <div className="px-4 py-2 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {labels.messages || 'Messaging'}
              </div>
              {messageItems.map((item) => (
                <SidebarMenuItem key={item.href} className="mb-1">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className={`h-11 px-4 rounded-xl transition-all duration-200 ${visibility[item.key] === false ? 'opacity-50 grayscale bg-muted/20 border border-dashed border-primary/20' : ''}`}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className={`h-5 w-5 ${pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-bold text-sm ${pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                      {isAdmin && isEditMode && visibility[item.key] === false && (
                        <EyeOff className="h-3 w-3 ml-auto text-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
          
          {(exploreItems.length > 0 || (isAdmin && isEditMode)) && (
            <>
              <div className="px-4 py-2 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Explore
              </div>
              {exploreItems.map((item) => (
                <SidebarMenuItem key={item.href} className="mb-1">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={`h-11 px-4 rounded-xl transition-all duration-200 ${visibility[item.key] === false ? 'opacity-50 grayscale bg-muted/20 border border-dashed border-primary/20' : ''}`}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-bold text-sm ${pathname === item.href ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                      {isAdmin && isEditMode && visibility[item.key] === false && (
                        <EyeOff className="h-3 w-3 ml-auto text-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-6 pt-0">
        {user ? (
          <div className="space-y-3">
            {isVisible('profile') && (
              <Button 
                asChild
                variant="ghost" 
                className="w-full justify-start gap-3 h-11 px-4 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold"
              >
                <Link href="/profile">
                  <UserIcon className="h-5 w-5" /> {labels.profile || 'My Profile'}
                </Link>
              </Button>
            )}
            {isVisible('settings') && (
              <Button 
                asChild
                variant="ghost" 
                className="w-full justify-start gap-3 h-11 px-4 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold"
              >
                <Link href="/settings">
                  <Settings className="h-5 w-5" /> {labels.settings || 'Settings'}
                </Link>
              </Button>
            )}
            <Button 
              variant="default" 
              className="w-full justify-between h-12 rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleLogout}
            >
              <span className="font-bold">{labels.signOut || 'Sign Out'}</span>
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
