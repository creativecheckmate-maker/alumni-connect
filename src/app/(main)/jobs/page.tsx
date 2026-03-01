
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Search, Briefcase, Plus, MapPin, Building2, ExternalLink, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import type { JobPosting } from '@/lib/definitions';
import { ADMIN_EMAIL } from '@/lib/config';

export default function JobsPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobPostings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: jobs } = useCollection<JobPosting>(jobsQuery);

  const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !authUser) return;
    
    const formData = new FormData(e.currentTarget);
    const jobData = {
      title: formData.get('title') as string,
      company: formData.get('company') as string,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      posterId: authUser.uid,
      companyLogoUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(firestore, 'jobPostings'), jobData);

    toast({
      title: "Job Posted Successfully",
      description: "Your job posting has been submitted.",
    });
  };

  const handleDeleteJob = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'jobPostings', id));
    toast({ title: "Job Deleted", description: "The job posting has been removed." });
  };

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="Job Board">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or company..." 
              className="w-80 pl-9 bg-card shadow-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Post a Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" /> Post New Opportunity
                </DialogTitle>
                <DialogDescription>
                  Help fellow alumni by sharing career opportunities.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePostJob} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Senior Product Designer" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" name="company" placeholder="e.g. Google, Nexus Tech" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g. Remote / New York, NY" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea id="description" name="description" placeholder="Key responsibilities..." required />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">Submit</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-10">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card key={job.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <CardHeader className="p-5">
                  <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 rounded-xl border-2 border-muted bg-white shrink-0 shadow-sm">
                          <AvatarImage src={job.companyLogoUrl} alt={job.company} className="object-contain p-2" />
                          <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold uppercase">{job.company.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-bold leading-none truncate">{job.title}</CardTitle>
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive -mt-1 -mr-1" 
                                onClick={() => handleDeleteJob(job.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{job.company}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{job.location}</span>
                          </div>
                      </div>
                  </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex-1">
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4 italic mb-4">
                  "{job.description}"
                </p>
              </CardContent>
              <CardFooter className="p-5 pt-0 mt-auto">
                <Button className="w-full h-10 gap-2 font-bold" onClick={() => toast({ title: "Applied", description: "Your application interest has been sent." })}>
                  Apply Now <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-lg font-bold">No jobs found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
