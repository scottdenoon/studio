
"use server";

import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    type User
} from 'firebase/auth';
import { addUserProfile, getUser, NewUserProfile } from './firestore';
import { collection, getDocs } from 'firebase/firestore';

export async function signUpWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const isFirstUser = userSnapshot.empty; 
    
    const newUserProfile: NewUserProfile = {
        email: user.email!,
        role: isFirstUser ? 'admin' : 'basic',
    };
    await addUserProfile(user.uid, newUserProfile);

    return user;
}

export async function logInWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signInWithGoogle(): Promise<User> {
    'use client';
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userProfile = await getUser(user.uid);
    if (!userProfile) {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const isFirstUser = userSnapshot.empty;

        const newUserProfile: NewUserProfile = {
            email: user.email!,
            role: isFirstUser ? 'admin' : 'basic',
        };
        await addUserProfile(user.uid, newUserProfile);
    }
    
    return user;
}


export async function logOut(): Promise<void> {
    await signOut(auth);
}
