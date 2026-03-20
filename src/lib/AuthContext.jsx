import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { writeLog, LOG_TYPES } from '../lib/logger';

const AuthContext = createContext(null);


async function purgeOldLogs() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const q = query(
      collection(db, 'appLogs'),
      where('timestamp', '<', Timestamp.fromDate(cutoff))
    );
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  } catch (e) {
    console.error('Log purge error:', e);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'dark');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [username, setUsername] = useState(null);
  const [userTheme, setUserTheme] = useState('dark');
  const [userDocId, setUserDocId] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (u) {
        const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', u.uid)));
        const data = snap.docs[0]?.data();
        const uname = data?.username || u.email;
        const theme = data?.theme || 'dark';
        setUsername(uname);
        setUserTheme(theme);
        setUserDocId(snap.docs[0]?.id || null);
        applyTheme(theme);
      } else {
        setUsername(null);
        setUserTheme('dark');
        setUserDocId(null);
        applyTheme('dark');
      }
      setUser(u || null);
    });
  }, []);

  async function login(usernameInput, password) {
    const snap = await getDocs(query(collection(db, 'users'), where('username', '==', usernameInput.trim().toLowerCase())));
    if (snap.empty) {
      await writeLog({ type: LOG_TYPES.LOGIN_FAILED, username: usernameInput, userId: 'unknown', details: 'Username not found' });
      throw { code: 'auth/user-not-found' };
    }
    const userData = snap.docs[0].data();
    try {
      const result = await signInWithEmailAndPassword(auth, userData.email, password);
      await writeLog({ type: LOG_TYPES.LOGIN_SUCCESS, username: usernameInput, userId: result.user.uid, details: 'Logged in successfully' });
      purgeOldLogs();
      return result;
    } catch (err) {
      await writeLog({ type: LOG_TYPES.LOGIN_FAILED, username: usernameInput, userId: 'unknown', details: err.code || 'Wrong password' });
      throw err;
    }
  }

  async function logout() {
    if (user && username) {
      await writeLog({ type: LOG_TYPES.LOGOUT, username, userId: user.uid, details: 'User logged out' });
    }
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, username, userTheme, userDocId, login, logout, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
