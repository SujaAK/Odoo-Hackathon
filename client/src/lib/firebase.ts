import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCku9ICJrtDb-o2UQyNvpPYcuxLk6hEuJc",
  authDomain: "trasitops.firebaseapp.com",
  projectId: "trasitops",
  storageBucket: "trasitops.firebasestorage.app",
  messagingSenderId: "580023330609",
  appId: "1:580023330609:web:7074d33cad8e652598f210",
  measurementId: "G-MQD9XNVG1V"
};

// Initialize Firebase (guard against hot-reload re-init)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup };
