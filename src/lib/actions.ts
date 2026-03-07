
'use server';

import { z } from 'zod';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { signupSchema } from '@/lib/schemas';

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
