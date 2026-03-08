import HomeClient from './home-client';
import { NexusShell } from '@/components/layout/shell/nexus-shell';

/**
 * Root Page Entry Point.
 * Uses the independent NexusShell to avoid route-group manifest conflicts.
 */
export default function RootPage() {
  return (
    <NexusShell>
      <HomeClient />
    </NexusShell>
  );
}
