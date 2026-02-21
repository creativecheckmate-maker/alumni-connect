import type { User, Event, JobPost, Mentor } from './definitions';
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => {
  const img = PlaceHolderImages.find(p => p.id === id);
  if (!img) throw new Error(`Image with id ${id} not found`);
  return img;
};

export const users: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatarUrl: findImage('profile-1').imageUrl,
    role: 'student',
    major: 'Computer Science',
    graduationYear: 2024,
    preferences: ['networking', 'career development', 'software engineering'],
    networkActivity: 'Attended a tech talk on AI and connected with 3 engineers.',
  },
  {
    id: '2',
    name: 'Dr. Bob Smith',
    email: 'bob@example.com',
    avatarUrl: findImage('profile-2').imageUrl,
    role: 'professor',
    department: 'Electrical Engineering',
    researchInterests: 'Signal Processing, Machine Learning',
    preferences: ['mentorship', 'research collaboration'],
    networkActivity: 'Posted a research paper on signal processing.',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    avatarUrl: findImage('profile-3').imageUrl,
    role: 'student',
    major: 'Business Administration',
    graduationYear: 2025,
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    avatarUrl: findImage('profile-4').imageUrl,
    role: 'student',
    major: 'Fine Arts',
    graduationYear: 2023,
  },
  {
    id: '5',
    name: 'Dr. Edward Nygma',
    email: 'edward@example.com',
    avatarUrl: findImage('profile-5').imageUrl,
    role: 'professor',
    department: 'Psychology',
    researchInterests: 'Cognitive Behavioral Therapy',
  },
  {
    id: '6',
    name: 'Fiona Glenanne',
    email: 'fiona@example.com',
    avatarUrl: findImage('profile-6').imageUrl,
    role: 'student',
    major: 'Mechanical Engineering',
    graduationYear: 2022,
  },
];

export const events: Event[] = [
  {
    id: 'evt1',
    name: 'Annual Alumni Gala',
    date: '2024-10-26T18:00:00Z',
    description: 'Join us for a night of celebration and networking with fellow alumni.',
    image: findImage('event-1'),
    tags: ['networking', 'social'],
  },
  {
    id: 'evt2',
    name: 'Tech Career Fair',
    date: '2024-11-15T10:00:00Z',
    description: 'Connect with top tech companies looking to hire our alumni.',
    image: findImage('event-3'),
    tags: ['career development', 'software engineering'],
  },
  {
    id: 'evt3',
    name: 'AI in Modern Research',
    date: '2024-12-05T14:00:00Z',
    description: 'A seminar by Dr. Eva Rostova on the impact of AI in various research fields.',
    image: findImage('event-2'),
    tags: ['research collaboration', 'AI'],
  },
];

export const jobPosts: JobPost[] = [
  {
    id: 'job1',
    title: 'Software Engineer',
    company: 'Innovate Inc.',
    location: 'Remote',
    description: 'Seeking a talented software engineer to join our dynamic team.',
    industry: 'Technology',
    companyLogoUrl: findImage('job-logo-1').imageUrl,
  },
  {
    id: 'job2',
    title: 'Financial Analyst',
    company: 'Capital Investments',
    location: 'New York, NY',
    description: 'Analyze financial data and provide strategic recommendations.',
    industry: 'Finance',
    companyLogoUrl: findImage('job-logo-2').imageUrl,
  },
  {
    id: 'job3',
    title: 'Product Manager',
    company: 'Innovate Inc.',
    location: 'San Francisco, CA',
    description: 'Lead the development of our new flagship product.',
    industry: 'Technology',
    companyLogoUrl: findImage('job-logo-1').imageUrl,
  },
];

export const mentors: Mentor[] = [
  {
    id: 'men1',
    name: 'John Doe',
    title: 'Senior Software Engineer at Google',
    avatarUrl: findImage('profile-5').imageUrl,
    expertise: 'Software Architecture, Cloud Computing',
    industry: 'Technology',
  },
  {
    id: 'men2',
    name: 'Jane Smith',
    title: 'Marketing Director at P&G',
    avatarUrl: findImage('profile-1').imageUrl,
    expertise: 'Brand Management, Digital Marketing',
    industry: 'Consumer Goods',
  },
  {
    id: 'men3',
    name: 'Dr. Bob Smith',
    title: 'Professor of Electrical Engineering',
    avatarUrl: findImage('profile-2').imageUrl,
    expertise: 'Signal Processing, Machine Learning',
    industry: 'Academia',
  },
];
