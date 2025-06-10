declare module "firebase/app";
declare module "firebase/analytics";
declare module "firebase/auth";
declare module "firebase/database";
declare module "firebase/functions";
declare module "firebase/storage";

// types/firebase.d.ts
{
  /*declare module 'firebase/app' {
  import { FirebaseApp } from 'firebase/app';
  
  // Explicitly declare the modular exports
  export function initializeApp(options: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    databaseURL?: string;
  }, name?: string): FirebaseApp;
  
  export function getApp(name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function deleteApp(app: FirebaseApp): Promise<void>;
}

declare module 'firebase/auth' {
  import { User } from 'firebase/auth';
  
  // Core auth exports
  export function getAuth(app?: FirebaseApp): Auth;
  export function signInWithEmailAndPassword(
    auth: Auth, 
    email: string, 
    password: string
  ): Promise<UserCredential>;
  // Add other auth methods you use...
  
  // Interfaces
  export interface Auth {
    // Auth properties and methods
  }
  export interface UserCredential {
    user: User;
  }
  export interface User {
    uid: string;
    email: string | null;
    // Add other User properties you need
  }
}*/
}
