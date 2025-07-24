

"use server";

import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    type User
} from 'firebase/auth';
import { addUser } from './firestore';
import { collection, getDocs } from 'firebase/firestore';

export async function signUpWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if this is the first user
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const isFirstUser = userSnapshot.empty;
    
    // Create a corresponding user profile in Firestore
    await addUser({
        uid: user.uid,
        email: user.email!,
        role: isFirstUser ? 'admin' : 'basic', // Assign 'admin' role if first user
        createdAt: new Date(),
        lastSeen: new Date(),
    });

    return user;
}

export async function logInWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function logOut(): Promise<void> {
    await signOut(auth);
}

export async function listAllUsers() {
    // This is a placeholder for an admin-level function.
    // In a real app, you would use the Firebase Admin SDK on a secure server 
    // to fetch a list of all users. The client-side SDK cannot do this.
    console.warn("User listing is not available on the client-side SDK.");
    return [];
}
