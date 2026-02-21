import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

const getPlaceholderImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) {
      // Fallback to a default image if not found
      return { imageUrl: "https://picsum.photos/seed/placeholder/1920/1080", description: 'Placeholder', imageHint: 'placeholder' };
    }
    return img;
}

export default function HomePage() {
  const heroImage = getPlaceholderImage('hero-home');
  const manuscriptImage = getPlaceholderImage('article-manuscripts');
  const researchImage = getPlaceholderImage('article-research');
  const professorImage = getPlaceholderImage('professor-portrait');

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-blue-dark/90 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between text-primary-foreground">
            <Link href="/" className="flex items-center gap-2 text-white">
              <Logo className="[&_div]:border-white [&_svg]:text-white [&_span]:text-white" />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="link" className="text-white font-semibold" asChild><Link href="/">Home</Link></Button>
              <Button variant="link" className="text-white/80 hover:text-white" asChild><Link href="#">About Us</Link></Button>
              <Button variant="link" className="text-white/80 hover:text-white" asChild><Link href="#">News</Link></Button>
              <Button variant="link" className="text-white/80 hover:text-white" asChild><Link href="#">Community</Link></Button>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Login</Button>
              </Link>
              <Link href="/login">
                <Button variant="default">Join Today</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] w-full">
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            priority
          />
          <div className="absolute inset-0 bg-brand-blue/80" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-serif text-4xl font-bold md:text-6xl">
              The future is in your hands
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/90">
              Donec efficitur erat eget mi molestie lobortis mi nec pharetra etiam tincidunt ac nulla sit amet tincidunt nulla lacinia consequat interdum.
            </p>
            <div className="mt-8 flex gap-4">
               <Link href="/login">
                <Button size="lg" variant="default">Join Today</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-brand-blue">Login Now</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* Articles */}
            <div className="md:col-span-2 grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                    <Image src={manuscriptImage.imageUrl} alt={manuscriptImage.description} width={600} height={400} className="w-full rounded-lg object-cover aspect-[3/2]" data-ai-hint={manuscriptImage.imageHint} />
                    <h3 className="font-serif text-2xl font-semibold">A day trip to the University's Manuscripts and Special Collections</h3>
                    <p className="text-muted-foreground">Aliquam varius semper odio, mollis dictum metus. Praesent ut nibh eget dui bibendum porttitor. Duis nec eros vitae arcu porta vestibulum.</p>
                    <Button variant="link" className="text-primary p-0 h-auto">Read More &raquo;</Button>
                </div>
                 <div className="space-y-4">
                    <Image src={researchImage.imageUrl} alt={researchImage.description} width={600} height={400} className="w-full rounded-lg object-cover aspect-[3/2]" data-ai-hint={researchImage.imageHint}/>
                    <h3 className="font-serif text-2xl font-semibold">Night thesis paper - Research papers</h3>
                    <p className="text-muted-foreground">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas, auris placerat eleifend leo.</p>
                    <Button variant="link" className="text-primary p-0 h-auto">Read More &raquo;</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-primary text-primary-foreground p-8 rounded-lg flex flex-col justify-center gap-8">
                <div className="text-center">
                    <p className="font-serif text-6xl font-bold">82%</p>
                    <p className="text-sm opacity-90">of Class of 2014 Bachelor's Recipients Were Employed</p>
                </div>
                <div className="text-center">
                    <p className="font-serif text-6xl font-bold">87%</p>
                    <p className="text-sm opacity-90">Graduates Hold a Position Related to Their Degree</p>
                </div>
                <div className="text-center">
                    <p className="font-serif text-6xl font-bold">4128</p>
                    <p className="text-sm opacity-90">Overall Student-athlete Gpa for Spring 2016</p>
                </div>
            </div>
          </div>
        </section>

        {/* Ranking Section */}
        <section className="bg-secondary py-12 md:py-20">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <h2 className="font-serif text-3xl md:text-4xl font-bold">We're Ranked Within the Top 5 University's for Teaching Excellence</h2>
                    <p className="mt-4 text-muted-foreground">Etiam rhoncus, massa sed suscipit dignissim, dolor libero lacinia nulla dimentum justo. Nulla vel malesuada turpis. Fusce nulla arcu, uismod neget dui vitae, imperdiet convallis metus.</p>
                </div>
                <div className="flex justify-center">
                    <Image src={professorImage.imageUrl} alt={professorImage.description} width={400} height={400} className="rounded-full object-cover aspect-square" data-ai-hint={professorImage.imageHint} />
                </div>
            </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="bg-brand-blue-dark text-white py-8">
          <div className="container mx-auto text-center text-sm text-white/70">
              <p>&copy; {new Date().getFullYear()} Alumni University. All Rights Reserved.</p>
          </div>
      </footer>
    </div>
  );
}
