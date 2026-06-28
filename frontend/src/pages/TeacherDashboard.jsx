import React, { useState, useEffect, useCallback, useRef } from 'react';
import SyllabusTracker from '../components/SyllabusTracker';

// ─── Comment Editor ────────────────────────────────────────────────────────────
function CommentEditor({ allocation, token, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(allocation.comment || '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  const openEditor = (e) => {
    e.stopPropagation();
    setDraft(allocation.comment || '');
    setOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/${allocation._id}/comment`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ comment: draft.trim() || 'No comment' })
        }
      );
      if (!res.ok) throw new Error('Failed to save comment');
      setOpen(false);
      onSaved();
    } catch {
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setOpen(false);
  };

  const hasComment = allocation.comment && allocation.comment !== 'No comment';

  return (
    <div style={{ marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{
            flex: 1,
            fontSize: '0.8rem',
            color: hasComment ? '#475569' : '#94a3b8',
            fontStyle: hasComment ? 'normal' : 'italic',
            lineHeight: '1.5',
            wordBreak: 'break-word'
          }}>
            {hasComment ? `💬 ${allocation.comment}` : '💬 No note added'}
          </span>
          <button onClick={openEditor} style={styles.ghostBtn}>
            ✏️
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
          <textarea
            ref={textareaRef}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a reason or note…"
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button onClick={handleCancel} style={styles.cancelBtn}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ ...styles.primaryBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Deploy Form (shown as a separate view) ────────────────────────────────────
function DeployView({ sections, token, onDeployed, onBack }) {
  const [selectedClassName, setSelectedClassName] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [rawTopicsInput, setRawTopicsInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableClasses = [...new Set(sections.map(s => s.className))].sort();
  const sectionsForClass = sections.filter(s => s.className === selectedClassName);

  const handleClassChange = async (className) => {
    setSelectedClassName(className);
    setSelectedSubject('');
    setAvailableSubjects([]);
    setSelectedSectionIds([]);
    setRawTopicsInput('');
    setStartDate('');
    setEndDate('');
    if (!className) return;
    try {
      setSubjectsLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/subjects?className=${encodeURIComponent(className)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to load subjects');
      setAvailableSubjects(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleSectionToggle = (sectionId) => {
    setSelectedSectionIds(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedSectionIds.length === 0) { setError('Select at least one section.'); return; }

    const topics = rawTopicsInput
      .split('\n').map(l => l.trim()).filter(l => l.length > 0)
      .map(line => {
        const idx = line.indexOf(':');
        if (idx === -1) return { title: line, subtopics: [], description: '' };
        return {
          title: line.slice(0, idx).trim(),
          subtopics: line.slice(idx + 1).split(',').map(s => s.trim()).filter(Boolean).map(s => ({ title: s, description: '' })),
          description: ''
        };
      });

    if (topics.length === 0) { setError('Enter at least one topic.'); return; }
    if (!startDate || !endDate) { setError('Provide both start and end dates.'); return; }
    if (new Date(endDate) < new Date(startDate)) { setError('End date cannot be before start date.'); return; }

    try {
      setSubmitting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          className: selectedClassName,
          subject: selectedSubject,
          sections: selectedSectionIds.map(sectionId => ({ sectionId, topics })),
          startDate,
          endDate
        })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to create syllabus');
      onDeployed();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = selectedSectionIds.length > 0 && rawTopicsInput.trim() !== '' && startDate && endDate && !submitting;

  return (
    <div>
      {/* Header */}
      <div style={styles.viewHeader}>
        <button onClick={onBack} style={styles.backBtn}>
          ← Back
        </button>
        <h2 style={styles.viewTitle}>Deploy new syllabus</h2>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#c62828' }}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Class */}
        <div>
          <label style={styles.label}>Class</label>
          <select value={selectedClassName} onChange={(e) => handleClassChange(e.target.value)} required style={styles.select}>
            <option value="">— Select class —</option>
            {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>

        {/* Subject */}
        {selectedClassName && (
          <div>
            <label style={styles.label}>Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setSelectedSectionIds([]); setRawTopicsInput(''); setStartDate(''); setEndDate(''); }}
              disabled={subjectsLoading}
              required
              style={styles.select}
            >
              <option value="">
                {subjectsLoading ? 'Loading…' : availableSubjects.length === 0 ? 'No subjects for this class' : '— Select subject —'}
              </option>
              {availableSubjects.map(sub => <option key={sub._id} value={sub.name}>{sub.name}</option>)}
            </select>
          </div>
        )}

        {/* Sections */}
        {selectedSubject && (
          <div>
            <label style={styles.label}>Sections</label>
            {sectionsForClass.length === 0 ? (
              <p style={{ color: '#f59e0b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                No sections found for {selectedClassName}. Ask admin to create sections first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {sectionsForClass.map(sec => {
                  const checked = selectedSectionIds.includes(sec._id);
                  return (
                    <label key={sec._id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', minHeight: '44px',
                      border: `2px solid ${checked ? '#4CAF50' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: checked ? '#f0fdf4' : '#fff',
                      cursor: 'pointer', fontWeight: '600',
                      transition: 'all 0.15s ease', userSelect: 'none',
                      fontSize: '0.95rem'
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => handleSectionToggle(sec._id)} />
                      Section {sec.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Topics */}
        {selectedSectionIds.length > 0 && (
          <div>
            <label style={styles.label}>
              Topics <span style={{ fontWeight: '400', color: '#64748b' }}>— one per line</span>
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Format: <code>Chapter Name : subtopic1, subtopic2</code> (subtopics optional)
            </p>
            <textarea
              rows={8}
              value={rawTopicsInput}
              onChange={(e) => setRawTopicsInput(e.target.value)}
              placeholder={`Chapter 1: Intro to Cells\nChapter 2: Cell Division, Mitosis, Meiosis\nChapter 3: Genetics\nRevision`}
              style={{ fontFamily: 'monospace', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }}
              required
            />
          </div>
        )}

        {/* Dates */}
        {selectedSectionIds.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={styles.label}>Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.select} />
            </div>
            <div>
              <label style={styles.label}>End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} style={styles.select} />
            </div>
          </div>
        )}

        {selectedSubject && (
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...styles.primaryBtn,
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            {submitting ? 'Deploying…' : `Deploy to ${selectedSectionIds.length || '—'} section(s)`}
          </button>
        )}
      </form>
    </div>
  );
}

