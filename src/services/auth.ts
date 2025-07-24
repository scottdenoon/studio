
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
import { addUserProfile, NewUserProfile } from './firestore';

// Note: These functions now correctly run on the client side.
// Server actions that call these have been removed. 
// Logic is handled in the respective page components.

export async function signUpWithEmailAndPasswordClient(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // The check for the first user needs to be done on the server.
    // This logic is now handled within the signup page component as a server action.
    const newUserProfile: NewUserProfile = {
        email: user.email!,
        // Role assignment is handled server-side now.
    };
    await addUserProfile(user.uid, newUserProfile);

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
    
    return user;
}


export async function logOut(): Promise<void> {
    await signOut(auth);
}
