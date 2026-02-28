'use client';

import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useUser } from '@/firebase';
import { UserNav } from '@/components/user-nav';
import { ArrowRight } from 'lucide-react';

const getPlaceholderImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) {
      return { imageUrl: "https://picsum.photos/seed/placeholder/1920/1080", description: 'Placeholder', imageHint: 'placeholder' };
    }
    return img;
}

export default function HomePage() {
  const { user } = useUser();
  const heroImage = getPlaceholderImage('hero-home');
  const manuscriptImage = getPlaceholderImage('article-manuscripts');
  const researchImage = getPlaceholderImage('article-research');
  const professorImage = getPlaceholderImage('professor-portrait');

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-blue-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between text-primary-foreground">
            <Link href="/" className="flex items-center gap-2 text-white">
              <Logo className="[&_div]:border-white [&_svg]:text-white [&_span]:text-white" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-white font-semibold text-sm">Home</Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors text-sm">About Us</Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors text-sm">News</Link>
              <Link href="#" className="text-white/80 hover:text-white transition-colors text-sm">Community</Link>
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="hidden sm:block">
                        <Button variant="outline" className="text-white border-white/20 bg-white/10 hover:bg-white/20">Go to Dashboard</Button>
                    </Link>
                    <UserNav />
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-white hover:bg-white/10">Login</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="default">Join Today</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[500px] w-full">
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            priority
          />
          <div className="absolute inset-0 bg-brand-blue/70" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-serif text-5xl font-bold md:text-7xl tracking-tight max-w-4xl">
              The future is in your hands
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-white/90 font-body">
              Join thousands of alumni who have shaped their careers and legacy through the Nexus University network.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link href="/dashboard">
                    <Button size="lg" className="h-14 px-8 text-lg">
                        Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
              ) : (
                <>
                    <Link href="/login">
                        <Button size="lg" variant="default" className="h-14 px-8 text-lg">Join Today</Button>
                    </Link>
                    <Link href="/login">
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white text-white hover:bg-white hover:text-brand-blue">Login Now</Button>
                    </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto grid grid-cols-1 gap-16 md:grid-cols-3">
            {/* Articles */}
            <div className="md:col-span-2 grid grid-cols-1 gap-12 sm:grid-cols-2">
                <div className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg mb-6">
                        <Image 
                            src={manuscriptImage.imageUrl} 
                            alt={manuscriptImage.description} 
                            width={600} 
                            height={400} 
                            className="w-full object-cover aspect-[3/2] transition-transform duration-500 group-hover:scale-105" 
                            data-ai-hint={manuscriptImage.imageHint} 
                        />
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">A day trip to the University's Manuscripts and Special Collections</h3>
                    <p className="text-muted-foreground leading-relaxed">Aliquam varius semper odio, mollis dictum metus. Praesent ut nibh eget dui bibendum porttitor. Duis nec eros vitae arcu porta vestibulum.</p>
                    <Button variant="link" className="text-primary p-0 h-auto mt-4 font-semibold">Read More &raquo;</Button>
                </div>
                 <div className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg mb-6">
                        <Image 
                            src={researchImage.imageUrl} 
                            alt={researchImage.description} 
                            width={600} 
                            height={400} 
                            className="w-full object-cover aspect-[3/2] transition-transform duration-500 group-hover:scale-105" 
                            data-ai-hint={researchImage.imageHint}
                        />
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Night thesis paper - Research papers</h3>
                    <p className="text-muted-foreground leading-relaxed">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas, auris placerat eleifend leo.</p>
                    <Button variant="link" className="text-primary p-0 h-auto mt-4 font-semibold">Read More &raquo;</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-brand-blue-dark text-white p-10 rounded-xl flex flex-col justify-center gap-12 shadow-xl border border-white/5">
                <div className="text-center">
                    <p className="font-headline text-6xl font-bold text-primary">82%</p>
                    <p className="mt-2 text-sm opacity-80 uppercase tracking-widest font-semibold">of 2023 Graduates Employed</p>
                </div>
                <div className="text-center">
                    <p className="font-headline text-6xl font-bold text-primary">87%</p>
                    <p className="mt-2 text-sm opacity-80 uppercase tracking-widest font-semibold">Hold a Position Related to Degree</p>
                </div>
                <div className="text-center">
                    <p className="font-headline text-6xl font-bold text-primary">4.0</p>
                    <p className="mt-2 text-sm opacity-80 uppercase tracking-widest font-semibold">Average Student-Athlete GPA</p>
                </div>
            </div>
          </div>
        </section>

        {/* Ranking Section */}
        <section className="bg-secondary/30 py-16 md:py-24 border-y">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="max-w-xl">
                    <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight">We're Ranked Within the Top 5 University's for Teaching Excellence</h2>
                    <p className="mt-6 text-lg text-muted-foreground leading-relaxed">Etiam rhoncus, massa sed suscipit dignissim, dolor libero lacinia nulla dimentum justo. Nulla vel malesuada turpis. Fusce nulla arcu, uismod neget dui vitae, imperdiet convallis metus.</p>
                    <Button size="lg" className="mt-8">Our Academic Excellence</Button>
                </div>
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                        <Image src={professorImage.imageUrl} alt={professorImage.description} width={450} height={450} className="rounded-full object-cover aspect-square border-8 border-white shadow-2xl relative z-10" data-ai-hint={professorImage.imageHint} />
                    </div>
                </div>
            </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="bg-brand-blue-dark text-white py-12 border-t border-white/10">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
              <Logo className="[&_div]:border-white [&_svg]:text-white [&_span]:text-white" />
              <div className="flex gap-8 text-sm text-white/60">
                <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="#" className="hover:text-white transition-colors">Accessibility</Link>
              </div>
              <p className="text-sm text-white/50">&copy; {new Date().getFullYear()} Alumni University. All Rights Reserved.</p>
          </div>
      </footer>
    </div>
  );
}
