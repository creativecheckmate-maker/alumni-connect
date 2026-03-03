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
import { useCollection, useFirestore, useMemoFirebase, useUser, useFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { JobPosting, SiteContent } from '@/lib/definitions';
import { ADMIN_EMAIL } from '@/lib/config';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';

function AdminEditDialog({ sectionId, initialData, label }: { sectionId: string, initialData: any, label: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', `jobs_${sectionId}`), {
        id: `jobs_${sectionId}`,
        pageId: 'jobs',
        sectionId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Updated", description: `${label} saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(initialData).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key.replace(/([Z])/g, ' $1')}</Label>
              <div className="flex gap-2">
                <Textarea 
                  value={data[key]} 
                  onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                />
                {key.toLowerCase().includes('url') && (
                  <CldUploadWidget 
                    uploadPreset="ml_default"
                    options={{ cloudName: "dnex9nw0f" }}
                    onSuccess={(result: any) => setData({ ...data, [key]: result.info.secure_url })}
                  >
                    {({ open }) => (
                      <Button variant="outline" size="icon" onClick={() => open()}>
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </CldUploadWidget>
                )}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function JobsPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const introDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'jobs_intro'), [firestore]);
  const { data: introContent } = useDoc<SiteContent>(introDocRef);

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobPostings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: jobs } = useCollection<JobPosting>(jobsQuery);

  const defaultIntro = {
    description: "Connect with exclusive career opportunities shared by our global alumni network and partner organizations."
  };
  const currentIntro = introContent?.data || defaultIntro;

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
      companyLogoUrl: logoUrl || `https://picsum.photos/seed/${Math.random()}/100/100`,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(firestore, 'jobPostings'), jobData);

    setLogoUrl(null);
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
          {isAdmin && isEditMode && <AdminEditDialog sectionId="intro" initialData={currentIntro} label="Page Intro" />}
          
          {authUser ? (
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
                  <div className="grid gap-2">
                    <Label>Company Logo</Label>
                    <div className="flex gap-2">
                      <Input value={logoUrl || ""} placeholder="Logo will be set after upload" readOnly />
                      <CldUploadWidget 
                        uploadPreset="ml_default"
                        options={{ cloudName: "dnex9nw0f", cropping: true, multiple: false }}
                        onSuccess={(result: any) => setLogoUrl(result.info.secure_url)}
                      >
                        {({ open }) => (
                          <Button type="button" variant="outline" onClick={() => open()}>
                            <Upload className="h-4 w-4 mr-2" /> Upload
                          </Button>
                        )}
                      </CldUploadWidget>
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full">Submit Job</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Link href="/login">
              <Button className="gap-2 shadow-lg shadow-primary/20" variant="outline">
                <Plus className="h-4 w-4" /> Post a Job
              </Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
        {currentIntro.description}
      </p>
      
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
                            {isAdmin && isEditMode && (
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