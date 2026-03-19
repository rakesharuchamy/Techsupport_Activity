import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getActivityTypes, getEnvironments, createWorkLog, getMyWorkLogs, deleteWorkLog } from '../lib/db';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, CalendarDays, Trash2, Server, FileText, Pencil, Eye, X, Clock, Check } from 'lucide-react';

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── View Modal ──────────────────────────────────────────────
function ViewModal({ entry, activityTypes, environments, onClose }) {
  const actType = activityTypes.find(a => a.id === entry.activityTypeId);
  const envNames = (entry.environmentIds || []).map(eid => environments.find(e => e.id === eid)?.name || eid);
  const time = entry.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
          <X size={18} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Activity Details</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 100, flexShrink: 0, paddingTop: 2 }}>Activity</span>
            <span className="badge badge-accent">{actType?.name || 'Unknown'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 100, flexShrink: 0, paddingTop: 2 }}>Time</span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{time}</span>
          </div>
          {entry.timeSpent && (
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 100, flexShrink: 0, paddingTop: 2 }}>Time Spent</span>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{entry.timeSpent}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 100, flexShrink: 0, paddingTop: 6 }}>Environments</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {envNames.map(name => <span key={name} className="badge badge-neutral">{name}</span>)}
            </div>
          </div>
          {entry.notes && (
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 100, flexShrink: 0, paddingTop: 2 }}>Notes</span>
              <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{entry.notes}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 100, flexShrink: 0, paddingTop: 2 }}>Date</span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{entry.date}</span>
          </div>
        </div>

        <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>Close</button>
      </div>
    </div>
  );
}

