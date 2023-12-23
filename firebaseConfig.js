import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, put } from 'firebase/storage';  
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
// HIDDEN
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const FIRESTORE_DB = getFirestore(app);

export { auth, storage, createUserWithEmailAndPassword, signInWithEmailAndPassword, FIRESTORE_DB, ref, put, app};