// ─── Allocation Card ────────────────────────────────────────────────────────────
function AllocationCard({ alloc, token, isActive, onClick, onDrop, onCommentSaved }) {
  const totalTopics = (alloc.topics || []).reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
  const completedCount = alloc.completedTopics?.filter(t => t.status === 'completed').length || 0;
  const percentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const sylStart = formatDate(alloc.startDate);
  const sylEnd = formatDate(alloc.endDate);

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: isActive ? '2px solid #4CAF50' : '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: '700' }}>
            {alloc.className} — Sec {alloc.section}
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>{alloc.subject}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDrop(); }}
          style={{ ...styles.ghostBtn, color: '#ef4444', border: '1px solid #fecaca', flexShrink: 0 }}
          title="Drop syllabus"
        >
          🗑
        </button>
      </div>

      {(sylStart || sylEnd) && (
        <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#94a3b8' }}>
          📅 {sylStart || '—'} → {sylEnd || '—'}
        </p>
      )}

      {/* Progress bar */}
      <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '6px' }}>
        <div style={{
          background: percentage === 100 ? '#16a34a' : '#4CAF50',
          width: `${percentage}%`, height: '100%',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
        <span>Progress</span>
        <strong style={{ color: percentage === 100 ? '#16a34a' : '#1e293b' }}>
          {percentage}% ({completedCount}/{totalTopics})
        </strong>
      </div>

      <CommentEditor allocation={alloc} token={token} onSaved={onCommentSaved} />

      {/* Tap hint */}
      <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
        Tap to open tracker →
      </div>
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const styles = {
  viewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  viewTitle: {
    margin: 0,
    fontSize: '1.15rem',
    color: '#1e293b',
    fontWeight: '700',
  },
  backBtn: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 14px',
    minHeight: '40px',
    cursor: 'pointer',
    fontSize: '0.88rem',
    color: '#475569',
    fontWeight: '600',
    flexShrink: 0,
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#334155',
  },
  select: {
    width: '100%',
    boxSizing: 'border-box',
  },
  ghostBtn: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '6px 10px',
    minHeight: '36px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    color: '#64748b',
  },
  cancelBtn: {
    padding: '8px 16px',
    minHeight: '38px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    background: '#f8fafc',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: '#475569',
  },
  primaryBtn: {
    padding: '8px 18px',
    minHeight: '38px',
    border: 'none',
    borderRadius: '6px',
    background: '#2196F3',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.88rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    wordBreak: 'break-word',
  },
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '20px',
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: '#2196F3',
    color: '#fff',
    border: 'none',
    fontSize: '1.6rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
    zIndex: 20,
    lineHeight: 1,
  }
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
function TeacherDashboard({ teacherId }) {
  const [allocations, setAllocations] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // view: 'list' | 'detail' | 'deploy'
  const [view, setView] = useState('list');
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const selectedAllocationRef = useRef(selectedAllocation);

  const token = localStorage.getItem('token');

  useEffect(() => { selectedAllocationRef.current = selectedAllocation; }, [selectedAllocation]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [allocRes, secRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/teacher/${teacherId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/sections`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      if (!allocRes.ok) throw new Error(`Allocations fetch failed: ${allocRes.status}`);
      if (!secRes.ok) throw new Error(`Sections fetch failed: ${secRes.status}`);

      const allocData = await allocRes.json();
      const secData = await secRes.json();
      setAllocations(allocData);
      setSections(secData);

      if (selectedAllocationRef.current) {
        const updated = allocData.find(item => item._id === selectedAllocationRef.current._id);
        if (updated) setSelectedAllocation(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId, token]);

  useEffect(() => { if (teacherId) fetchDashboardData(); }, [teacherId, fetchDashboardData]);

  const handleSelectAllocation = (alloc) => {
    setSelectedAllocation(alloc);
    setView('detail');
  };

  const handleDropAllocation = async (syllabusId) => {
    if (!window.confirm('Erase this entire syllabus and clear its history?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/${syllabusId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not delete the syllabus allocation.');
      if (selectedAllocation?._id === syllabusId) {
        setSelectedAllocation(null);
        setView('list');
      }
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeployed = () => {
    fetchDashboardData();
    setView('list');
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
      Loading your classes…
    </div>
  );

  // ── VIEW: Deploy ──
  if (view === 'deploy') {
    return (
      <DeployView
        sections={sections}
        token={token}
        onDeployed={handleDeployed}
        onBack={() => setView('list')}
      />
    );
  }

  // ── VIEW: Detail (tracker for a selected syllabus) ──
  if (view === 'detail' && selectedAllocation) {
    return (
      <div>
        <div style={styles.viewHeader}>
          <button onClick={() => setView('list')} style={styles.backBtn}>
            ← Back
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ ...styles.viewTitle, marginBottom: '2px' }}>
              {selectedAllocation.className} — Sec {selectedAllocation.section}
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>{selectedAllocation.subject}</p>
          </div>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828' }}>×</button>
          </div>
        )}

        <SyllabusTracker
          allocation={selectedAllocation}
          completedTopics={selectedAllocation.completedTopics || []}
          onProgressUpdate={fetchDashboardData}
        />
      </div>
    );
  }

  // ── VIEW: List (default) ──
  return (
    <div style={{ paddingBottom: '80px' /* room for FAB */ }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: '700' }}>
          Your courses
        </h2>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {allocations.length} active
        </span>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828' }}>×</button>
        </div>
      )}

      {allocations.length === 0 ? (
        <div style={{
          border: '2px dashed #e2e8f0',
          borderRadius: '12px',
          padding: '48px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          background: '#fafafa'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontWeight: '600' }}>No syllabuses yet</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem' }}>
            Tap the <strong>+</strong> button below to deploy your first one.
          </p>
          <button onClick={() => setView('deploy')} style={{ ...styles.primaryBtn, padding: '10px 24px' }}>
            Deploy a syllabus
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {allocations.map((alloc) => (
            <AllocationCard
              key={alloc._id}
              alloc={alloc}
              token={token}
              isActive={selectedAllocation?._id === alloc._id}
              onClick={() => handleSelectAllocation(alloc)}
              onDrop={() => handleDropAllocation(alloc._id)}
              onCommentSaved={fetchDashboardData}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button — deploy new syllabus */}
      <button
        onClick={() => setView('deploy')}
        style={styles.fab}
        title="Deploy new syllabus"
        aria-label="Deploy new syllabus"
      >
        +
      </button>
    </div>
  );
}

export default TeacherDashboard;
