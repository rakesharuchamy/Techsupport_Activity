import { useState, useEffect } from 'react';
import {
  getActivityTypes, createActivityType, updateActivityType, deleteActivityType,
  getEnvironments, createEnvironment, updateEnvironment, deleteEnvironment,
  getAllAppUsers, saveUserToFirestore, deleteUserFromFirestore
} from '../lib/db';
import { useAuth } from '../lib/AuthContext';
import { apiKey } from '../lib/firebase';
import { Plus, Pencil, Trash2, Activity, Server, Users, Eye, EyeOff, Shield } from 'lucide-react';

// ── Reusable EditableRow ────────────────────────────────────
function EditableRow({ name, onSave, onDelete, isSaving, isDeleting }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  function handleSave() {
    if (!value.trim()) return;
    onSave(value.trim());
    setEditing(false);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
      {editing ? (
        <>
          <input className="input" value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus style={{ flex: 1, height: 32 }} />
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>Save</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setValue(name); setEditing(false); }}>Cancel</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{name}</span>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditing(true)}><Pencil size={13} /></button>
          <button className="btn btn-icon btn-danger btn-sm" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
          </button>
        </>
      )}
    </div>
  );
}

function AddRow({ placeholder, onAdd, isAdding }) {
  const [value, setValue] = useState('');
  function handleAdd() {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input className="input" value={value} onChange={e => setValue(e.target.value)}
        placeholder={placeholder} onKeyDown={e => e.key === 'Enter' && handleAdd()} style={{ flex: 1 }} />
      <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={isAdding || !value.trim()}>
        {isAdding ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <><Plus size={13} /> Add</>}
      </button>
    </div>
  );
}

