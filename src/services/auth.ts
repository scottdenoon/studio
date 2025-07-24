
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
import { addUserProfile, UserProfile } from './firestore';

interface AuthResult {
    user: User;
    userProfile: UserProfile;
}

export async function signUpWithEmailAndPasswordClient(email: string, password: string): Promise<AuthResult> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userProfile = await addUserProfile({ email: user.email!, uid: user.uid });

    return { user, userProfile };
}

export async function signInWithEmailAndPasswordClient(email: string, password: string): Promise<AuthResult> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userProfile = await addUserProfile({ email: user.email!, uid: user.uid });
    return { user, userProfile };
}

export async function signInWithGoogle(): Promise<AuthResult> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userProfile = await addUserProfile({ email: user.email!, uid: user.uid, photoURL: user.photoURL });
    
    return { user, userProfile };
}


export async function logOut(): Promise<void> {
    await signOut(auth);
}
