import { useState, useEffect } from 'react';
import { getActivityTypes, getEnvironments, getAllWorkLogs } from '../lib/db';
import { CalendarDays, Filter, Users } from 'lucide-react';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function sevenDaysAgo() { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }

export default function TeamLogsPage() {
  const [startDate, setStartDate] = useState(sevenDaysAgo());
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
  const shortEmail = email => email ? email.split('@')[0] : '—';

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Team Logs</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>View and filter activity logs across your entire team</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
          <Filter size={14} style={{ color: 'var(--accent)' }} /> Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
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
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
            <Users size={15} style={{ color: 'var(--accent)' }} /> Team Activity Log
          </div>
          {!loading && <span className="badge badge-neutral">{logs.length} entries</span>}
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 44, borderRadius: 8, background: 'var(--surface2)', marginBottom: 8 }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <CalendarDays size={36} style={{ color: 'var(--text3)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text2)', fontWeight: 500 }}>No entries found</p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Try adjusting the date range or filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Member</th>
                  <th>Activity</th>
                  <th>Environments</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(entry => {
                  const time = entry.timestamp?.toDate?.()?.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || entry.date;
                  return (
                    <tr key={entry.id}>
                      <td style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>{time}</td>
                      <td><span className="badge badge-neutral" style={{ fontFamily: 'monospace', fontSize: 11 }}>{shortEmail(entry.userEmail)}</span></td>
                      <td><span className="badge badge-accent">{getActivityName(entry)}</span></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>{getEnvNames(entry)}</td>
                      <td style={{ color: 'var(--text3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