// ── User Management Panel ───────────────────────────────────
function UserManagement({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadUsers() {
    setLoading(true);
    const list = await getAllAppUsers();
    setUsers(list);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleAddUser() {
    if (!newUsername.trim()) return showToast('Please enter a username', 'error');
    if (newPassword.length < 6) return showToast('Password must be at least 6 characters', 'error');

    setAdding(true);
    try {
      // Check if username already exists
      const existing = users.find(u => u.username === newUsername.trim().toLowerCase());
      if (existing) {
        showToast('Username already exists!', 'error');
        setAdding(false);
        return;
      }

      // Create user via Firebase Auth REST API
      const email = `${newUsername.trim().toLowerCase()}@myteam.app`;
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: newPassword, returnSecureToken: true })
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      // Save to Firestore
      await saveUserToFirestore(data.localId, newUsername.trim().toLowerCase(), email);
      showToast(`User "${newUsername}" created successfully! ✅`);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    }
    setAdding(false);
  }

  async function handleDeleteUser(user) {
    if (!confirm(`Delete user "${user.username}"? They will no longer be able to login.`)) return;
    setDeletingId(user.docId);
    try {
      await deleteUserFromFirestore(user.docId);
      showToast(`User "${user.username}" deleted`);
      loadUsers();
    } catch {
      showToast('Failed to delete user', 'error');
    }
    setDeletingId(null);
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Users size={15} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Manage Team Members</span>
        <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>{users.length} users</span>
      </div>

      {/* Add new user form */}
      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Add New User
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <label className="label">Username</label>
            <input className="input" placeholder="e.g. john"
              value={newUsername} onChange={e => setNewUsername(e.target.value)}
              autoCapitalize="none" spellCheck={false} />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ paddingRight: 36 }} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAddUser} disabled={adding}
            style={{ height: 38 }}>
            {adding ? <div className="spinner" /> : <><Plus size={14} /> Add User</>}
          </button>
        </div>
      </div>

      {/* Users list */}
      {loading ? (
        <div style={{ height: 60, borderRadius: 8, background: 'var(--surface2)' }} />
      ) : users.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No users yet</p>
      ) : (
        <div>
          {users.map(user => (
            <div key={user.docId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{user.username}</p>
                {user.username === 'admin' && (
                  <span style={{ fontSize: 11, color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>
              {user.username !== 'admin' && (
                <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleDeleteUser(user)}
                  disabled={deletingId === user.docId}>
                  {deletingId === user.docId ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Settings Page ──────────────────────────────────────
export default function SettingsPage() {
  const { username } = useAuth();
  const isAdmin = username === 'admin';

  const [activityTypes, setActivityTypes] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingEnv, setSavingEnv] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState(null);
  const [deletingEnv, setDeletingEnv] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    setLoading(true);
    const [types, envs] = await Promise.all([getActivityTypes(), getEnvironments()]);
    setActivityTypes(types); setEnvironments(envs);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateActivity(name) {
    setSavingActivity(true);
    try { const item = await createActivityType(name); setActivityTypes(p => [...p, item]); showToast('Activity type created'); }
    catch { showToast('Failed to create', 'error'); }
    setSavingActivity(false);
  }
  async function handleUpdateActivity(id, name) {
    try { await updateActivityType(id, name); setActivityTypes(p => p.map(a => a.id === id ? { ...a, name } : a)); showToast('Updated'); }
    catch { showToast('Failed to update', 'error'); }
  }
  async function handleDeleteActivity(id) {
    setDeletingActivity(id);
    try { await deleteActivityType(id); setActivityTypes(p => p.filter(a => a.id !== id)); showToast('Deleted'); }
    catch { showToast('Failed to delete', 'error'); }
    setDeletingActivity(null);
  }
  async function handleCreateEnv(name) {
    setSavingEnv(true);
    try { const item = await createEnvironment(name); setEnvironments(p => [...p, item]); showToast('Environment created'); }
    catch { showToast('Failed to create', 'error'); }
    setSavingEnv(false);
  }
  async function handleUpdateEnv(id, name) {
    try { await updateEnvironment(id, name); setEnvironments(p => p.map(e => e.id === id ? { ...e, name } : e)); showToast('Updated'); }
    catch { showToast('Failed to update', 'error'); }
  }
  async function handleDeleteEnv(id) {
    setDeletingEnv(id);
    try { await deleteEnvironment(id); setEnvironments(p => p.filter(e => e.id !== id)); showToast('Deleted'); }
    catch { showToast('Failed to delete', 'error'); }
    setDeletingEnv(null);
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: toast.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
          color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          animation: 'fadeIn 0.2s ease'
        }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Settings</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Manage activity types, environments and team members</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Activity Types */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
              <Activity size={15} style={{ color: 'var(--accent)' }} /> Activity Types
            </div>
            <span className="badge badge-neutral">{activityTypes.length}</span>
          </div>
          {loading ? <div style={{ height: 100, borderRadius: 8, background: 'var(--surface2)' }} /> : (
            <>
              {activityTypes.length === 0
                ? <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No activity types yet</p>
                : activityTypes.map(at => (
                  <EditableRow key={at.id} name={at.name}
                    onSave={name => handleUpdateActivity(at.id, name)}
                    onDelete={() => handleDeleteActivity(at.id)}
                    isSaving={savingActivity} isDeleting={deletingActivity === at.id} />
                ))
              }
              <AddRow placeholder="New activity type..." onAdd={handleCreateActivity} isAdding={savingActivity} />
            </>
          )}
        </div>

        {/* Environments */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
              <Server size={15} style={{ color: 'var(--accent)' }} /> Environments
            </div>
            <span className="badge badge-neutral">{environments.length}</span>
          </div>
          {loading ? <div style={{ height: 100, borderRadius: 8, background: 'var(--surface2)' }} /> : (
            <>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {environments.length === 0
                  ? <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No environments yet</p>
                  : environments.map(env => (
                    <EditableRow key={env.id} name={env.name}
                      onSave={name => handleUpdateEnv(env.id, name)}
                      onDelete={() => handleDeleteEnv(env.id)}
                      isSaving={savingEnv} isDeleting={deletingEnv === env.id} />
                  ))
                }
              </div>
              <AddRow placeholder="New environment..." onAdd={handleCreateEnv} isAdding={savingEnv} />
            </>
          )}
        </div>
      </div>

      {/* User Management — Admin only */}
      {isAdmin && <UserManagement showToast={showToast} />}

      {!isAdmin && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--warning)' }}>Only the admin can manage team members.</p>
        </div>
      )}
    </div>
  );
}
