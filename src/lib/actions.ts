'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { signupSchema } from '@/lib/schemas';

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

export async function signup(prevState: any, formData: FormData) {
    const validatedFields = signupSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(fieldErrors)[0]?.[0];
        const errorMessage = firstError || 'Invalid form data. Please check all fields.';
        console.error('Signup validation failed:', fieldErrors);
        return { message: errorMessage };
    }
    
    const { name, email, password, role } = validatedFields.data;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        let userProfileForDb: any;

        if (validatedFields.data.role === 'student') {
            const { university, college, major, graduationYear } = validatedFields.data;
            userProfileForDb = {
                id: user.uid,
                externalAuthId: user.uid,
                name: name,
                email: user.email,
                role: role,
                university,
                college,
                isVisibleInDirectory: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                major,
                graduationYear,
                department: null,
                researchInterests: [],
                avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
                preferences: [],
                networkActivity: '',
            };
        } else { // professor
            const { university, college, department, researchInterests } = validatedFields.data;
            userProfileForDb = {
                id: user.uid,
                externalAuthId: user.uid,
                name: name,
                email: user.email,
                role: role,
                university,
                college,
                isVisibleInDirectory: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                department,
                researchInterests: researchInterests?.split(',').map(i => i.trim()) || [],
                major: null,
                graduationYear: null,
                avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
                preferences: [],
                networkActivity: '',
            };
        }
        
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
