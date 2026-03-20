import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Log types
export const LOG_TYPES = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  ACTIVITY_CREATED: 'activity_created',
  ACTIVITY_DELETED: 'activity_deleted',
  ACTIVITY_UPDATED: 'activity_updated',
  SETTING_CREATED: 'setting_created',
  SETTING_UPDATED: 'setting_updated',
  SETTING_DELETED: 'setting_deleted',
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  REQUEST_SUBMITTED: 'request_submitted',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected',
  ERROR: 'error',
};

// Severity levels
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

// Color and label for each log type
export const LOG_META = {
  login_success:      { label: 'Login',            severity: 'info' },
  login_failed:       { label: 'Failed login',      severity: 'warning' },
  logout:             { label: 'Logout',            severity: 'info' },
  activity_created:   { label: 'Activity logged',   severity: 'info' },
  activity_deleted:   { label: 'Activity deleted',  severity: 'warning' },
  activity_updated:   { label: 'Activity updated',  severity: 'info' },
  setting_created:    { label: 'Setting added',     severity: 'info' },
  setting_updated:    { label: 'Setting updated',   severity: 'info' },
  setting_deleted:    { label: 'Setting deleted',   severity: 'warning' },
  user_created:       { label: 'User created',      severity: 'info' },
  user_deleted:       { label: 'User deleted',      severity: 'warning' },
  request_submitted:  { label: 'Request sent',      severity: 'info' },
  request_approved:   { label: 'Request approved',  severity: 'info' },
  request_rejected:   { label: 'Request rejected',  severity: 'warning' },
  error:              { label: 'Error',             severity: 'error' },
};

export async function writeLog({ type, username, userId, details = '' }) {
  try {
    await addDoc(collection(db, 'appLogs'), {
      type,
      username: username || 'unknown',
      userId: userId || 'unknown',
      details,
      severity: LOG_META[type]?.severity || 'info',
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}
