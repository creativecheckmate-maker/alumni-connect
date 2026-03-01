'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Target, Users, Heart } from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: 'Our Mission',
      description: 'To foster a lifelong connection between the university and its alumni, providing a platform for professional growth and meaningful engagement.',
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-primary" />,
      title: 'Our Vision',
      description: 'To be the most impactful alumni network globally, where every graduate is empowered to reach their full potential through community support.',
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Our Community',
      description: 'A diverse and vibrant global network of professionals, researchers, and leaders across every industry imaginable.',
    },
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: 'Our Values',
      description: 'Integrity, excellence, and a commitment to giving back to the next generation of students and fellow graduates.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <PageHeader title="About Alumni Connect" />
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We are more than just a network; we are a family of global innovators and leaders committed to excellence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-none shadow-sm bg-muted/20">
            <CardHeader>
              <div className="mb-4 inline-block p-3 rounded-2xl bg-background shadow-sm">
                {feature.icon}
              </div>
              <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg bg-primary text-primary-foreground">
        <CardContent className="p-10 text-center space-y-6">
          <h2 className="text-3xl font-bold font-headline">Join Our Journey</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Whether you graduated recently or decades ago, your experience is invaluable. Join us in shaping the future of our alma mater.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}