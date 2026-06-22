import React, { useState } from 'react';

function SyllabusTracker({ allocation, completedTopics, onProgressUpdate }) {
  const masterTopics = allocation?.topics || [];
  const allocationId = allocation?._id;
  const [syncing, setSyncing] = useState(null); // subtopicId currently being updated
  const token = localStorage.getItem('token');

  // Matches by subtopic._id rather than title — titles aren't guaranteed unique
  // (two subtopics, even under different topics, could share a title), so id
  // is the only safe key here.
  // Both sides are coerced to strings before comparing: depending on how the
  // data came through (raw Mongoose doc vs JSON-serialized API response),
  // one side could be an ObjectId object and the other a string — strict
  // === would silently fail in that case even though the ids represent the
  // same value.
  const getSubtopicStatus = (subtopicId) => {
    const targetId = String(subtopicId);
    const record = completedTopics?.find(t => String(t.subtopicId) === targetId);
    return record?.status || 'not_yet';
  };

  const getTopicProgress = (topic) => {
    const subs = topic.subtopics || [];
    if (subs.length === 0) return { completed: 0, inProgress: 0, total: 0, pct: 0 };
    const completed = subs.filter(s => getSubtopicStatus(s._id) === 'completed').length;
    const inProgress = subs.filter(s => getSubtopicStatus(s._id) === 'in_progress').length;
    return {
      completed,
      inProgress,
      total: subs.length,
      pct: Math.round((completed / subs.length) * 100)
    };
  };

  const overallPct = () => {
    let total = 0, completed = 0;
    for (const topic of masterTopics) {
      for (const sub of topic.subtopics || []) {
        total++;
        if (getSubtopicStatus(sub._id) === 'completed') completed++;
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleStatusChange = async (subtopicId, newStatus) => {
    if (syncing) return;
    setSyncing(subtopicId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/update-topic`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ allocationId, subtopicId, status: newStatus })
      });
      if (!res.ok) throw new Error((await res.json()).message);
      if (onProgressUpdate) await onProgressUpdate();
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const statusStyles = (status) => {
    if (status === 'completed') return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
    if (status === 'in_progress') return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  };

  const progressBarColor = (pct) => {
    if (pct === 100) return '#16a34a';
    if (pct >= 60) return '#4CAF50';
    if (pct >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const overall = overallPct();

  if (masterTopics.length === 0) {
    return <p style={{ color: '#888', fontStyle: 'italic' }}>No topics assigned.</p>;
  }

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 2px 0', color: '#1e293b' }}>
          {allocation.className} — Section {allocation.section}
        </h3>
        <p style={{ margin: '0 0 12px 0', color: '#64748b', fontWeight: 'bold' }}>
          {allocation.subject}
        </p>

        {/* Overall progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${overall}%`, height: '100%', backgroundColor: progressBarColor(overall), borderRadius: '6px', transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontWeight: 'bold', color: progressBarColor(overall), minWidth: '40px', textAlign: 'right' }}>
            {overall}%
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Overall syllabus completion</p>
      </div>

      <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />

      {/* Topics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {masterTopics.map((topic, ti) => {
          const prog = getTopicProgress(topic);
          const subs = topic.subtopics || [];

          return (
            <div key={topic._id || ti} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>

              {/* Topic header */}
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: subs.length > 0 ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: subs.length > 0 ? '8px' : '0' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.95rem' }}>{topic.title}</span>
                  {subs.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {prog.completed}/{prog.total} subtopics done
                      {prog.inProgress > 0 && ` · ${prog.inProgress} in progress`}
                    </span>
                  )}
                </div>

                {/* Per-topic progress bar */}
                {subs.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, backgroundColor: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${prog.pct}%`, height: '100%', backgroundColor: progressBarColor(prog.pct), borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: progressBarColor(prog.pct), minWidth: '36px', textAlign: 'right' }}>
                      {prog.pct}%
                    </span>
                  </div>
                )}
              </div>

              {/* Subtopics */}
              {subs.map((sub, si) => {
                const status = getSubtopicStatus(sub._id);
                const isSyncing = syncing === sub._id;
                const s = statusStyles(status);

                return (
                  <div
                    key={sub._id || si}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px 10px 32px',
                      borderBottom: si < subs.length - 1 ? '1px solid #f1f5f9' : 'none',
                      backgroundColor: status === 'completed' ? '#f0fdf4' : status === 'in_progress' ? '#fffbeb' : '#fff',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {/* Subtopic name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: status === 'completed' ? '#16a34a' : status === 'in_progress' ? '#f59e0b' : '#cbd5e1',
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '0.88rem',
                        color: status === 'completed' ? '#94a3b8' : '#334155',
                        textDecoration: status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {sub.title}
                      </span>
                    </div>

                    {/* Status selector */}
                    <select
                      value={status}
                      disabled={!!syncing}
                      onChange={(e) => handleStatusChange(sub._id, e.target.value)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: syncing ? 'not-allowed' : 'pointer',
                        border: `1px solid ${s.border}`,
                        backgroundColor: s.bg,
                        color: s.color,
                        outline: 'none',
                        opacity: isSyncing ? 0.6 : 1
                      }}
                    >
                      <option value="not_yet">❌ Not Started</option>
                      <option value="in_progress">⏳ In Progress</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SyllabusTracker;
