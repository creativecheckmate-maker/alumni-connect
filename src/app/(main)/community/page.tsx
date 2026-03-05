'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Users, MapPin, Share2, Edit, Loader2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ADMIN_EMAIL } from '@/lib/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { SiteContent } from '@/lib/definitions';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';

function AdminEditDialog({ sectionId, initialData, label, overlay = false }: { sectionId: string, initialData: any, label: string, overlay?: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', `community_${sectionId}`), {
        id: `community_${sectionId}`,
        pageId: 'community',
        sectionId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Updated", description: `${label} saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className={`${overlay ? 'absolute top-2 right-2 z-50' : 'ml-2'} rounded-full shadow-lg`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
           {Object.keys(data).map((key) => {
            if (key === 'stats' && Array.isArray(data[key])) {
              return (
                <div key={key} className="space-y-4">
                  <label className="text-base font-bold block">Community Metrics</label>
                  {data[key].map((stat: any, index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded-xl">
                      <Input value={stat.label || ""} onChange={(e) => {
                        const newStats = [...data.stats];
                        newStats[index].label = e.target.value;
                        setData({ ...data, stats: newStats });
                      }} placeholder="Label" />
                      <Input value={stat.value || ""} onChange={(e) => {
                        const newStats = [...data.stats];
                        newStats[index].value = e.target.value;
                        setData({ ...data, stats: newStats });
                      }} placeholder="Value" />
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div key={key} className="space-y-2">
                <label className="capitalize font-bold text-sm text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</label>
                {key.toLowerCase().includes('description') ? (
                  <Textarea 
                    value={data[key]} 
                    onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {key.toLowerCase().includes('url') && data[key] && (
                      <div className="relative h-24 w-full rounded-xl overflow-hidden border bg-muted">
                        <Image src={data[key]} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input 
                        value={data[key]} 
                        onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                      />
                      {key.toLowerCase().includes('url') && (
                        <CldUploadWidget 
                          uploadPreset="ml_default"
                          options={{ 
                            cloudName: "dnex9nw0f",
                            cropping: true,
                            showSkipCropButton: true,
                            singleUploadAutoClose: true,
                            multiple: false,
                            sources: ['local', 'url', 'camera']
                          }}
                          onSuccess={(res: any) => {
                            const url = res?.info?.secure_url || res?.info?.url;
                            if (url) {
                              setData((prev: any) => ({ ...prev, [key]: url }));
                            }
                          }}
                        >
                          {({ open }) => (
                            <Button variant="outline" size="icon" onClick={() => open()}>
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </CldUploadWidget>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
           })}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CommunityHubPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const contentDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'community_hero'), [firestore]);
  const { data: hubContent } = useDoc<SiteContent>(contentDocRef);

  const statsDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'community_stats'), [firestore]);
  const { data: statsContent } = useDoc<SiteContent>(statsDocRef);

  const volunteerDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'community_volunteer'), [firestore]);
  const { data: volunteerContent } = useDoc<SiteContent>(volunteerDocRef);

  const defaultDescription = "Our strength lies in our diversity. Connect with local chapters and engage with alumni across the globe.";
  const description = hubContent?.data?.description || defaultDescription;

  const currentStats = statsContent?.data?.stats || [
    { label: 'Global Alumni', value: '25,000+', icon: 'Users' },
    { label: 'Countries', value: '120+', icon: 'Globe' },
    { label: 'Regional Chapters', value: '45', icon: 'MapPin' },
  ];

  const defaultVolunteer = {
    title: 'Volunteer with Us',
    description: 'Help us grow the network by becoming a chapter lead or organizing local meetups in your city.',
    buttonText: 'Get Involved',
    buttonUrl: '/about'
  };

  const volunteer = volunteerContent?.data || defaultVolunteer;

  const chapters = [
    { city: 'San Francisco', members: '1,200', region: 'North America' },
    { city: 'London', members: '850', region: 'Europe' },
    { city: 'Bangalore', members: '2,100', region: 'Asia Pacific' },
    { city: 'Dubai', members: '450', region: 'Middle East' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4 relative">
        <PageHeader title="Community Hub">
          {isAdmin && isEditMode && <AdminEditDialog sectionId="hero" initialData={{ description }} label="Hero Intro" />}
        </PageHeader>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {isAdmin && isEditMode && <AdminEditDialog sectionId="stats" initialData={{ stats: currentStats }} label="Stats Area" overlay />}
        {currentStats.map((stat: any, index: number) => (
          <Card key={index} className="text-center border-none shadow-sm bg-muted/20">
            <CardContent className="pt-8 pb-6 space-y-2">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {stat.icon === 'Users' && <Users className="h-5 w-5" />}
                  {stat.icon === 'Globe' && <Globe className="h-5 w-5" />}
                  {stat.icon === 'MapPin' && <MapPin className="h-5 w-5" />}
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

      <Card className="border-none shadow-xl bg-muted/30 relative">
        {isAdmin && isEditMode && <AdminEditDialog sectionId="volunteer" initialData={volunteer} label="Volunteer Section" overlay />}
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-bold font-headline">{volunteer.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {volunteer.description}
            </p>
            <Link href={volunteer.buttonUrl || "/about"}>
              <Button className="font-bold px-8">{volunteer.buttonText || "Get Involved"}</Button>
            </Link>
          </div>
          <div className="h-40 w-40 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
             <Globe className="h-20 w-20 text-primary animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
