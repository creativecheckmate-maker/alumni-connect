'use server';

import { z } from 'zod';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { signupSchema } from '@/lib/schemas';

/**
 * Shared utility to get a fresh Firestore instance on the server.
 * This hides the logic from the client-side bundle.
 */
async function getAdminFirestore() {
    let firebaseApp;
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    return getFirestore(firebaseApp);
}

export async function signup(prevState: any, formData: FormData) {
    let firebaseApp;
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);

    try {
        await signOut(auth);
    } catch (e) {}

    const validatedFields = signupSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(fieldErrors)[0]?.[0];
        return { message: firstError || 'Invalid form data. Please check all fields.' };
    }
    
    const { name, email, password, role } = validatedFields.data;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

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
        }
        
        await setDoc(doc(firestore, 'users', user.uid), userProfileForDb);
        
        return { success: true, message: 'Account created successfully! Your profile is now live.' };

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { message: 'Signup Failed: This email is already registered. If you recently deleted credentials, please wait 30s for propagation or try logging in.' };
        }
        return { message: error.message || 'A system error occurred during registration.' };
    }
}

/**
 * SECURE SERVER ACTION: restoreProfile
 * Logic for re-provisioning profiles is hidden from the browser.
 */
export async function restoreProfile(uid: string, email: string, displayName: string, photoURL?: string) {
    const firestore = await getAdminFirestore();
    const userDocRef = doc(firestore, 'users', uid);
    const initialRating = 75;

    await setDoc(userDocRef, {
        id: uid,
        externalAuthId: uid,
        name: displayName || 'Restored User',
        email: email,
        role: 'student',
        university: 'Nexus University',
        college: 'Not Specified',
        isVisibleInDirectory: true,
        isApproved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        feedbackRating: initialRating,
        feedbackCount: 1,
        totalFeedbackPoints: initialRating,
        avatarUrl: photoURL || `https://picsum.photos/seed/${uid}/200/200`,
        preferences: [],
        networkActivity: '',
    });

    return { success: true };
}

/**
 * SECURE SERVER ACTION: submitFacultyFeedback
 * Math and database structure for feedback is hidden from the browser.
 */
export async function submitFacultyFeedback(facultyId: string, studentId: string, rating: number, comment: string) {
    const firestore = await getAdminFirestore();
    const facultyDocRef = doc(firestore, 'users', facultyId);
    
    const facultySnap = await getDoc(facultyDocRef);
    if (!facultySnap.exists()) throw new Error('Faculty not found');
    
    const data = facultySnap.data();
    const currentPoints = data.totalFeedbackPoints || data.feedbackRating || 0;
    const currentCount = data.feedbackCount || 1;

    const newTotalPoints = currentPoints + rating;
    const newCount = currentCount + 1;
    const newAverage = Math.round(newTotalPoints / newCount);

    await setDoc(facultyDocRef, {
        feedbackRating: newAverage,
        feedbackCount: newCount,
        totalFeedbackPoints: newTotalPoints,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    const feedbacksCol = collection(facultyDocRef, 'feedbacks');
    await addDoc(feedbacksCol, {
        studentId,
        facultyId,
        rating,
        comment,
        createdAt: serverTimestamp(),
    });

    return { success: true };
}