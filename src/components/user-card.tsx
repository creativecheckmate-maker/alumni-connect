import type { User } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const getInitials = (name: string) => {
  const names = name.split(' ');
  return names.map((n) => n[0]).join('');
};

export const UserCard = ({ user }: { user: User }) => {
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
