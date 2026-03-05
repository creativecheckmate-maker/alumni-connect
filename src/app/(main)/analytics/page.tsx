
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User, JobPosting, SiteContent } from '@/lib/definitions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Loader2, TrendingUp, Users, Briefcase, Globe, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAIL } from '@/lib/config';

const COLORS = ['#880e14', '#d32f2f', '#f44336', '#ef5350', '#e57373'];

function AdminEditDialog({ pageId, sectionId, initialData, label, overlay = false }: { pageId: string, sectionId: string, initialData: any, label: string, overlay?: boolean }) {
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
        <Button size="icon" variant="secondary" className={`${overlay ? 'absolute top-2 right-2 z-50' : 'ml-2'} h-8 w-8 rounded-full shadow-lg`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(data).map((key) => {
            return (
              <div key={key} className="space-y-2">
                <label className="capitalize text-sm font-bold text-muted-foreground block">{key.replace(/([A-Z])/g, ' $1')}</label>
                {key.toLowerCase().includes('description') || key.toLowerCase().includes('content') ? (
                  <Textarea value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
                ) : (
                  <Input value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
                )}
              </div>
            );
          })}
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

export default function AnalyticsPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const contentDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'analytics_main'), [firestore]);
  const { data: analyticsContent } = useDoc<SiteContent>(contentDocRef);

  const footerDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'analytics_footer'), [firestore]);
  const { data: footerContent } = useDoc<SiteContent>(footerDocRef);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('isVisibleInDirectory', '==', true));
  }, [firestore]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'jobPostings');
  }, [firestore]);

  const { data: allJobs } = useCollection<JobPosting>(jobsQuery);

  // Calculate industry distribution
  const industryData = allJobs ? Object.entries(
    allJobs.reduce((acc: any, job) => {
      const ind = job.industry || 'Technology';
      acc[ind] = (acc[ind] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })) : [];

  // Calculate batch distribution
  const batchData = allUsers ? Object.entries(
    allUsers.filter(u => u.role === 'student' && u.graduationYear).reduce((acc: any, user) => {
      const batch = user.graduationYear?.toString() || 'Unknown';
      acc[batch] = (acc[batch] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)) : [];

  const defaultMain = {
    industryTitle: "Industry Distribution",
    industryDescription: "Major sectors where our alumni are building their careers.",
    batchTitle: "Alumni by Batch",
    batchDescription: "Member strength across different graduation years.",
    statAlumniLabel: "Total Alumni",
    statJobsLabel: "Open Roles",
    statCountriesLabel: "Countries",
    statEngagementLabel: "Engagement"
  };

  const defaultFooter = {
    title: "Technical Implementation Details",
    content: "This analytics dashboard leverages Firebase Firestore Real-time Listeners to aggregate community data. The charts are rendered using Recharts, a composable charting library built on React components. Data processing is handled client-side using robust array transformations, ensuring optimal performance for modern browsers."
  };

  const main = analyticsContent?.data || defaultMain;
  const footer = footerContent?.data || defaultFooter;

  if (isUsersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <PageHeader title="Career Insights" description="Visual analytics of our alumni network distribution and career trends." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none bg-primary text-primary-foreground relative">
            {isAdmin && isEditMode && <AdminEditDialog pageId="analytics" sectionId="main" initialData={main} label="Page Text" overlay />}
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 opacity-70" />
                    <span className="text-[10px] font-bold uppercase">{main.statAlumniLabel}</span>
                </div>
                <div className="text-3xl font-bold">{allUsers?.length || 0}</div>
                <p className="text-[10px] mt-1 opacity-70">Active members in the directory</p>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Briefcase className="h-5 w-5 text-primary opacity-70" />
                    <span className="text-[10px] font-bold uppercase">{main.statJobsLabel}</span>
                </div>
                <div className="text-3xl font-bold">{allJobs?.length || 0}</div>
                <p className="text-[10px] mt-1 text-muted-foreground">Exclusively for Nexus alumni</p>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Globe className="h-5 w-5 text-primary opacity-70" />
                    <span className="text-[10px] font-bold uppercase">{main.statCountriesLabel}</span>
                </div>
                <div className="text-3xl font-bold">12+</div>
                <p className="text-[10px] mt-1 text-muted-foreground">Global alumni reach</p>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-primary opacity-70" />
                    <span className="text-[10px] font-bold uppercase">{main.statEngagementLabel}</span>
                </div>
                <div className="text-3xl font-bold">94%</div>
                <p className="text-[10px] mt-1 text-muted-foreground">Monthly active alumni</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>{main.industryTitle}</CardTitle>
            <CardDescription>{main.industryDescription}</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData.length > 0 ? industryData : [{ name: 'Technology', value: 10 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>{main.batchTitle}</CardTitle>
            <CardDescription>{main.batchDescription}</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchData.length > 0 ? batchData : [{ name: '2024', value: 5 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: '#f9f9f9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#880e14" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-muted/20 relative">
        {isAdmin && isEditMode && <AdminEditDialog pageId="analytics" sectionId="footer" initialData={footer} label="Footer Content" overlay />}
        <CardContent className="p-8 text-center space-y-4">
            <h3 className="font-bold text-xl">{footer.title}</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {footer.content}
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
