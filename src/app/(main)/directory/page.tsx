import { PageHeader } from '@/components/page-header';
import { users } from '@/lib/placeholder-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { User } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const UserCard = ({ user }: { user: User }) => {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.map((n) => n[0]).join('');
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold">{user.name}</h3>
          {user.role === 'student' ? (
            <>
              <p className="text-sm text-muted-foreground">{user.major}</p>
              <p className="text-xs text-muted-foreground">Class of {user.graduationYear}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{user.department}</p>
              <p className="text-xs text-muted-foreground">{user.researchInterests}</p>
            </>
          )}
          <div className="pt-2">
            <Link href={`/users/${user.id}`} passHref>
              <Button size="sm" variant="outline">View Profile</Button>
            </Link>
          </div>
        </div>
        <Badge variant={user.role === 'student' ? 'secondary' : 'outline'} className="capitalize">{user.role}</Badge>
      </CardContent>
    </Card>
  );
};

export default function DirectoryPage() {
  const students = users.filter(u => u.role === 'student');
  const professors = users.filter(u => u.role === 'professor');

  return (
    <>
      <PageHeader title="Alumni Directory">
        <Input placeholder="Search alumni..." className="w-64" />
      </PageHeader>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="professors">Professors</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="students" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="professors" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professors.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
