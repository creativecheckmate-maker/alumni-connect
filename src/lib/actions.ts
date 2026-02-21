'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase App
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);


export async function login(prevState: any, formData: FormData) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const validatedFields = schema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
      return { message: 'Invalid email or password.' };
  }
  
  const { email, password } = validatedFields.data;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    redirect('/dashboard');
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        return { message: 'Invalid email or password.' };
    }
    console.error('Login error:', error);
    return { message: 'An unknown error occurred. Please try again.' };
  }
}

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  university: z.string().min(2, { message: 'University is required.' }),
  college: z.string().min(2, { message: 'College is required.' }),
  role: z.enum(['student', 'professor']),
  major: z.string().optional(),
  graduationYear: z.coerce.number().optional(),
  department: z.string().optional(),
  researchInterests: z.string().optional(),
});

export async function signup(prevState: any, formData: FormData) {
    const validatedFields = signupSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return { message: 'Invalid form data. Please check all fields.' };
    }
    
    const { name, email, password, role, ...profileData } = validatedFields.data;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        const userProfileForDb = {
            id: user.uid,
            externalAuthId: user.uid,
            name: name,
            email: user.email,
            role: role,
            university: profileData.university,
            college: profileData.college,
            isVisibleInDirectory: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            major: role === 'student' ? profileData.major : null,
            graduationYear: role === 'student' ? profileData.graduationYear : null,
            department: role === 'professor' ? profileData.department : null,
            researchInterests: role === 'professor' ? (profileData.researchInterests?.split(',').map(i => i.trim()) || []) : [],
            avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
        };
        
        await setDoc(doc(firestore, 'users', user.uid), userProfileForDb);
        
        return { success: true, message: 'Signup successful! Please log in.' };

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { message: 'This email is already in use.' };
        }
        console.error("Signup error:", error);
        return { message: 'An error occurred during sign up. Please try again.' };
    }
}
