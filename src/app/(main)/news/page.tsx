'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight, Calendar } from 'lucide-react';
import Image from 'next/image';

export default function NewsPage() {
  const newsItems = [
    {
      id: 1,
      title: 'Nexus University Ranks Top 5 in Teaching Excellence',
      date: 'Oct 24, 2024',
      category: 'Achievement',
      description: 'The latest national rankings place Nexus University among the top institutions for student satisfaction and teaching quality.',
      imageUrl: 'https://picsum.photos/seed/news1/800/400',
    },
    {
      id: 2,
      title: 'New Research Center for AI Innovation Launches',
      date: 'Oct 20, 2024',
      category: 'Research',
      description: 'The university has opened a state-of-the-art facility dedicated to advancing artificial intelligence and ethical computing.',
      imageUrl: 'https://picsum.photos/seed/news2/800/400',
    },
    {
      id: 3,
      title: 'Alumni Mentorship Program Sees Record Participation',
      date: 'Oct 15, 2024',
      category: 'Community',
      description: 'Over 1,000 alumni have registered to mentor graduating students in the first month of the program launch.',
      imageUrl: 'https://picsum.photos/seed/news3/800/400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageHeader title="University News">
        <Newspaper className="h-6 w-6 text-primary" />
      </PageHeader>

      <div className="grid gap-8">
        {newsItems.map((news) => (
          <Card key={news.id} className="overflow-hidden border-none shadow-sm group">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 relative h-48 md:h-full overflow-hidden">
                <Image
                  src={news.imageUrl}
                  alt={news.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-500"
                />
              </div>
              <div className="md:col-span-3 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{news.category}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium uppercase tracking-wider">
                      <Calendar className="h-3 w-3" /> {news.date}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{news.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{news.description}</p>
                </div>
                <div className="mt-6">
                  <Button variant="link" className="p-0 h-auto font-bold text-primary gap-2">
                    Read Full Story <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}