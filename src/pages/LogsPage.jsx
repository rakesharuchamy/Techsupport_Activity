import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getAppLogs } from '../lib/db';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, Search, AlertTriangle, Info, AlertCircle, Trash2 } from 'lucide-react';


const SEVERITY_STYLE = {
  info:    { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  color: 'var(--success)', icon: Info },
  warning: { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  color: 'var(--warning)', icon: AlertTriangle },
  error:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', color: 'var(--danger)',  icon: AlertCircle },
};

const LOG_LABELS = {
  login_success: 'Login success', login_failed: 'Login failed', logout: 'Logout',
  activity_created: 'Activity logged', activity_deleted: 'Activity deleted', activity_updated: 'Activity updated',
  setting_created: 'Setting added', setting_updated: 'Setting updated', setting_deleted: 'Setting deleted',
  user_created: 'User created', user_deleted: 'User deleted',
  request_submitted: 'Request submitted', request_approved: 'Request approved', request_rejected: 'Request rejected',
  error: 'Error',
};

export default function LogsPage() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const isAdmin = username === 'admin';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadLogs();
  }, [isAdmin]);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await getAppLogs(500);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function formatTime(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  const filtered = logs.filter(log => {
    const matchSearch = search === '' ||
      log.username?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      LOG_LABELS[log.type]?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchType = filterType === 'all' || log.type === filterType;
    return matchSearch && matchSeverity && matchType;
  });

  const counts = {
    info:    logs.filter(l => l.severity === 'info').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    error:   logs.filter(l => l.severity === 'error').length,
  };

  if (!isAdmin) return null;

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>App Logs</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>
              Full audit trail — last 7 days only — auto-purged daily
            </p>
          </div>
          <button className="btn btn-ghost" onClick={loadLogs} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* 7-day notice */}
        <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)', fontSize: 13, color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trash2 size={13} />
          Logs are automatically deleted after 7 days to keep your database clean.

        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {['info', 'warning', 'error'].map(sev => {
          const s = SEVERITY_STYLE[sev];
          const Icon = s.icon;
          return (
            <div key={sev} onClick={() => setFilterSeverity(filterSeverity === sev ? 'all' : sev)}
              style={{ padding: '16px 20px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, cursor: 'pointer', transition: 'opacity 0.15s', opacity: filterSeverity !== 'all' && filterSeverity !== sev ? 0.4 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon size={15} style={{ color: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.color }}>{sev}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{counts[sev]}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search by user, action, details..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ width: 130 }}>
          <option value="all">All severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 170 }}>
          <option value="all">All actions</option>
          <option value="login_success">Login success</option>
          <option value="login_failed">Login failed</option>
          <option value="logout">Logout</option>
          <option value="activity_created">Activity logged</option>
          <option value="activity_deleted">Activity deleted</option>
          <option value="activity_updated">Activity updated</option>
          <option value="setting_created">Setting added</option>
          <option value="setting_deleted">Setting deleted</option>
          <option value="user_created">User created</option>
          <option value="user_deleted">User deleted</option>
          <option value="request_approved">Request approved</option>
          <option value="request_rejected">Request rejected</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Logs table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Log entries</span>
          <span className="badge badge-neutral">{filtered.length} entries</span>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ height: 48, borderRadius: 8, background: 'var(--surface2)', marginBottom: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Shield size={36} style={{ color: 'var(--text3)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text2)', fontWeight: 500 }}>No logs found</p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Logs will appear here as users interact with the app</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Timestamp</th>
                  <th style={{ width: 100 }}>User</th>
                  <th style={{ width: 140 }}>Action</th>
                  <th>Details</th>
                  <th style={{ width: 90 }}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const s = SEVERITY_STYLE[log.severity] || SEVERITY_STYLE.info;
                  const Icon = s.icon;
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{formatTime(log.timestamp)}</td>
                      <td><span className="badge badge-neutral" style={{ fontSize: 11, fontWeight: 600 }}>{log.username || '—'}</span></td>
                      <td><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{LOG_LABELS[log.type] || log.type}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          <Icon size={10} />{log.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
        Showing latest 500 entries from the last 7 days
      </p>
    </div>
  );
}
