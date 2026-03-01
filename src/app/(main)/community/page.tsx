'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Users, MapPin, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CommunityHubPage() {
  const stats = [
    { label: 'Global Alumni', value: '25,000+', icon: <Users className="h-5 w-5" /> },
    { label: 'Countries', value: '120+', icon: <Globe className="h-5 w-5" /> },
    { label: 'Regional Chapters', value: '45', icon: <MapPin className="h-5 w-5" /> },
  ];

  const chapters = [
    { city: 'San Francisco', members: '1,200', region: 'North America' },
    { city: 'London', members: '850', region: 'Europe' },
    { city: 'Bangalore', members: '2,100', region: 'Asia Pacific' },
    { city: 'Dubai', members: '450', region: 'Middle East' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <PageHeader title="Community Hub" />
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
          Our strength lies in our diversity. Connect with local chapters and engage with alumni across the globe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center border-none shadow-sm bg-muted/20">
            <CardContent className="pt-8 pb-6 space-y-2">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {stat.icon}
                </div>
              </div>
              <h3 className="text-3xl font-bold font-headline">{stat.value}</h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-headline">Regional Chapters</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" /> Suggest a Chapter
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chapters.map((chapter, index) => (
            <Card key={index} className="group hover:border-primary/50 transition-colors shadow-sm cursor-pointer border-none bg-card">
              <CardHeader className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{chapter.city}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">{chapter.region}</p>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {chapter.members} members
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-xl bg-muted/30">
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-bold font-headline">Volunteer with Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              Help us grow the network by becoming a chapter lead or organizing local meetups in your city.
            </p>
            <Button className="font-bold px-8">Get Involved</Button>
          </div>
          <div className="h-40 w-40 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
             <Globe className="h-20 w-20 text-primary animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}