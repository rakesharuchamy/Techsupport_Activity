import { useState, useEffect } from 'react';
import {
  getActivityTypes, createActivityType, updateActivityType, deleteActivityType,
  getEnvironments, createEnvironment, updateEnvironment, deleteEnvironment,
  getAllAppUsers, saveUserToFirestore, deleteUserFromFirestore, updateUserTheme,
  submitRequest, getAllRequests, approveRequest, rejectRequest
} from '../lib/db';
import { useAuth } from '../lib/AuthContext';
import { apiKey } from '../lib/firebase';
import { Plus, Pencil, Trash2, Activity, Server, Users, Eye, EyeOff, Shield, Lock, Send, Check, X, Clock } from 'lucide-react';

// ── Editable Row (admin only edit/delete) ───────────────────
function EditableRow({ name, onSave, onDelete, isSaving, isDeleting, isAdmin }) {
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
          {isAdmin && (
            <>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditing(true)}><Pencil size={13} /></button>
              <button className="btn btn-icon btn-danger btn-sm" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
              </button>
            </>
          )}
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

// ── Request Panel (for regular users) ──────────────────────
function RequestPanel({ showToast }) {
  const { user, username } = useAuth();
  const [type, setType] = useState('activity');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  async function loadMyRequests() {
    const all = await getAllRequests();
    setMyRequests(all.filter(r => r.userId === user.uid));
  }

  useEffect(() => { loadMyRequests(); }, []);

  async function handleSubmit() {
    if (!name.trim()) return showToast('Please enter a name', 'error');
    setSubmitting(true);
    try {
      await submitRequest(user.uid, username, type, name.trim());
      showToast('Request submitted! Admin will review it. ✅');
      setName('');
      loadMyRequests();
    } catch { showToast('Failed to submit request', 'error'); }
    setSubmitting(false);
  }

  const statusColor = s => s === 'approved' ? 'var(--success)' : s === 'rejected' ? 'var(--danger)' : 'var(--warning)';
  const statusBg = s => s === 'approved' ? 'rgba(52,211,153,0.1)' : s === 'rejected' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)';
  const statusIcon = s => s === 'approved' ? <Check size={11} /> : s === 'rejected' ? <X size={11} /> : <Clock size={11} />;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Send size={15} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Request New Item</span>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Submit a Request to Admin
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)} style={{ width: 140 }}>
              <option value="activity">Activity Type</option>
              <option value="environment">Environment</option>
            </select>
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="e.g. Network Issue"
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ height: 38 }}>
            {submitting ? <div className="spinner" /> : <><Send size={13} /> Request</>}
          </button>
        </div>
      </div>

      {/* My past requests */}
      {myRequests.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>My Requests</p>
          {myRequests.map(req => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8 }}>
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>{req.type === 'activity' ? 'Activity' : 'Environment'}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{req.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: statusBg(req.status), color: statusColor(req.status) }}>
                {statusIcon(req.status)} {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin Requests Panel ────────────────────────────────────
function AdminRequestsPanel({ showToast, onApproved }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  async function loadRequests() {
    setLoading(true);
    const all = await getAllRequests();
    setRequests(all);
    setLoading(false);
  }

  useEffect(() => { loadRequests(); }, []);

  async function handleApprove(req) {
    setProcessingId(req.id);
    try {
      await approveRequest(req.id, req.type, req.name);
      showToast(`"${req.name}" approved and added! ✅`);
      loadRequests();
      onApproved(); // refresh activity/env lists
    } catch { showToast('Failed to approve', 'error'); }
    setProcessingId(null);
  }

  async function handleReject(req) {
    setProcessingId(req.id);
    try {
      await rejectRequest(req.id);
      showToast(`"${req.name}" rejected`);
      loadRequests();
    } catch { showToast('Failed to reject', 'error'); }
    setProcessingId(null);
  }

  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  const statusColor = s => s === 'approved' ? 'var(--success)' : s === 'rejected' ? 'var(--danger)' : 'var(--warning)';
  const statusBg = s => s === 'approved' ? 'rgba(52,211,153,0.1)' : s === 'rejected' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)';
  const statusIcon = s => s === 'approved' ? <Check size={11} /> : s === 'rejected' ? <X size={11} /> : <Clock size={11} />;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Clock size={15} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Pending Requests</span>
        {pending.length > 0 && (
          <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '2px 8px', marginLeft: 4 }}>
            {pending.length} new
          </span>
        )}
      </div>

      {loading ? <div style={{ height: 60, borderRadius: 8, background: 'var(--surface2)' }} /> :
        pending.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No pending requests 🎉</p>
        ) : (
          pending.map(req => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)', marginBottom: 8 }}>
              <span className="badge badge-neutral" style={{ fontSize: 11, flexShrink: 0 }}>{req.type === 'activity' ? 'Activity' : 'Environment'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{req.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>Requested by <strong>{req.username}</strong></p>
              </div>
              <button className="btn btn-sm" onClick={() => handleApprove(req)} disabled={processingId === req.id}
                style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)', gap: 4 }}>
                {processingId === req.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <><Check size={13} /> Approve</>}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleReject(req)} disabled={processingId === req.id}>
                <X size={13} /> Reject
              </button>
            </div>
          ))
        )
      }

      {/* Reviewed requests */}
      {reviewed.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Previously Reviewed</p>
          {reviewed.slice(0, 5).map(req => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 6, opacity: 0.7 }}>
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>{req.type === 'activity' ? 'Activity' : 'Env'}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{req.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>by {req.username}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: statusBg(req.status), color: statusColor(req.status) }}>
                {statusIcon(req.status)} {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
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
      const existing = users.find(u => u.username === newUsername.trim().toLowerCase());
      if (existing) { showToast('Username already exists!', 'error'); setAdding(false); return; }
      const email = `${newUsername.trim().toLowerCase()}@myteam.app`;
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: newPassword, returnSecureToken: true }) }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      await saveUserToFirestore(data.localId, newUsername.trim().toLowerCase(), email);
      showToast(`User "${newUsername}" created successfully! ✅`);
      setNewUsername(''); setNewPassword('');
      loadUsers();
    } catch (err) { showToast(err.message || 'Failed to create user', 'error'); }
    setAdding(false);
  }

  async function handleDeleteUser(user) {
    if (!confirm(`Delete user "${user.username}"? They will no longer be able to login.`)) return;
    setDeletingId(user.docId);
    try { await deleteUserFromFirestore(user.docId); showToast(`User "${user.username}" deleted`); loadUsers(); }
    catch { showToast('Failed to delete user', 'error'); }
    setDeletingId(null);
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Users size={15} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Manage Team Members</span>
        <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>{users.length} users</span>
      </div>
      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Add New User</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <label className="label">Username</label>
            <input className="input" placeholder="e.g. john" value={newUsername}
              onChange={e => setNewUsername(e.target.value)} autoCapitalize="none" spellCheck={false} />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: 36 }} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAddUser} disabled={adding} style={{ height: 38 }}>
            {adding ? <div className="spinner" /> : <><Plus size={14} /> Add User</>}
          </button>
        </div>
      </div>
      {loading ? <div style={{ height: 60, borderRadius: 8, background: 'var(--surface2)' }} /> :
        users.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No users yet</p> :
        users.map(user => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Theme:</label>
              <select className="input" value={user.theme || 'dark'}
                onChange={async e => {
                  await updateUserTheme(user.docId, e.target.value);
                  showToast(`Theme updated for ${user.username}`);
                  loadUsers();
                }}
                style={{ width: 100, padding: '4px 8px', fontSize: 12 }}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
              </select>
            </div>
            {user.username !== 'admin' && (
              <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleDeleteUser(user)} disabled={deletingId === user.docId}>
                {deletingId === user.docId ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
              </button>
            )}
          </div>
        ))
      }
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
    setTimeout(() => setToast(null), 3500);
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
          animation: 'fadeIn 0.2s ease', boxShadow: 'var(--shadow)'
        }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Settings</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>
          {isAdmin ? 'Manage activity types, environments and team members' : 'View items and submit requests to admin'}
        </p>
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: 24, padding: '12px 16px', borderRadius: 10, background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Lock size={15} style={{ color: 'var(--accent2)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--accent2)' }}>You are in <strong>view-only mode</strong>. Use the request form below to suggest new items to the admin.</p>
        </div>
      )}

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
                  <EditableRow key={at.id} name={at.name} isAdmin={isAdmin}
                    onSave={name => handleUpdateActivity(at.id, name)}
                    onDelete={() => handleDeleteActivity(at.id)}
                    isSaving={savingActivity} isDeleting={deletingActivity === at.id} />
                ))
              }
              {isAdmin && <AddRow placeholder="New activity type..." onAdd={handleCreateActivity} isAdding={savingActivity} />}
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
                    <EditableRow key={env.id} name={env.name} isAdmin={isAdmin}
                      onSave={name => handleUpdateEnv(env.id, name)}
                      onDelete={() => handleDeleteEnv(env.id)}
                      isSaving={savingEnv} isDeleting={deletingEnv === env.id} />
                  ))
                }
              </div>
              {isAdmin && <AddRow placeholder="New environment..." onAdd={handleCreateEnv} isAdding={savingEnv} />}
            </>
          )}
        </div>
      </div>

      {/* Regular user: request panel */}
      {!isAdmin && <RequestPanel showToast={showToast} />}

      {/* Admin: pending requests + user management */}
      {isAdmin && (
        <>
          <AdminRequestsPanel showToast={showToast} onApproved={loadData} />
          <UserManagement showToast={showToast} />
        </>
      )}
    </div>
  );
}
