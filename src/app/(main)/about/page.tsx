'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Target, Users, Heart, Edit, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ADMIN_EMAIL } from '@/lib/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { SiteContent } from '@/lib/definitions';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
      await setDoc(doc(firestore, 'siteContent', `about_${sectionId}`), {
        id: `about_${sectionId}`,
        pageId: 'about',
        sectionId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Content Updated", description: `${label} has been saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save content." });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(data).map((key) => (
            <div key={key} className="space-y-2">
              <label className="capitalize font-bold text-sm text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</label>
              {key.toLowerCase().includes('description') || key.toLowerCase().includes('content') || key.toLowerCase().includes('mission') || key.toLowerCase().includes('vision') || key.toLowerCase().includes('community') || key.toLowerCase().includes('values') ? (
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
                          croppingDefaultSelection: 'transform',
                          croppingShowBackButton: true,
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
          ))}
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

export default function AboutPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const contentDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'about_main'), [firestore]);
  const { data: mainContent } = useDoc<SiteContent>(contentDocRef);

  const ctaDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'about_cta'), [firestore]);
  const { data: ctaContent } = useDoc<SiteContent>(ctaDocRef);

  const defaultContent = {
    intro: 'We are more than just a network; we are a family of global innovators and leaders committed to excellence.',
    mission: 'To foster a lifelong connection between the university and its alumni, providing a platform for professional growth and meaningful engagement.',
    vision: 'To be the most impactful alumni network globally, where every graduate is empowered to reach their full potential through community support.',
    community: 'A diverse and vibrant global network of professionals, researchers, and leaders across every industry imaginable.',
    values: 'Integrity, excellence, and a commitment to giving back to the next generation of students and fellow graduates.'
  };

  const defaultCta = {
    title: 'Join Our Journey',
    description: 'Whether you graduated recently or decades ago, your experience is invaluable. Join us in shaping the future of our alma mater.',
    buttonText: 'Get Started',
    buttonUrl: '/login'
  };

  const content = mainContent?.data || defaultContent;
  const cta = ctaContent?.data || defaultCta;

  const features = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: 'Our Mission',
      description: content.mission,
      key: 'mission'
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-primary" />,
      title: 'Our Vision',
      description: content.vision,
      key: 'vision'
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Our Community',
      description: content.community,
      key: 'community'
    },
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: 'Our Values',
      description: content.values,
      key: 'values'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4 relative">
        <PageHeader title="About Alumni Connect">
           {isAdmin && isEditMode && <AdminEditDialog sectionId="main" initialData={content} label="Main Content" />}
        </PageHeader>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {content.intro}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {features.map((feature, index) => (
          <Card key={index} className="border-none shadow-sm bg-muted/20 relative group">
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

      <Card className="border-none shadow-lg bg-primary text-primary-foreground relative">
        {isAdmin && isEditMode && <AdminEditDialog sectionId="cta" initialData={cta} label="CTA Section" overlay />}
        <CardContent className="p-10 text-center space-y-6">
          <h2 className="text-3xl font-bold font-headline">{cta.title}</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            {cta.description}
          </p>
          <Link href={cta.buttonUrl || "/login"}>
            <Button variant="secondary" size="lg" className="font-bold px-10 rounded-xl">
              {cta.buttonText || "Get Started"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
