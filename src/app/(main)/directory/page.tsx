import { PageHeader } from '@/components/page-header';
import { users } from '@/lib/placeholder-data';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { User } from '@/lib/definitions';
import { UserCard } from '@/components/user-card';

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
