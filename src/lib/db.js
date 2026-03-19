import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ── Activity Types ──────────────────────────────────────────
export async function getActivityTypes() {
  const snap = await getDocs(collection(db, 'activityTypes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function createActivityType(name) {
  const ref = await addDoc(collection(db, 'activityTypes'), { name });
  return { id: ref.id, name };
}
export async function updateActivityType(id, name) {
  await updateDoc(doc(db, 'activityTypes', id), { name });
}
export async function deleteActivityType(id) {
  await deleteDoc(doc(db, 'activityTypes', id));
}

// ── Environments ────────────────────────────────────────────
export async function getEnvironments() {
  const snap = await getDocs(collection(db, 'environments'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function createEnvironment(name) {
  const ref = await addDoc(collection(db, 'environments'), { name });
  return { id: ref.id, name };
}
export async function updateEnvironment(id, name) {
  await updateDoc(doc(db, 'environments', id), { name });
}
export async function deleteEnvironment(id) {
  await deleteDoc(doc(db, 'environments', id));
}

// ── Work Logs ───────────────────────────────────────────────
export async function createWorkLog({ userId, userEmail, activityTypeId, environmentIds, notes, date }) {
  const ref = await addDoc(collection(db, 'workLogs'), {
    userId, userEmail, activityTypeId, environmentIds, notes: notes || '',
    date, timestamp: serverTimestamp()
  });
  return { id: ref.id };
}
export async function getMyWorkLogs(userId, startDate, endDate) {
  const q = query(
    collection(db, 'workLogs'),
    where('userId', '==', userId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getAllWorkLogs(startDate, endDate, activityTypeId = null) {
  let q = query(
    collection(db, 'workLogs'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  if (activityTypeId) {
    q = query(
      collection(db, 'workLogs'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      where('activityTypeId', '==', activityTypeId),
      orderBy('date', 'desc')
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function deleteWorkLog(id) {
  await deleteDoc(doc(db, 'workLogs', id));
}

// ── User Management ─────────────────────────────────────────
export async function getAllAppUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ docId: d.id, ...d.data() }));
}
export async function saveUserToFirestore(uid, username, email) {
  await addDoc(collection(db, 'users'), { uid, username, email });
}
export async function deleteUserFromFirestore(docId) {
  await deleteDoc(doc(db, 'users', docId));
}

// ── Requests ─────────────────────────────────────────────────
export async function submitRequest(userId, username, type, name) {
  await addDoc(collection(db, 'requests'), {
    userId, username, type, name,
    status: 'pending',
    createdAt: serverTimestamp()
  });
}

export async function getAllRequests() {
  const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function approveRequest(requestId, type, name) {
  // Add to actual collection
  if (type === 'activity') {
    await addDoc(collection(db, 'activityTypes'), { name });
  } else {
    await addDoc(collection(db, 'environments'), { name });
  }
  // Mark as approved
  await updateDoc(doc(db, 'requests', requestId), { status: 'approved' });
}

export async function rejectRequest(requestId) {
  await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
}
