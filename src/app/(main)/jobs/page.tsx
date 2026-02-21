import { PageHeader } from '@/components/page-header';
import { jobPosts } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function JobsPage() {
  return (
    <>
      <PageHeader title="Job Board">
        <div className="flex gap-2">
          <Input placeholder="Search jobs..." className="w-64" />
          <Button variant="outline">Post a Job</Button>
        </div>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobPosts.map((job) => (
          <Card key={job.id}>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 rounded-sm">
                        <AvatarImage src={job.companyLogoUrl} alt={job.company} />
                        <AvatarFallback>{job.company.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>{job.company} - {job.location}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
              {job.industry && <Badge variant="secondary" className="mt-2">{job.industry}</Badge>}
            </CardContent>
            <CardFooter>
              <Button className="w-full">Apply Now</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
