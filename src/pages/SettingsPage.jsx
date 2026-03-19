import { useState, useEffect } from 'react';
import {
  getActivityTypes, createActivityType, updateActivityType, deleteActivityType,
  getEnvironments, createEnvironment, updateEnvironment, deleteEnvironment
} from '../lib/db';
import { Plus, Pencil, Trash2, Activity, Server, Loader2 } from 'lucide-react';

function EditableRow({ name, onSave, onDelete, isSaving, isDeleting }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  function handleSave() {
    if (!value.trim()) return;
    onSave(value.trim());
    setEditing(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, transition: 'background 0.1s' }}>
      {editing ? (
        <>
          <input className="input" value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus style={{ flex: 1, height: 32 }} />
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <div className="spinner" style={{ width: 12, height: 12 }} /> : 'Save'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setValue(name); setEditing(false); }}>Cancel</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{name}</span>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditing(true)} title="Edit">
            <Pencil size={13} />
          </button>
          <button className="btn btn-icon btn-danger btn-sm" onClick={onDelete} disabled={isDeleting} title="Delete">
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

export default function SettingsPage() {
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
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Manage activity types and environments</p>
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
    </div>
  );
}
