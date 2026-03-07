'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; 
import type { User, Friendship, SiteContent } from '@/lib/definitions';
import { UserCard } from '@/components/user-card';
import { useCollection, useUser, useFirestore, useMemoFirebase, useFirebase, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_EMAIL } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Edit, Loader2, Search, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function AdminEditDialog({ pageId, sectionId, initialData, label }: { pageId: string, sectionId: string, initialData: any, label: string }) {
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
      await setDoc(doc(firestore, 'siteContent', `${pageId}_${sectionId}`), {
        id: `${pageId}_${sectionId}`,
        pageId,
        sectionId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Updated", description: `${label} saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(data).map((key) => (
            <div key={key} className="space-y-2">
              <label className="capitalize text-xs font-bold text-muted-foreground block">{key.replace(/([A-Z])/g, ' $1')}</label>
              <Input 
                value={data[key] || ""} 
                onChange={(e) => setData({ ...data, [key]: e.target.value })} 
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DirectoryPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isAdmin = authUser?.email === ADMIN_EMAIL;
  
  const contentDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'directory_main'), [firestore]);
  const { data: directoryContent } = useDoc<SiteContent>(contentDocRef);

  const configDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'global_config'), [firestore]);
  const { data: globalConfig } = useDoc<SiteContent>(configDocRef);

  const usersCollectionRef = useMemoFirebase(
    () => {
        if (!firestore) return null;
        const baseQuery = collection(firestore, 'users');
        
        if (isAdmin) {
            return baseQuery;
        }
        return query(baseQuery, where('isVisibleInDirectory', '==', true));
    },
    [firestore, isAdmin]
  );
  
  const { data: users, isLoading } = useCollection<User>(usersCollectionRef);

  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(collection(firestore, 'friendships'), where('uids', 'array-contains', authUser.uid));
  }, [firestore, authUser?.uid]);

  const { data: friendships } = useCollection<Friendship>(friendshipQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const defaultContent = {
    tabAll: "All Alumni",
    tabStudent: "Students",
    tabProfessor: "Professors",
    tabStaff: "Staff",
    emptyMessage: "No alumni found matching your criteria."
  };

  const content = directoryContent?.data || defaultContent;
  const hideProfessors = globalConfig?.data?.hideProfessors === true;
  const hideStaff = globalConfig?.data?.hideStaff === true;

  const handleDeleteUser = (userId: string) => {
    if (!firestore || !isAdmin) return;
    const userDocRef = doc(firestore, 'users', userId);
    deleteDocumentNonBlocking(userDocRef);
    toast({ 
      title: "Firestore Purged", 
      description: "User profile details removed. Auth console manual removal required for complete reset." 
    });
  };

  const filteredUsers = users
    ? users.filter(user => {
        const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || user.role === activeTab;
        
        // Admin always sees everything. Other users respect global hide flags.
        if (!isAdmin) {
          if (hideProfessors && user.role === 'professor') return false;
          if (hideStaff && user.role === 'non-teaching-staff') return false;
        }

        return matchesSearch && matchesTab;
      })
    : [];

  const renderUserGrid = (usersToRender: User[]) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      );
    }

    if (!usersToRender || usersToRender.length === 0) {
        return (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <p className="text-muted-foreground font-medium">{content.emptyMessage}</p>
          </div>
        );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usersToRender.map((user) => (
          <UserCard 
            key={user.id} 
            user={user} 
            isAdmin={isAdmin} 
            handleDeleteUser={handleDeleteUser} 
            friendships={friendships || []}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <PageHeader title="Alumni Directory" description="Connect with fellow graduates and explore our global network."> 
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name..." 
              className="w-64 pl-9 bg-card" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && isEditMode && (
            <AdminEditDialog pageId="directory" sectionId="main" initialData={content} label="Directory Content" />
          )}
        </div>
      </PageHeader>

      {isAdmin && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 font-bold">Administrative Notice</AlertTitle>
          <AlertDescription className="text-yellow-700 text-xs">
            Deleting users here only removes their public profile. To permanently allow an email to re-register, you must also delete the user from the <strong>Firebase Console &gt; Authentication</strong> tab.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-xl mb-8">
          <TabsTrigger value="all" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">{content.tabAll}</TabsTrigger>
          <TabsTrigger value="student" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">{content.tabStudent}</TabsTrigger>
          
          {(isAdmin || !hideProfessors) && (
            <TabsTrigger value="professor" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">{content.tabProfessor}</TabsTrigger>
          )}
          
          {(isAdmin || !hideStaff) && (
            <TabsTrigger value="non-teaching-staff" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">{content.tabStaff}</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="all" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers)}
        </TabsContent>
        <TabsContent value="student" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'student'))}
        </TabsContent>
        <TabsContent value="professor" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'professor'))}
        </TabsContent> 
        <TabsContent value="non-teaching-staff" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'non-teaching-staff'))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
