import { users } from '@/lib/placeholder-data';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const students = users.filter(u => u.role === 'student');
  const professors = users.filter(u => u.role === 'professor');

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between z-50">
            <Link href="/" className="flex items-center gap-2">
                <Logo className="h-8" />
            </Link>
            <div className="flex gap-2">
                <Link href="/login">
                    <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/login">
                    <Button>Sign Up</Button>
                </Link>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
             <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight">Alumni Directory</h1>
                <Input placeholder="Search alumni..." className="w-64" />
            </div>
      
            <Tabs defaultValue="all">
                <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="professors">Professors</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                    ))}
                </div>
                </TabsContent>
                <TabsContent value="students" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {students.map((user) => (
                    <UserCard key={user.id} user={user} />
                    ))}
                </div>
                </TabsContent>
                <TabsContent value="professors" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {professors.map((user) => (
                    <UserCard key={user.id} user={user} />
                    ))}
                </div>
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
