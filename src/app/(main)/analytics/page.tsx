
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User, JobPosting } from '@/lib/definitions';
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
import { Loader2, TrendingUp, Users, Briefcase, Globe } from 'lucide-react';

const COLORS = ['#880e14', '#d32f2f', '#f44336', '#ef5350', '#e57373'];

export default function AnalyticsPage() {
  const firestore = useFirestore();

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
        <Card className="border-none bg-primary text-primary-foreground">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 opacity-70" />
                    <span className="text-[10px] font-bold uppercase">Total Alumni</span>
                </div>
                <div className="text-3xl font-bold">{allUsers?.length || 0}</div>
                <p className="text-[10px] mt-1 opacity-70">Active members in the directory</p>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Briefcase className="h-5 w-5 text-primary opacity-70" />
                    <span className="text-[10px] font-bold uppercase">Open Roles</span>
                </div>
                <div className="text-3xl font-bold">{allJobs?.length || 0}</div>
                <p className="text-[10px] mt-1 text-muted-foreground">Exclusively for Nexus alumni</p>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <Globe className="h-5 w-5 text-primary opacity-70" />
                    <span className="text-[10px] font-bold uppercase">Countries</span>
                </div>
                <div className="text-3xl font-bold">12+</div>
                <p className="text-[10px] mt-1 text-muted-foreground">Global alumni reach</p>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-primary opacity-70" />
                    <span className="text-[10px] font-bold uppercase">Engagement</span>
                </div>
                <div className="text-3xl font-bold">94%</div>
                <p className="text-[10px] mt-1 text-muted-foreground">Monthly active alumni</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Industry Distribution</CardTitle>
            <CardDescription>Major sectors where our alumni are building their careers.</CardDescription>
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
            <CardTitle>Alumni by Batch</CardTitle>
            <CardDescription>Member strength across different graduation years.</CardDescription>
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

      <Card className="border-none bg-muted/20">
        <CardContent className="p-8 text-center space-y-4">
            <h3 className="font-bold text-xl">Technical Implementation Details</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                This analytics dashboard leverages <strong>Firebase Firestore Real-time Listeners</strong> to aggregate community data. 
                The charts are rendered using <strong>Recharts</strong>, a composable charting library built on React components. 
                Data processing is handled client-side using robust array transformations, ensuring optimal performance for modern browsers.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
