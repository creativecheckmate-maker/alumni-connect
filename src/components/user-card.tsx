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
import { Edit, Trash2, GraduationCap, Building2, MapPin, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group border-none shadow-sm">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/10 ring-offset-2 transition-transform group-hover:scale-105">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                    <h3 className="text-lg font-bold leading-none group-hover:text-primary transition-colors">{user.name}</h3>
                    <Badge variant={user.role === 'student' ? 'secondary' : 'outline'} className="capitalize text-[10px] h-4 font-bold tracking-tight">
                        {user.role === 'non-teaching-staff' ? 'Staff' : user.role}
                    </Badge>
                </div>
            </div>
            {user.feedbackRating && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <span>★</span> {user.feedbackRating}
                </div>
            )}
        </div>

        <div className="space-y-2 py-2">
          {user.role === 'student' ? (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{user.major}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>Class of {user.graduationYear} • {user.branch || 'N/A'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{user.department}</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{user.university}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <Link href={`/users/${user.id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full font-bold h-9">View Profile</Button>
          </Link>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-9 w-9 text-primary hover:bg-primary/5 shrink-0"
            onClick={() => toast({ title: "Connecting...", description: `Connection request sent to ${user.name.split(' ')[0]}.` })}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          {isAdmin && user.email !== ADMIN_EMAIL && (
            <div className="flex gap-1 ml-auto">
               <Link href={`/users/${user.id}`}>
                  <Button size="icon" variant="ghost" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
               </Link>
               {handleDeleteUser && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                              Are you sure you want to remove <strong>{user.name}</strong> from the network? This action cannot be undone.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                              Confirm Delete
                          </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
               )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
