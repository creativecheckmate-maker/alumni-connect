'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the default chat view
    router.replace('/messages/chat');
  }, [router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-medium">Loading Conversations...</p>
      </div>
    </div>
  );
}
