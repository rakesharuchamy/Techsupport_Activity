import { useState, useEffect } from 'react';
import { getActivityTypes, getEnvironments, getAllWorkLogs } from '../lib/db';
import { Download, BarChart2, FileSpreadsheet } from 'lucide-react';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(todayStr());
  const [activityFilter, setActivityFilter] = useState('all');
  const [activityTypes, setActivityTypes] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [types, envs] = await Promise.all([getActivityTypes(), getEnvironments()]);
    setActivityTypes(types); setEnvironments(envs);
    const logsData = await getAllWorkLogs(startDate, endDate, activityFilter !== 'all' ? activityFilter : null);
    setLogs(logsData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [startDate, endDate, activityFilter]);

  const getEnvNames = entry => (entry.environmentIds || []).map(eid => environments.find(e => e.id === eid)?.name || eid).join(', ');
  const getActivityName = entry => activityTypes.find(a => a.id === entry.activityTypeId)?.name || 'Unknown';

  function downloadCSV() {
    const headers = ['Date', 'Member', 'Activity Type', 'Environments', 'Notes'];
    const rows = logs.map(e => [e.date, e.userEmail, getActivityName(e), `"${getEnvNames(e)}"`, `"${e.notes || ''}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `team-activity-${startDate}-to-${endDate}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const totalEntries = logs.length;
  const uniqueMembers = new Set(logs.map(l => l.userId)).size;
  const byActivity = activityTypes.reduce((acc, at) => {
    acc[at.id] = logs.filter(l => l.activityTypeId === at.id).length;
    return acc;
  }, {});

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Reports</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Generate and export activity reports for any date range</p>
      </div>

      {/* Filters + Export */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Activity Type</label>
            <select className="input" value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
              <option value="all">All activities</option>
              {activityTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={downloadCSV} disabled={logs.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card card-sm">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 6 }}>Total Entries</p>
          <p style={{ fontSize: 28, fontWeight: 800 }}>{totalEntries}</p>
        </div>
        <div className="card card-sm">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 6 }}>Team Members</p>
          <p style={{ fontSize: 28, fontWeight: 800 }}>{uniqueMembers}</p>
        </div>
        {activityTypes.slice(0, 2).map(at => (
          <div key={at.id} className="card card-sm">
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{at.name}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent2)' }}>{byActivity[at.id] || 0}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
            <FileSpreadsheet size={15} style={{ color: 'var(--accent)' }} /> Report Data
          </div>
          {!loading && <span className="badge badge-neutral">{logs.length} rows</span>}
        </div>
        {loading ? (
          <div style={{ padding: 24 }}>{[1,2,3].map(i => <div key={i} style={{ height: 40, borderRadius: 8, background: 'var(--surface2)', marginBottom: 8 }} />)}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <BarChart2 size={36} style={{ color: 'var(--text3)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text2)', fontWeight: 500 }}>No data for selected range</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr>
                <th>Date</th><th>Member</th><th>Activity</th><th>Environments</th><th>Notes</th>
              </tr></thead>
              <tbody>
                {logs.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ color: 'var(--text2)' }}>{entry.date}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{entry.userEmail}</td>
                    <td><span className="badge badge-accent">{getActivityName(entry)}</span></td>
                    <td style={{ color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEnvNames(entry)}</td>
                    <td style={{ color: 'var(--text3)' }}>{entry.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
