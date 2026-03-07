import HomeClient from './home-client';
import MainLayout from './(main)/layout';

/**
 * Root page serving the home component.
 * This file is now the ONLY entry point for the '/' route.
 * By using RootPage as a Server Component wrapper and moving 
 * Client logic to home-client.tsx, we resolve the Vercel 
 * manifest race condition (ENOENT: page_client-reference-manifest.js).
 */
export default function RootPage() {
  return (
    <MainLayout>
      <HomeClient />
    </MainLayout>
  );
}
