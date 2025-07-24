

"use server";

import { auth, db } from '@/lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    type User
} from 'firebase/auth/web-extension';
import { addUser, getUser, NewUserProfile } from './firestore';
import { collection, getDocs } from 'firebase/firestore';

export async function signUpWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if this is the first user
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    // Subtract 1 because we just created a new user
    const isFirstUser = userSnapshot.size -1 === 0;
    
    // Create a corresponding user profile in Firestore
    const newUserProfile: NewUserProfile = {
        email: user.email!,
        role: isFirstUser ? 'admin' : 'basic', // Assign 'admin' role if first user
    };
    await addUser(user.uid, newUserProfile);

    return user;
}

export async function logInWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if the user already exists in Firestore
    const userProfile = await getUser(user.uid);
    if (!userProfile) {
        // If not, this is a new user, so create a profile
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        // Subtract 1 because we just created a new user
        const isFirstUser = userSnapshot.size - 1 === 0;

        const newUserProfile: NewUserProfile = {
            email: user.email!,
            role: isFirstUser ? 'admin' : 'basic',
        };
        await addUser(user.uid, newUserProfile);
    }
    
    return user;
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
