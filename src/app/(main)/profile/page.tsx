import { PageHeader } from '@/components/page-header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { users } from '@/lib/placeholder-data';
import type { User } from '@/lib/definitions';

// In a real app, this would be the logged in user
const currentUser: User = users[0];

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Manage Profile" />
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your photo and personal details here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={currentUser.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={currentUser.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input id="university" defaultValue={currentUser.university} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="college">College</Label>
            <Input id="college" defaultValue={currentUser.college} />
          </div>

          {currentUser.role === 'student' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input id="major" defaultValue={currentUser.major} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input id="graduationYear" type="number" defaultValue={currentUser.graduationYear} />
              </div>
            </>
          )}

          {currentUser.role === 'professor' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" defaultValue={currentUser.department} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="researchInterests">Research Interests</Label>
                <Input id="researchInterests" defaultValue={currentUser.researchInterests} />
              </div>
            </>
          )}

            <div className="space-y-2">
                <Label htmlFor="preferences">Preferences</Label>
                <Input id="preferences" placeholder="e.g. networking, software engineering" defaultValue={currentUser.preferences?.join(', ')} />
                <p className="text-sm text-muted-foreground">Separate preferences with commas. Used for AI recommendations.</p>
            </div>


          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </>
  );
}
