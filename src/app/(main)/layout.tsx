import React from 'react';
import { NexusShell } from '@/components/layout/shell/nexus-shell';

/**
 * Proxy Layout for the (main) route group.
 * Delegating logic to NexusShell prevents duplicate manifest generation.
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NexusShell>
      {children}
    </NexusShell>
  );
}
