import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqBx5uWA2bSGtl3cL7zbO2kpG5cudOR7g",
  authDomain: "gen-lang-client-0892112671.firebaseapp.com",
  projectId: "gen-lang-client-0892112671",
  storageBucket: "gen-lang-client-0892112671.firebasestorage.app",
  messagingSenderId: "490463801962",
  appId: "1:490463801962:web:d38762304565d1e57a5013",
  measurementId: "G-CMD0EH8W3F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
