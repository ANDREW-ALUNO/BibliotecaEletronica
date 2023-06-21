// Import the functions you need from the SDKs you need
import firebase  from "firebase"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCA-Vhezt92o7xYrkccVX7Nj81g-X9lSgw",
  authDomain: "biblioteca-eletronica-4838e.firebaseapp.com",
  projectId: "biblioteca-eletronica-4838e",
  storageBucket: "biblioteca-eletronica-4838e.appspot.com",
  messagingSenderId: "716579519957",
  appId: "1:716579519957:web:efc45167cfd11559a6515c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export default firebase.firestore()