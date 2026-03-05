'use server';

import { z } from 'zod';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { signupSchema } from '@/lib/schemas';

export async function signup(prevState: any, formData: FormData) {
    // 1. FRESH INITIALIZATION: Initialize Firebase INSIDE the action to prevent stale sessions
    let firebaseApp;
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);

    // 2. SHIELD: Clear any existing server-side auth state
    try {
        await signOut(auth);
    } catch (e) {
        // Ignore signout errors
    }

    const validatedFields = signupSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(fieldErrors)[0]?.[0];
        const errorMessage = firstError || 'Invalid form data. Please check all fields.';
        return { message: errorMessage };
    }
    
    const { name, email, password, role } = validatedFields.data;

    try {
        // 3. ATTEMPT CREATION: If this fails with 'email-already-in-use', the record is definitively in the Firebase Auth database.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        // 4. CLEANUP: Purge any orphaned profiles from Firestore to ensure uniqueness
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        const deletePromises = querySnapshot.docs
            .filter(d => d.id !== user.uid)
            .map(d => deleteDoc(d.ref));
        
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
        }

        const initialRating = 75;

        let userProfileForDb: any = {
            id: user.uid,
            externalAuthId: user.uid,
            name: name,
            email: user.email,
            role: role,
            university: validatedFields.data.university,
            college: validatedFields.data.college,
            isVisibleInDirectory: true,
            isApproved: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active',
            feedbackRating: initialRating,
            feedbackCount: 1,
            totalFeedbackPoints: initialRating,
            avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
            preferences: [],
            networkActivity: '',
        };

        if (validatedFields.data.role === 'student') {
            userProfileForDb.major = validatedFields.data.major;
            userProfileForDb.graduationYear = validatedFields.data.graduationYear;
        } else if (validatedFields.data.role === 'professor') {
            userProfileForDb.department = validatedFields.data.department;
            userProfileForDb.researchInterests = validatedFields.data.researchInterests?.split(',').map(i => i.trim()).filter(Boolean) || [];
        } else if (validatedFields.data.role === 'non-teaching-staff') {
            userProfileForDb.department = validatedFields.data.department;
        }
        
        await setDoc(doc(firestore, 'users', user.uid), userProfileForDb);
        
        return { success: true, message: 'Account created successfully! Your profile is now live.' };

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { message: 'Signup Failed: This email is already registered in the Firebase Authentication system. If you recently deleted your credentials from the console, please wait 30 seconds for propagation or try logging in to restore your profile automatically.' };
        }
        return { message: error.message || 'A system error occurred during registration. Please check your connection and try again.' };
    }
}
