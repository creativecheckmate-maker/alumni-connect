import React from 'react';
import { GraduationCap } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-sm">
         <GraduationCap className="h-6 w-6" />
      </div>
      <div className="flex flex-col -space-y-1">
        <span className="font-headline text-lg font-bold tracking-tight">Alumni</span>
        <span className="font-headline text-lg font-bold tracking-tight text-primary -mt-1">Connect</span>
      </div>
    </div>
  );
}
