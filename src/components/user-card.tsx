'use client';

import type { User } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ADMIN_EMAIL } from '@/lib/config';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  return names.map((n) => n[0]).join('');
};

interface UserCardProps {
    user: User;
    isAdmin?: boolean;
    handleDeleteUser?: (userId: string) => void;
}

export const UserCard = ({ user, isAdmin, handleDeleteUser }: UserCardProps) => {
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
              <p className="text-xs text-muted-foreground">{user.university}</p>
              <p className="text-xs text-muted-foreground">Class of {user.graduationYear}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{user.department}</p>
              <p className="text-xs text-muted-foreground">{user.university}</p>
            </>
          )}
          <div className="pt-2 flex gap-2">
            <Link href={`/users/${user.id}`}>
              <Button size="sm" variant="outline">View Profile</Button>
            </Link>
            {isAdmin && user.email !== ADMIN_EMAIL && (
              <>
                 <Link href={`/users/${user.id}`}>
                    <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                 </Link>
                 {handleDeleteUser && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {user.name}'s profile data.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
              </>
            )}
          </div>
        </div>
        <Badge variant={user.role === 'student' ? 'secondary' : 'outline'} className="capitalize">{user.role}</Badge>
      </CardContent>
    </Card>
  );
};