// ── Edit Modal ──────────────────────────────────────────────
function EditModal({ entry, activityTypes, environments, onSave, onClose }) {
  const [selectedActivity, setSelectedActivity] = useState(entry.activityTypeId || '');
  const [selectedEnvs, setSelectedEnvs] = useState(new Set(entry.environmentIds || []));
  const [notes, setNotes] = useState(entry.notes || '');
  const [timeSpent, setTimeSpent] = useState(entry.timeSpent || '');
  const [saving, setSaving] = useState(false);

  function toggleEnv(id) {
    setSelectedEnvs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!selectedActivity) return;
    if (selectedEnvs.size === 0) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'workLogs', entry.id), {
        activityTypeId: selectedActivity,
        environmentIds: Array.from(selectedEnvs),
        notes, timeSpent
      });
      onSave();
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 520, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
          <X size={18} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Edit Activity</h3>

        {/* Activity Type */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Activity Type</label>
          <select className="input" value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)}>
            <option value="">Select activity...</option>
            {activityTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
          </select>
        </div>

        {/* Time Spent */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Time Spent</label>
          <input className="input" list="timeOptions" value={timeSpent}
            onChange={e => setTimeSpent(e.target.value)}
            placeholder="e.g. 25 mins or 2.5 hrs" />
          <datalist id="timeOptions">
            <option value="5 mins" /><option value="10 mins" /><option value="15 mins" />
            <option value="20 mins" /><option value="25 mins" /><option value="30 mins" />
            <option value="45 mins" /><option value="1 hr" /><option value="1.5 hrs" />
            <option value="2 hrs" /><option value="3 hrs" /><option value="4 hrs" />
            <option value="5 hrs" /><option value="6 hrs" /><option value="7 hrs" />
            <option value="8 hrs" />
          </datalist>
        </div>

        {/* Environments */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Environments ({selectedEnvs.size} selected)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {environments.map(env => {
              const checked = selectedEnvs.has(env.id);
              return (
                <div key={env.id} onClick={() => toggleEnv(env.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 8, border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                  background: checked ? 'var(--accent-glow)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s', fontSize: 12
                }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked ? 'var(--accent)' : 'var(--border)'}`, background: checked ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {checked && <Check size={8} color="#fff" strokeWidth={3} />}
                  </div>
                  {env.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label className="label">Notes (optional)</label>
          <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Add any notes..." style={{ resize: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? <><div className="spinner" /> Saving...</> : <><Check size={14} /> Save Changes</>}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Work Log Card ───────────────────────────────────────────
function WorkLogCard({ entry, activityTypes, environments, onDelete, onEdit, onView, isDeleting }) {
  const actType = activityTypes.find(a => a.id === entry.activityTypeId);
  const envNames = (entry.environmentIds || []).map(eid => environments.find(e => e.id === eid)?.name || eid);
  const time = entry.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--';

  return (
    <div className="card card-sm fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-accent">{actType?.name || 'Unknown'}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{time}</span>
            {entry.timeSpent && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent2)', background: 'rgba(124,106,247,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                <Clock size={10} /> {entry.timeSpent}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Server size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {envNames.map(name => <span key={name} className="badge badge-neutral" style={{ fontSize: 11 }}>{name}</span>)}
            </div>
          </div>
          {entry.notes && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <FileText size={12} style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{entry.notes}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onView(entry)} title="View details">
            <Eye size={13} />
          </button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onEdit(entry)} title="Edit" style={{ color: 'var(--accent2)' }}>
            <Pencil size={13} />
          </button>
          <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(entry.id)} disabled={isDeleting} title="Delete">
            {isDeleting ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const today = todayStr();

  const [activityTypes, setActivityTypes] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewEntry, setViewEntry] = useState(null);
  const [editEntry, setEditEntry] = useState(null);

  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedEnvs, setSelectedEnvs] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState('');

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    setLoading(true);
    const [types, envs, logs] = await Promise.all([
      getActivityTypes(), getEnvironments(), getMyWorkLogs(user.uid, today, today)
    ]);
    setActivityTypes(types); setEnvironments(envs); setTodayLogs(logs);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function toggleEnv(id) {
    setSelectedEnvs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!selectedActivity) return showToast('Please select an activity type', 'error');
    if (selectedEnvs.size === 0) return showToast('Please select at least one environment', 'error');
    if (!timeSpent) return showToast('Please select time spent', 'error');
    setSubmitting(true);
    try {
      await createWorkLog({
        userId: user.uid, userEmail: user.email,
        activityTypeId: selectedActivity,
        environmentIds: Array.from(selectedEnvs),
        notes, timeSpent, date: today,
      });
      showToast('Activity logged! ✅');
      setSelectedActivity(''); setSelectedEnvs(new Set()); setNotes(''); setTimeSpent(''); setShowForm(false);
      loadData();
    } catch { showToast('Failed to log activity', 'error'); }
    setSubmitting(false);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try { await deleteWorkLog(id); showToast('Entry deleted'); loadData(); }
    catch { showToast('Failed to delete', 'error'); }
    setDeletingId(null);
  }

  const activitySummary = activityTypes.reduce((acc, at) => {
    acc[at.id] = todayLogs.filter(l => l.activityTypeId === at.id).length;
    return acc;
  }, {});

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: toast.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
          color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          boxShadow: 'var(--shadow)', animation: 'fadeIn 0.2s ease'
        }}>{toast.msg}</div>
      )}

      {/* View Modal */}
      {viewEntry && <ViewModal entry={viewEntry} activityTypes={activityTypes} environments={environments} onClose={() => setViewEntry(null)} />}

      {/* Edit Modal */}
      {editEntry && <EditModal entry={editEntry} activityTypes={activityTypes} environments={environments}
        onSave={() => { setEditEntry(null); showToast('Activity updated! ✅'); loadData(); }}
        onClose={() => setEditEntry(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Daily Activity Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: 'var(--text2)', fontSize: 13 }}>
            <CalendarDays size={14} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={16} /> Log Activity
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* Log Form */}
          {showForm && (
            <div className="card fade-in" style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Log Today's Work</h3>

              {/* Activity Type */}
              <div style={{ marginBottom: 16 }}>
                <label className="label">Activity Type</label>
                <select className="input" value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)}>
                  <option value="">Select activity...</option>
                  {activityTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                </select>
              </div>

              {/* Time Spent */}
              <div style={{ marginBottom: 16 }}>
                <label className="label">Time Spent</label>
                <input className="input" list="timeOptions2" value={timeSpent}
                  onChange={e => setTimeSpent(e.target.value)}
                  placeholder="e.g. 25 mins or 2.5 hrs" />
                <datalist id="timeOptions2">
                  <option value="5 mins" /><option value="10 mins" /><option value="15 mins" />
                  <option value="20 mins" /><option value="25 mins" /><option value="30 mins" />
                  <option value="45 mins" /><option value="1 hr" /><option value="1.5 hrs" />
                  <option value="2 hrs" /><option value="3 hrs" /><option value="4 hrs" />
                  <option value="5 hrs" /><option value="6 hrs" /><option value="7 hrs" />
                  <option value="8 hrs" />
                </datalist>
              </div>

              {/* Environments */}
              {selectedActivity && (
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Environments ({selectedEnvs.size} selected)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                    {environments.map(env => {
                      const checked = selectedEnvs.has(env.id);
                      return (
                        <div key={env.id} onClick={() => toggleEnv(env.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                          borderRadius: 8, border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                          background: checked ? 'var(--accent-glow)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.15s', fontSize: 12
                        }}>
                          <div style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked ? 'var(--accent)' : 'var(--border)'}`, background: checked ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {checked && <Check size={8} color="#fff" strokeWidth={3} />}
                          </div>
                          {env.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <label className="label">Remarks (optional)</label>
                <textarea className="input" rows={3} value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe what happened, what was done..." style={{ resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><div className="spinner" /> Saving...</> : 'Save Activity'}
                </button>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Today's logs */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Today's Work Log</h2>
              {todayLogs.length > 0 && <span className="badge badge-accent">{todayLogs.length}</span>}
            </div>

            {loading ? (
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                {[1,2].map(i => <div key={i} style={{ height: 80, borderRadius: 12, background: 'var(--surface)' }} />)}
              </div>
            ) : todayLogs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <Server size={36} style={{ color: 'var(--text3)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text2)', fontWeight: 500 }}>No activities logged today</p>
                <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Click "Log Activity" to get started</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {todayLogs.map(entry => (
                  <WorkLogCard key={entry.id} entry={entry}
                    activityTypes={activityTypes} environments={environments}
                    onDelete={handleDelete} onEdit={setEditEntry} onView={setViewEntry}
                    isDeleting={deletingId === entry.id} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="card" style={{ position: 'sticky', top: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Activity Summary: Today</h3>
          {activityTypes.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No activity types configured.</p>
          ) : (
            <>
              {activityTypes.map(at => (
                <div key={at.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{at.name}</span>
                  <span className={`badge ${activitySummary[at.id] > 0 ? 'badge-accent' : 'badge-neutral'}`}>
                    {activitySummary[at.id] || 0}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Total Entries</span>
                <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>{todayLogs.length}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
