import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAivVJgddyGfBl6oR5rzJMFcq1jI8EXx7Y',
  authDomain: 'entry-system-96bb0.firebaseapp.com',
  projectId: 'entry-system-96bb0',
  storageBucket: 'entry-system-96bb0.firebasestorage.app',
  messagingSenderId: '860917572501',
  appId: '1:860917572501:web:025495f588861b5eebcc9c',
  measurementId: 'G-8E2QTLFC1L',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
