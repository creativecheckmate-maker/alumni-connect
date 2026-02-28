
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
    title: 'College Conducted Successful Workshop on AI',
    description: 'Expert talks on Artificial Intelligence and Machine Learning gathered huge interest from students.',
    imageUrl: 'https://picsum.photos/seed/n1/600/400',
    category: 'Workshop'
  },
  {
    id: 'n2',
    title: 'Kaur Finishes Her CSE Journey',
    description: 'Meet the student who topped her batch with record-breaking project innovations.',
    imageUrl: 'https://picsum.photos/seed/n2/600/400',
    category: 'Achievement'
  }
];

export const feedPosts: FeedPost[] = [
  {
    id: 'f1',
    authorName: 'Ramanjot Singh',
    authorAvatar: 'https://picsum.photos/seed/p1/200/200',
    authorRole: 'Software Developer at Digital Labs',
    content: 'Insightful event held at Chandigarh Computer Club on Importance of Virtual Safety. Great networking opportunity!',
    imageUrl: 'https://picsum.photos/seed/f1/800/400',
    likes: 24,
    comments: 5,
    createdAt: '3d ago'
  },
  {
    id: 'f2',
    authorName: 'Abhay Singh',
    authorAvatar: 'https://picsum.photos/seed/p2/200/200',
    authorRole: 'UI/UX Designer at Innovate',
    content: 'Just finished my new case study on sustainable urban design. Looking forward to feedback from the community!',
    imageUrl: 'https://picsum.photos/seed/f2/800/400',
    likes: 12,
    comments: 2,
    createdAt: '1d ago'
  }
];

export const notifications: Notification[] = [
  {
    id: 'nt1',
    type: 'event',
    message: 'New event posted by "Department of CSE"',
    timestamp: '1hr',
    read: false
  },
  {
    id: 'nt2',
    type: 'connection',
    message: 'Samara Patel accepted your connect request',
    timestamp: '4hr',
    read: true
  },
  {
    id: 'nt3',
    type: 'general',
    message: 'Event Reminder for Webinar hosted by SBI',
    timestamp: '5hr',
    read: false
  }
];

export const users: User[] = [
  {
    id: '1',
    name: 'Ramanjot Singh',
    email: 'raman@example.com',
    avatarUrl: 'https://picsum.photos/seed/raman/200/200',
    university: 'Nexus University',
    college: 'BTech (ME) 2019',
    role: 'student',
    major: 'Mechanical Engineering',
    graduationYear: 2019,
    branch: 'ME',
    batch: '2019',
    feedbackRating: 95,
  },
  {
    id: '2',
    name: 'Samara Patel',
    email: 'samara@example.com',
    avatarUrl: 'https://picsum.photos/seed/samara/200/200',
    university: 'Nexus University',
    college: 'BTech (CSE) 2022',
    role: 'student',
    major: 'Computer Science',
    graduationYear: 2022,
    branch: 'CSE',
    batch: '2022',
    feedbackRating: 98,
  }
];

export const events: Event[] = [
  {
    id: 'evt1',
    name: 'Annual Convocation Ceremony',
    date: 'August 12',
    description: 'The 10th Annual Convocation will be held in the main auditorium.',
    image: findImage('event-1'),
    tags: ['Ceremony'],
    university: 'Nexus University',
  }
];

export const jobPosts: JobPost[] = [
  {
    id: 'job1',
    title: 'Swift Developer Intern',
    company: 'Apple Inc.',
    location: 'Remote',
    description: 'Looking for a passionate iOS developer.',
    companyLogoUrl: 'https://picsum.photos/seed/apple/100/100',
  },
  {
    id: 'job2',
    title: 'UI/UX Designer',
    company: 'Figma',
    location: 'New York',
    description: 'Passionate about design systems?',
    companyLogoUrl: 'https://picsum.photos/seed/figma/100/100',
  }
];
