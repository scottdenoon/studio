"use server"

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

export async function getPrompts() {
    const promptsCol = collection(db, 'prompts');
    const promptSnapshot = await getDocs(promptsCol);
    const prompts: Record<string, string> = {};
    promptSnapshot.forEach(doc => {
        prompts[doc.id] = doc.data().content;
    });
    return prompts;
}

export async function getPrompt(id: string): Promise<string> {
    const docRef = doc(db, "prompts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().content;
    } else {
        throw new Error("No such document!");
    }
}

export async function savePrompt(id: string, content: string): Promise<void> {
    await setDoc(doc(db, "prompts", id), { content });
}
