import type { User, Event, JobPosting, FeedPost, Notification, NewsUpdate } from './definitions';
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => {
  const img = PlaceHolderImages.find(p => p.id === id);
  if (!img) return { imageUrl: 'https://picsum.photos/seed/1/400/300', description: 'Placeholder', imageHint: 'placeholder' };
  return img;
};

export const news: NewsUpdate[] = [
  {
    id: 'n1',
    title: 'Nexus Engineering Summit 2024',
    description: 'Join industry leaders and fellow alumni for a weekend of innovation and networking at our annual summit.',
    imageUrl: 'https://picsum.photos/seed/summit/600/400',
    category: 'University Event'
  },
  {
    id: 'n2',
    title: 'Dr. Anita Rao Wins Global Research Award',
    description: 'Our faculty continues to break records! Dr. Rao has been recognized for her pioneering work in sustainable energy.',
    imageUrl: 'https://picsum.photos/seed/researcher/600/400',
    category: 'Achievement'
  },
  {
    id: 'n3',
    title: 'New Alumni Mentor Program Launches',
    description: 'Over 500 alumni have signed up to mentor current students in just the first week of launch.',
    imageUrl: 'https://picsum.photos/seed/mentor/600/400',
    category: 'Community'
  }
];

export const feedPosts: FeedPost[] = [
  {
    id: 'f1',
    authorId: 'u1',
    authorName: 'Ramanjot Singh',
    authorAvatarUrl: 'https://picsum.photos/seed/raman/200/200',
    content: 'Just had an amazing networking session with some juniors from the 2024 batch. The talent at Nexus is truly inspiring! 🚀',
    imageUrl: 'https://picsum.photos/seed/f1/800/400',
    likes: 42,
    createdAt: '2h ago'
  },
  {
    id: 'f2',
    authorId: 'u2',
    authorName: 'Samara Patel',
    authorAvatarUrl: 'https://picsum.photos/seed/samara/200/200',
    content: 'Our team is hiring for a UI/UX role! If any alumni or graduating students are looking for a challenge, hit me up. #NexusHiresNexus',
    imageUrl: 'https://picsum.photos/seed/f2/800/400',
    likes: 85,
    createdAt: '5h ago'
  }
];

export const notifications: Notification[] = [
  {
    id: 'nt1',
    userId: 'u1',
    type: 'event',
    message: 'New event posted by "Department of Engineering"',
    read: false,
    createdAt: '1hr'
  },
  {
    id: 'nt2',
    userId: 'u1',
    type: 'connection',
    message: 'Ramanjot Singh requested to connect with you',
    read: false,
    createdAt: '4hr'
  }
];

export const users: User[] = [
  {
    id: 'u1',
    externalAuthId: 'u1',
    name: 'Ramanjot Singh',
    email: 'raman@example.com',
    avatarUrl: 'https://picsum.photos/seed/raman/200/200',
    university: 'Nexus University',
    college: 'College of Engineering',
    role: 'student',
    major: 'Mechanical Engineering',
    graduationYear: 2019,
    branch: 'ME',
    batch: '2019',
    feedbackRating: 95,
    isVisibleInDirectory: true,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'u4',
    externalAuthId: 'u4',
    name: 'Dr. Sarah Chen',
    email: 'sarah@example.com',
    avatarUrl: 'https://picsum.photos/seed/sarah/200/200',
    university: 'Nexus University',
    college: 'College of Engineering',
    role: 'professor',
    department: 'Computer Science',
    researchInterests: ['AI', 'Quantum Computing'],
    feedbackRating: 99,
    isVisibleInDirectory: true,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const jobPosts: JobPosting[] = [
  {
    id: 'job1',
    title: 'Senior Software Engineer',
    company: 'Nexus Tech Solutions',
    location: 'Remote',
    description: 'Looking for an experienced engineer to lead our cloud infrastructure team.',
    industry: 'Technology',
    posterId: 'u1',
    companyLogoUrl: 'https://picsum.photos/seed/nexuslogo/100/100',
  }
];

export const mentors = users.filter(u => u.role === 'professor' || (u.role === 'student' && u.graduationYear && u.graduationYear < 2020));
