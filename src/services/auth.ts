
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

// Note: These functions now correctly run on the client side.
// Server actions that call these have been removed. 
// Logic is handled in the respective page components.

export async function signUpWithEmailAndPasswordClient(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // The component is now responsible for calling addUserProfile
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

    // The logic to check if the user profile exists and create one if not
    // is now handled as a server action in the components.
    await addUserProfile({ email: user.email!, uid: user.uid, photoURL: user.photoURL });
    
    return user;
}


export async function logOut(): Promise<void> {
    await signOut(auth);
}
