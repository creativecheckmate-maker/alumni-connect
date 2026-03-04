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
import { Search, Briefcase, Plus, MapPin, Building2, ExternalLink, Trash2, Edit, Loader2, Upload } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { JobPosting, SiteContent } from '@/lib/definitions';
import { ADMIN_EMAIL } from '@/lib/config';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';

export default function JobsPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const isAdmin = authUser?.email === ADMIN_EMAIL || authUser?.email === 'geminiak8@gmail.com' || authUser?.uid === 'zEyeEyDugUWHv4RYKvgntWLunXH2';

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobPostings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: jobs } = useCollection<JobPosting>(jobsQuery);

  const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !authUser) return;
    const formData = new FormData(e.currentTarget);
    await addDoc(collection(firestore, 'jobPostings'), {
      title: formData.get('title'),
      company: formData.get('company'),
      location: formData.get('location'),
      description: formData.get('description'),
      posterId: authUser.uid,
      companyLogoUrl: logoUrl || `https://picsum.photos/seed/${Math.random()}/100/100`,
      createdAt: serverTimestamp(),
    });
    setLogoUrl(null);
    toast({ title: "Job Posted", description: "Your listing is now live." });
  };

  const handleDeleteJob = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'jobPostings', id));
    toast({ title: "Job Deleted", description: "The listing has been removed." });
  };

  const filteredJobs = jobs?.filter(job => job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="Job Board">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="w-80 pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {authUser ? (
            <Dialog>
              <DialogTrigger asChild><Button className="gap-2 shadow-lg"><Plus className="h-4 w-4" /> Post a Job</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Post New Opportunity</DialogTitle></DialogHeader>
                <form onSubmit={handlePostJob} className="grid gap-4 py-4">
                  <Label>Job Title</Label><Input name="title" required />
                  <Label>Company</Label><Input name="company" required />
                  <Label>Location</Label><Input name="location" required />
                  <Label>Description</Label><Textarea name="description" required />
                  <Label>Company Logo</Label>
                  <div className="flex gap-2">
                    <Input value={logoUrl || ""} readOnly className="bg-muted/50" />
                    <CldUploadWidget 
                      uploadPreset="ml_default" 
                      options={{ 
                        cloudName: "dnex9nw0f", 
                        cropping: true, 
                        showSkipCropButton: true,
                        singleUploadAutoClose: true, 
                        croppingAspectRatio: 1, 
                        multiple: false 
                      }} 
                      onSuccess={(result: any) => setLogoUrl(result.info.secure_url)}
                    >
                      {({ open }) => <Button type="button" variant="outline" onClick={() => open()}><Upload className="h-4 w-4" /></Button>}
                    </CldUploadWidget>
                  </div>
                  <Button type="submit" className="w-full">Submit Job</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : <Link href="/login"><Button variant="outline">Log In to Post</Button></Link>}
        </div>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-10">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="group border-none shadow-sm hover:shadow-xl transition-all flex flex-col">
            <CardHeader className="p-5 flex flex-row items-start gap-4">
                <Avatar className="h-14 w-14 rounded-xl border"><AvatarImage src={job.companyLogoUrl} className="object-contain p-2" /><AvatarFallback className="font-bold">{job.company.substring(0, 2)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start"><CardTitle className="text-lg font-bold leading-none truncate">{job.title}</CardTitle>{isAdmin && isEditMode && <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDeleteJob(job.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /><span className="truncate">{job.company}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /><span className="truncate">{job.location}</span></div>
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 flex-1"><p className="text-xs leading-relaxed text-muted-foreground line-clamp-4 italic">"{job.description}"</p></CardContent>
            <CardFooter className="p-5 pt-0 mt-auto"><Button className="w-full h-10 gap-2 font-bold" onClick={() => toast({ title: "Applied", description: "Interest sent." })}>Apply Now <ExternalLink className="h-3.5 w-3.5" /></Button></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}