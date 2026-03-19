import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getActivityTypes, getEnvironments, createWorkLog, getMyWorkLogs, deleteWorkLog } from '../lib/db';
import { Plus, CalendarDays, Trash2, Server, FileText, Loader2 } from 'lucide-react';

function todayStr() { return new Date().toISOString().slice(0, 10); }

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

  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedEnvs, setSelectedEnvs] = useState(new Set());
  const [notes, setNotes] = useState('');

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    setLoading(true);
    const [types, envs, logs] = await Promise.all([
      getActivityTypes(),
      getEnvironments(),
      getMyWorkLogs(user.uid, today, today),
    ]);
    setActivityTypes(types);
    setEnvironments(envs);
    setTodayLogs(logs);
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
    setSubmitting(true);
    try {
      await createWorkLog({
        userId: user.uid, userEmail: user.email,
        activityTypeId: selectedActivity,
        environmentIds: Array.from(selectedEnvs),
        notes, date: today,
      });
      showToast('Activity logged!');
      setSelectedActivity(''); setSelectedEnvs(new Set()); setNotes(''); setShowForm(false);
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
              <div style={{ marginBottom: 16 }}>
                <label className="label">Activity Type</label>
                <select className="input" value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)}>
                  <option value="">Select activity...</option>
                  {activityTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                </select>
              </div>

              {selectedActivity && (
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Environments ({selectedEnvs.size} selected)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                    {environments.map(env => {
                      const checked = selectedEnvs.has(env.id);
                      return (
                        <div key={env.id} onClick={() => toggleEnv(env.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                            borderRadius: 8, border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                            background: checked ? 'var(--accent-glow)' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s', fontSize: 13
                          }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                            border: `2px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                            background: checked ? 'var(--accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {checked && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5 6.5 2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                          </div>
                          {env.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label className="label">Notes (optional)</label>
                <textarea className="input" rows={2} value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any notes..." style={{ resize: 'none' }} />
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
              {todayLogs.length > 0 && (
                <span className="badge badge-accent">{todayLogs.length}</span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                {[1,2].map(i => <div key={i} style={{ height: 80, borderRadius: 12, background: 'var(--surface)', animation: 'pulse 1.5s ease infinite' }} />)}
              </div>
            ) : todayLogs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <Server size={36} style={{ color: 'var(--text3)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text2)', fontWeight: 500 }}>No activities logged today</p>
                <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Click "Log Activity" to get started</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {todayLogs.map(entry => {
                  const actType = activityTypes.find(a => a.id === entry.activityTypeId);
                  const envNames = (entry.environmentIds || []).map(eid => environments.find(e => e.id === eid)?.name || eid);
                  const time = entry.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--';
                  return (
                    <div key={entry.id} className="card card-sm fade-in">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span className="badge badge-accent">{actType?.name || 'Unknown'}</span>
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Server size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {envNames.map(name => (
                                <span key={name} className="badge badge-neutral" style={{ fontSize: 11 }}>{name}</span>
                              ))}
                            </div>
                          </div>
                          {entry.notes && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <FileText size={12} style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 2 }} />
                              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{entry.notes}</p>
                            </div>
                          )}
                        </div>
                        <button className="btn btn-icon btn-danger" style={{ flexShrink: 0 }}
                          onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id}>
                          {deletingId === entry.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
