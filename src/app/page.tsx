import HomePage from './(main)/page';
import MainLayout from './(main)/layout';

/**
 * Root page serving the home component.
 * We remove "use client" here to make this a Server Component wrapper.
 * This resolves Vercel build conflicts where multiple client-side manifest 
 * references for the root path can cause ENOENT errors.
 */
export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
