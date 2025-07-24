
"use client"

import { auth } from '@/lib/firebase/client';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    type User
} from 'firebase/auth';
import { addUserProfile } from './firestore';

export async function signUpWithEmailAndPasswordClient(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // After creating the user in Auth, create their profile in Firestore.
    // This is a server action and is now called correctly.
    await addUserProfile({ email: user.email!, uid: user.uid });

    return user;
}

export async function signInWithEmailAndPasswordClient(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // After a Google sign-in, create or update their profile in Firestore.
    // This is a server action and is now called correctly.
    await addUserProfile({ email: user.email!, uid: user.uid, photoURL: user.photoURL });
    
    return user;
}


export async function logOut(): Promise<void> {
    await signOut(auth);
}
