'use client';

import { PageHeader } from '@/components/page-header';
import { jobPosts } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Search, Briefcase, Plus, MapPin, Building2, ExternalLink } from 'lucide-react';

export default function JobsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Job Posted Successfully",
      description: "Your job posting has been submitted and will be live after a quick review.",
    });
  };

  const filteredJobs = jobPosts.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  Help fellow alumni by sharing career opportunities at your organization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePostJob} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-xs font-bold uppercase text-muted-foreground">Job Title</Label>
                  <Input id="title" placeholder="e.g. Senior Product Designer" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company" className="text-xs font-bold uppercase text-muted-foreground">Company Name</Label>
                  <Input id="company" placeholder="e.g. Google, Nexus Tech" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-xs font-bold uppercase text-muted-foreground">Location</Label>
                  <Input id="location" placeholder="e.g. Remote / New York, NY" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase text-muted-foreground">Job Description</Label>
                  <Textarea id="description" placeholder="Key responsibilities and requirements..." className="min-h-[100px]" required />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">Submit for Approval</Button>
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
                      <Avatar className="h-14 w-14 rounded-xl border-2 border-muted bg-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <AvatarImage src={job.companyLogoUrl} alt={job.company} className="object-contain p-2" />
                          <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold uppercase">{job.company.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                          <CardTitle className="text-lg font-bold leading-none truncate group-hover:text-primary transition-colors">{job.title}</CardTitle>
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
                <div className="flex flex-wrap gap-2">
                    {job.industry && <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-none">{job.industry}</Badge>}
                    <Badge variant="outline" className="text-[10px]">Full-time</Badge>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-0 mt-auto">
                <Button 
                    className="w-full h-10 gap-2 font-bold shadow-md shadow-primary/10 group-hover:bg-primary group-hover:text-white transition-all" 
                    onClick={() => toast({ title: "Application Initialized", description: `We are opening the application portal for ${job.company}.` })}
                >
                  Apply Now <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
                <h3 className="text-lg font-bold">No jobs found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
