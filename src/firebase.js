import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDy1x3jrlYx6N_Bz90-8opb0RDXygXoi50',
  authDomain: 'test-29ae7.firebaseapp.com',
  projectId: 'test-29ae7',
  storageBucket: 'test-29ae7.firebasestorage.app',
  messagingSenderId: '590495711269',
  appId: '1:590495711269:web:5b53e70aa2f0061e47ffcc',
  measurementId: 'G-0276C2Q576',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export default app;
