import type { User, Event, JobPost, FeedPost, Notification, NewsUpdate } from './definitions';
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
    authorName: 'Ramanjot Singh',
    authorAvatar: 'https://picsum.photos/seed/raman/200/200',
    authorRole: 'Senior Engineer at TechCorp',
    content: 'Just had an amazing networking session with some juniors from the 2024 batch. The talent at Nexus is truly inspiring! 🚀',
    imageUrl: 'https://picsum.photos/seed/f1/800/400',
    likes: 42,
    comments: 12,
    createdAt: '2h ago'
  },
  {
    id: 'f2',
    authorName: 'Samara Patel',
    authorAvatar: 'https://picsum.photos/seed/samara/200/200',
    authorRole: 'Product Lead @ Innovate',
    content: 'Our team is hiring for a UI/UX role! If any alumni or graduating students are looking for a challenge, hit me up. #NexusHiresNexus',
    imageUrl: 'https://picsum.photos/seed/f2/800/400',
    likes: 85,
    comments: 24,
    createdAt: '5h ago'
  },
  {
    id: 'f3',
    authorName: 'Abhay Singh',
    authorAvatar: 'https://picsum.photos/seed/abhay/200/200',
    authorRole: 'Founder, GreenSolutions',
    content: 'Happy to announce that GreenSolutions has just raised its Series A! Thankful for the Nexus incubator program for the early support.',
    imageUrl: 'https://picsum.photos/seed/startup/800/400',
    likes: 156,
    comments: 45,
    createdAt: '1d ago'
  }
];

export const notifications: Notification[] = [
  {
    id: 'nt1',
    type: 'event',
    message: 'New event posted by "Department of Engineering"',
    timestamp: '1hr',
    read: false
  },
  {
    id: 'nt2',
    type: 'connection',
    message: 'Ramanjot Singh requested to connect with you',
    timestamp: '4hr',
    read: false
  },
  {
    id: 'nt3',
    type: 'general',
    message: 'Your job posting for "Frontend Dev" was approved',
    timestamp: '1d',
    read: true
  }
];

export const users: User[] = [
  {
    id: 'u1',
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
  },
  {
    id: 'u2',
    name: 'Samara Patel',
    email: 'samara@example.com',
    avatarUrl: 'https://picsum.photos/seed/samara/200/200',
    university: 'Nexus University',
    college: 'College of Arts & Sciences',
    role: 'student',
    major: 'Product Design',
    graduationYear: 2022,
    branch: 'Design',
    batch: '2022',
    feedbackRating: 98,
  },
  {
    id: 'u3',
    name: 'Abhay Singh',
    email: 'abhay@example.com',
    avatarUrl: 'https://picsum.photos/seed/abhay/200/200',
    university: 'Nexus University',
    college: 'College of Business',
    role: 'student',
    major: 'Finance',
    graduationYear: 2021,
    branch: 'Business',
    batch: '2021',
    feedbackRating: 92,
  },
  {
    id: 'u4',
    name: 'Dr. Sarah Chen',
    email: 'sarah@example.com',
    avatarUrl: 'https://picsum.photos/seed/sarah/200/200',
    university: 'Nexus University',
    college: 'College of Engineering',
    role: 'professor',
    department: 'Computer Science',
    researchInterests: ['AI', 'Quantum Computing'],
    feedbackRating: 99,
  }
];

export const events: Event[] = [
  {
    id: 'evt1',
    name: 'Annual Homecoming 2024',
    date: 'August 12',
    description: 'Join us for the biggest reunion of the year! Live music, networking, and a gala dinner.',
    image: findImage('event-1'),
    tags: ['Reunion', 'Gala'],
    university: 'Nexus University',
  },
  {
    id: 'evt2',
    name: 'Tech Career Fair',
    date: 'September 5',
    description: 'Connect with top employers specifically looking for Nexus graduates.',
    image: findImage('event-3'),
    tags: ['Career', 'Networking'],
    university: 'Nexus University',
    college: 'College of Engineering'
  }
];

export const jobPosts: JobPost[] = [
  {
    id: 'job1',
    title: 'Senior Software Engineer',
    company: 'Nexus Tech Solutions',
    location: 'Remote',
    description: 'Looking for an experienced engineer to lead our cloud infrastructure team. Must have experience with distributed systems and high-scale applications.',
    industry: 'Technology',
    companyLogoUrl: 'https://picsum.photos/seed/nexuslogo/100/100',
  },
  {
    id: 'job2',
    title: 'Financial Analyst',
    company: 'Global Capital',
    location: 'New York, NY',
    description: 'Join our investment banking team. We are looking for highly motivated individuals with strong analytical skills and a passion for finance.',
    industry: 'Finance',
    companyLogoUrl: 'https://picsum.photos/seed/bank/100/100',
  },
  {
    id: 'job3',
    title: 'UI/UX Design Lead',
    company: 'Creative Labs',
    location: 'San Francisco, CA',
    description: 'We are looking for a design visionary to shape the future of our consumer products. You will lead a talented team of designers and researchers.',
    industry: 'Design',
    companyLogoUrl: 'https://picsum.photos/seed/design/100/100',
  }
];

export const mentors = users.filter(u => u.role === 'professor' || (u.role === 'student' && u.graduationYear && u.graduationYear < 2020));
