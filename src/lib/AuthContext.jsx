import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (u) {
        // fetch username for display
        const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', u.uid)));
        setUsername(snap.docs[0]?.data()?.username || u.email);
      } else {
        setUsername(null);
      }
      setUser(u || null);
    });
  }, []);

  async function login(username, password) {
    // Look up the email mapped to this username
    const snap = await getDocs(query(collection(db, 'users'), where('username', '==', username.trim().toLowerCase())));
    if (snap.empty) throw { code: 'auth/user-not-found' };
    const email = snap.docs[0].data().email;
    return signInWithEmailAndPassword(auth, email, password);
  }

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, username, login, logout, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
