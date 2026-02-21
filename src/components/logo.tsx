import React from 'react';
import { School } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-foreground">
         <School className="h-6 w-6 text-foreground" />
      </div>
      <div className="flex flex-col -space-y-2">
        <span className="font-headline text-xl font-bold text-foreground tracking-wider">ALUMNI</span>
        <span className="font-serif text-sm text-muted-foreground">UNIVERSITY</span>
      </div>
    </div>
  );
}
