import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { firestore } from "../firebase";

interface BasicUser {
  email: string;
  createdAt: Date;
}


export const createUserDocument = async (userId: string, email: string) => {
  try {
    await setDoc(doc(firestore, "users", userId), {
      email,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};