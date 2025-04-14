import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: 'AIzaSyAHy-cgCw8z-YkDkR5NL436LUfQdZ0I3aQ',
  authDomain: 'todolistluqman.firebaseapp.com',
  projectId: 'todolistluqman',
  storageBucket: 'todolistluqman.firebasestorage.app',
  messagingSenderId: '699068273411',
  appId: '1:699068273411:web:7c166258e4f3d10ab40f36',
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };