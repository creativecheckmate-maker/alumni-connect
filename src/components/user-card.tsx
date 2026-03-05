'use client';

import type { User, Friendship } from '@/lib/definitions';
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
import { Edit, Trash2, GraduationCap, Building2, MapPin, MessageSquare, UserPlus, UserCheck, XCircle, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  return names.map((n) => n[0]).join('');
};

interface UserCardProps {
    user: User;
    isAdmin?: boolean;
    handleDeleteUser?: (userId: string) => void;
    friendships: Friendship[];
}

export const UserCard = ({ user, isAdmin, handleDeleteUser, friendships }: UserCardProps) => {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const friendship = friendships.find(f => f.uids.includes(user.id));
  const isMutual = friendship?.status === 'mutual';
  const isRequestedByMe = friendship && friendship.followedBy.includes(authUser?.uid || '') && !isMutual;
  const hasRequestedMe = friendship && !friendship.followedBy.includes(authUser?.uid || '') && !isMutual;

  const handleCancelRequest = async () => {
    if (!firestore || !authUser || !friendship) return;
    deleteDocumentNonBlocking(doc(firestore, 'friendships', friendship.id));
    toast({ title: "Request Cancelled", description: "Your connection request has been withdrawn." });
  };

  const handleFollowUser = async () => {
    if (!firestore || !authUser) {
      router.push('/login');
      return;
    }
    const friendshipId = [authUser.uid, user.id].sort().join('_');

    if (friendship) {
      if (friendship.followedBy.includes(authUser.uid)) return;
      
      const newFollowedBy = [...friendship.followedBy, authUser.uid];
      const isMutual = newFollowedBy.length === 2;
      
      updateDocumentNonBlocking(doc(firestore, 'friendships', friendship.id), {
        followedBy: newFollowedBy,
        status: isMutual ? 'mutual' : 'pending',
        updatedAt: serverTimestamp()
      });

      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: user.id,
        type: 'connection',
        message: `${authUser.displayName || 'An alumnus'} accepted your request and followed you back!`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: isMutual ? "Connected!" : "Followed Back", description: `You are now connected with ${user.name}.` });
    } else {
      const data = {
        id: friendshipId,
        uids: [authUser.uid, user.id],
        followedBy: [authUser.uid],
        status: 'pending',
        updatedAt: serverTimestamp()
      };
      setDocumentNonBlocking(doc(firestore, 'friendships', friendshipId), data, { merge: true });
      
      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: user.id,
        type: 'connection',
        message: `${authUser.displayName || 'An alumnus'} sent you a connection request.`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Request Sent", description: `Connection request sent to ${user.name}.` });
    }
  };

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
            {user.role !== 'student' && user.feedbackRating && (
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
          <Link href={`/users/${user.id}`} className="shrink-0">
            <Button size="sm" variant="outline" className="font-bold h-9">Profile</Button>
          </Link>
          
          <div className="flex-1 flex gap-2">
            {isMutual ? (
              <>
                <Link href={`/messages/chat/${user.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full font-bold h-9 gap-2">
                    <MessageSquare className="h-4 w-4" /> Message
                  </Button>
                </Link>
                <Link href={`/messages/chat/${user.id}?autoCall=true`} className="flex-1">
                  <Button size="sm" variant="default" className="w-full font-bold h-9 gap-2">
                    <Phone className="h-4 w-4" /> Call
                  </Button>
                </Link>
              </>
            ) : isRequestedByMe ? (
              <Button size="sm" variant="destructive" className="w-full font-bold h-9 gap-2" onClick={handleCancelRequest}>
                <XCircle className="h-4 w-4" /> Cancel
              </Button>
            ) : (
              <Button size="sm" variant="default" className="w-full font-bold h-9 gap-2" onClick={handleFollowUser}>
                {hasRequestedMe ? <><UserCheck className="h-4 w-4" /> Follow Back</> : <><UserPlus className="h-4 w-4" /> Connect</>}
              </Button>
            )}
          </div>

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
                              Are you sure you want to remove <strong>{user.name}</strong> from the network?
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive">
                              Confirm
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
