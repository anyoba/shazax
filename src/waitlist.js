import { db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { submitFormspreeContact } from "./formspree";

export async function addEmail(email) {
  try {
    // Save to Firebase
    await addDoc(collection(db, "waitlist"), {
      email,
      createdAt: serverTimestamp()
    });

    // Also send to Formspree
    await submitFormspreeContact(email, "Waitlist Signup", `New waitlist signup: ${email}`);

    return { success: true };
  } catch (error) {
    console.error('Error adding email:', error);
    throw error;
  }
}
