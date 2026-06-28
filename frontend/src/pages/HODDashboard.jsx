import React, { useState, useEffect, useRef } from 'react';

function HODDashboard({ userId }) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [setupEntries, setSetupEntries] = useState([]);
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftClasses, setDraftClasses] = useState([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  const [progressData, setProgressData] = useState([]);
  const [selectedProgressSubject, setSelectedProgressSubject] = useState('');
  const [selectedProgressClass, setSelectedProgressClass] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const token = localStorage.getItem('token');
  const teacherDropdownRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchAvailableClasses();
    fetchAvailableSubjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(e.target)) {
        setTeacherDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hod/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data) fetchProgress();
      }
    } catch (err) { console.error(err); }
    finally { setProfileLoading(false); }
  };

  const fetchAvailableClasses = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hod/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAvailableClasses(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchAvailableSubjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hod/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableSubjects([...new Set(data.map(s => s.name))].sort());
      }
    } catch (err) { console.error('Fetch error:', err); }
  };

  const fetchProgress = async () => {
    try {
      setProgressLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hod/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProgressData(await res.json());
    } catch (err) { console.error(err); }
    finally { setProgressLoading(false); }
  };

  const handleAddSubjectClick = () => {
    setDraftSubject('');
    setDraftClasses([]);
    setShowAddSubjectForm(true);
  };

  const handleCancelAddSubject = () => {
    setDraftSubject('');
    setDraftClasses([]);
    setShowAddSubjectForm(false);
  };

  const handleDraftSubjectSelect = (subject) => {
    setDraftSubject(subject);
    setDraftClasses([]);
  };

  const handleDraftClassToggle = (cls) => {
    if (!draftSubject) return;
    setDraftClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const handleConfirmAddEntry = () => {
    if (!draftSubject || draftClasses.length === 0) return;
    setSetupEntries(prev => [...prev, { subject: draftSubject, classNames: draftClasses }]);
    setDraftSubject('');
    setDraftClasses([]);
    setShowAddSubjectForm(false);
  };

  const handleRemoveEntry = (subject) => {
    setSetupEntries(prev => prev.filter(e => e.subject !== subject));
  };

  const handleSetupSubmit = async () => {
    setSetupError('');
    if (setupEntries.length === 0) {
      setSetupError('Please add at least one subject with classes.');
      return;
    }
    try {
      setSetupLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hod/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subjects: setupEntries })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfile(data.profile);
      setSetupEntries([]);
      fetchProgress();
    } catch (err) {
      setSetupError(err.message);
    } finally {
      setSetupLoading(false);
    }
  };

  const toggleTeacherId = (teacherId) => {
    setSelectedTeacherIds(prev =>
      prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
    );
    setExpandedSection(null);
  };

  const clearTeacherSelection = () => {
    setSelectedTeacherIds([]);
    setExpandedSection(null);
  };

  const getProgressColor = (pct) => {
    if (pct === 100) return '#16a34a';
    if (pct >= 60) return '#4CAF50';
    if (pct >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSubtopicStatus = (detail, subtopicId) => {
    const completed = detail.completedSubtopicIds || [];
    return completed.includes(subtopicId.toString()) ? 'completed' : 'not_yet';
  };

  const getTopicProgress = (detail, topic) => {
    const subs = topic.subtopics || [];
    if (subs.length === 0) return { completed: 0, total: 0, pct: 0 };
    const completed = subs.filter(s => getSubtopicStatus(detail, s._id) === 'completed').length;
    return { completed, total: subs.length, pct: Math.round((completed / subs.length) * 100) };
  };

  const getTeacherGroups = (details) => {
    const groups = {};
    for (const d of details) {
      const tid = d.teacher?._id || d.teacher?.id || 'unassigned';
      if (!groups[tid]) {
        groups[tid] = { teacherId: tid, teacherName: d.teacher?.name || 'Unassigned', teacherMobile: d.teacher?.mobileNo || '', sections: [] };
      }
      groups[tid].sections.push(d);
    }
    return Object.values(groups).map(g => ({
      ...g,
      avgProgress: Math.round(g.sections.reduce((s, d) => s + d.progress, 0) / g.sections.length)
    })).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  };

  if (profileLoading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading HOD View...</div>;

  // ── SETUP SCREEN ──
  if (!profile) {
    const addableSubjects = availableSubjects.filter(s => !setupEntries.some(e => e.subject === s));

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>HOD Profile Setup</h2>
        <p style={{ color: '#64748b', marginBottom: '28px' }}>Add each subject you head, along with the classes you supervise for it.</p>

        {setupError && (
          <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            {setupError}
          </div>
        )}

        {setupEntries.length > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {setupEntries.map(entry => (
              <div key={entry.subject} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>{entry.subject}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {entry.classNames.map(c => (
                      <span key={c} style={{ fontSize: '0.78rem', padding: '3px 9px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>{c}</span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => handleRemoveEntry(entry.subject)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddSubjectForm ? (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#334155' }}>1. Choose a Subject</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {addableSubjects.map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: `2px solid ${draftSubject === s ? '#4CAF50' : '#e2e8f0'}`, borderRadius: '8px', background: draftSubject === s ? '#f0fdf4' : '#fff', cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}>
                    <input type="radio" name="draftSubject" checked={draftSubject === s} onChange={() => handleDraftSubjectSelect(s)} style={{ width: '16px', height: '16px' }} />
                    {s}
                  </label>
                ))}
                {addableSubjects.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>All subjects have been added.</p>}
              </div>
            </div>

            <div style={{ marginBottom: '20px', opacity: draftSubject ? 1 : 0.45 }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#334155' }}>
                2. Choose Classes{draftSubject ? ` for ${draftSubject}` : ''}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {availableClasses.map(cls => {
                  const isChecked = draftClasses.includes(cls);
                  return (
                    <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: `2px solid ${isChecked ? '#4CAF50' : '#e2e8f0'}`, borderRadius: '8px', background: isChecked ? '#f0fdf4' : '#fff', cursor: draftSubject ? 'pointer' : 'not-allowed', fontWeight: 'bold', userSelect: 'none' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleDraftClassToggle(cls)} disabled={!draftSubject} style={{ width: '16px', height: '16px' }} />
                      {cls}
                    </label>
                  );
                })}
                {availableClasses.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No classes found. Ask admin to create sections first.</p>}
              </div>
              {!draftSubject && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>Select a subject first.</p>}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConfirmAddEntry}
                disabled={!draftSubject || draftClasses.length === 0}
                style={{ padding: '10px 18px', backgroundColor: (!draftSubject || draftClasses.length === 0) ? '#94a3b8' : '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (!draftSubject || draftClasses.length === 0) ? 'not-allowed' : 'pointer' }}
              >
                Add Subject
              </button>
              <button
                type="button"
                onClick={handleCancelAddSubject}
                style={{ padding: '10px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddSubjectClick}
            disabled={addableSubjects.length === 0}
            style={{ width: '100%', padding: '14px', marginBottom: '20px', backgroundColor: '#fff', border: '2px dashed #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: 'bold', fontSize: '0.95rem', cursor: addableSubjects.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            + Add Subject
          </button>
        )}

        <button
          type="button"
          onClick={handleSetupSubmit}
          disabled={setupLoading || setupEntries.length === 0}
          style={{ width: '100%', padding: '12px', backgroundColor: (setupLoading || setupEntries.length === 0) ? '#94a3b8' : '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: (setupLoading || setupEntries.length === 0) ? 'not-allowed' : 'pointer' }}
        >
          {setupLoading ? 'Saving...' : 'Save Profile & Continue'}
        </button>
      </div>
    );
  }

  // ── MAIN HOD VIEW ──
  const subjectsWithData = [...new Set(progressData.flatMap(p => p.subjects.map(s => s.subject)))].sort();
  const classesForSelectedSubject = selectedProgressSubject
    ? progressData.filter(p => p.subjects.some(s => s.subject === selectedProgressSubject)).map(p => p.className).sort()
    : [];

  const selectedClassEntry = progressData.find(p => p.className === selectedProgressClass);
  const selectedSubjectEntry = selectedClassEntry?.subjects.find(s => s.subject === selectedProgressSubject);
  const currentDetails = selectedSubjectEntry?.details || [];

  const allTeacherGroups = currentDetails.length > 0 ? getTeacherGroups(currentDetails) : [];
  const visibleTeacherGroups = selectedTeacherIds.length === 0
    ? allTeacherGroups
    : allTeacherGroups.filter(g => selectedTeacherIds.includes(g.teacherId));
  const visibleSections = visibleTeacherGroups.flatMap(g => g.sections);

  const teacherFilterLabel = selectedTeacherIds.length === 0
    ? 'All Teachers'
    : selectedTeacherIds.length === 1
      ? allTeacherGroups.find(g => g.teacherId === selectedTeacherIds[0])?.teacherName || '1 selected'
      : `${selectedTeacherIds.length} teachers selected`;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>HOD View</h1>
          <p style={{ margin: 0, color: '#64748b' }}>
            {profile.subjects.map(e => (
              <span key={e.subject} style={{ marginRight: '14px' }}>
                <strong>{e.subject}</strong>: {e.classNames.join(', ')}
              </span>
            ))}
          </p>
        </div>
        <button
          onClick={() => { setSetupEntries(profile.subjects || []); setProfile(null); }}
          style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}
        >
          Edit Profile
        </button>
      </div>

      {progressLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading progress data...</div>
      ) : progressData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
          No syllabus data found yet for your subjects in your supervised classes.
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px', maxWidth: '900px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>1. Select Subject</label>
              <select
                value={selectedProgressSubject}
                onChange={e => {
                  setSelectedProgressSubject(e.target.value);
                  setSelectedProgressClass('');
                  setSelectedTeacherIds([]);
                  setTeacherDropdownOpen(false);
                  setExpandedSection(null);
                }}
                style={{ width: '100%', padding: '11px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.95rem' }}
              >
                <option value="">-- Select a subject --</option>
                {subjectsWithData.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>2. Select Class</label>
              <select
                value={selectedProgressClass}
                onChange={e => {
                  setSelectedProgressClass(e.target.value);
                  setSelectedTeacherIds([]);
                  setTeacherDropdownOpen(false);
                  setExpandedSection(null);
                }}
                disabled={!selectedProgressSubject}
                style={{ width: '100%', padding: '11px', border: '1px solid #cbd5e1', borderRadius: '8px', background: !selectedProgressSubject ? '#f8fafc' : '#fff', fontSize: '0.95rem' }}
              >
                <option value="">-- Select a class --</option>
                {classesForSelectedSubject.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div ref={teacherDropdownRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Filter by Teacher</label>
              <button
                type="button"
                onClick={() => setTeacherDropdownOpen(open => !open)}
                disabled={!selectedProgressClass || allTeacherGroups.length === 0}
                style={{
                  width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px',
                  background: (!selectedProgressClass || allTeacherGroups.length === 0) ? '#f8fafc' : '#fff',
                  fontSize: '0.95rem', color: '#1e293b', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: (!selectedProgressClass || allTeacherGroups.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacherFilterLabel}</span>
                <span style={{ color: '#94a3b8', marginLeft: '8px' }}>{teacherDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {teacherDropdownOpen && allTeacherGroups.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '260px', overflowY: 'auto' }}>
                  <div onClick={clearTeacherSelection} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: selectedTeacherIds.length === 0 ? '#16a34a' : '#475569', backgroundColor: selectedTeacherIds.length === 0 ? '#f0fdf4' : 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                    {selectedTeacherIds.length === 0 ? '✓ ' : ''}All Teachers
                  </div>
                  {allTeacherGroups.map(g => {
                    const checked = selectedTeacherIds.includes(g.teacherId);
                    return (
                      <label key={g.teacherId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', backgroundColor: checked ? '#f0fdf4' : 'transparent' }} onMouseDown={(e) => e.preventDefault()}>
                        <input type="checkbox" checked={checked} onChange={() => toggleTeacherId(g.teacherId)} style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#16a34a' }} />
                        <span style={{ color: '#1e293b', flex: 1 }}>{g.teacherName}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: getProgressColor(g.avgProgress) }}>{g.avgProgress}%</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {selectedProgressSubject && !selectedProgressClass && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
              Select a class to view progress.
            </div>
          )}

          {selectedProgressClass && visibleSections.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
              No allocated sections found for this subject and class.
            </div>
          )}

          {visibleSections.length > 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Sections Shown', value: visibleSections.length },
                  { label: 'Fully Complete', value: visibleSections.filter(s => s.progress === 100).length },
                  { label: 'Average Progress', value: `${Math.round(visibleSections.reduce((sum, s) => sum + s.progress, 0) / visibleSections.length)}%` }
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#334155' }}>Teacher Summary</h3>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Teacher</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569' }}>Sections</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', width: '180px' }}>Avg. Progress</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTeacherGroups.map((group, idx) => {
                        const isSelected = selectedTeacherIds.includes(group.teacherId);
                        return (
                          <tr key={group.teacherId} onClick={() => toggleTeacherId(group.teacherId)} style={{ borderBottom: idx < visibleTeacherGroups.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: isSelected ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{group.teacherName}</div>
                              {group.teacherMobile && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{group.teacherMobile}</div>}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{group.sections.map(s => `Sec ${s.section}`).join(', ')}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{ backgroundColor: getProgressColor(group.avgProgress), width: `${group.avgProgress}%`, height: '100%', borderRadius: '4px' }} />
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: getProgressColor(group.avgProgress) }}>{group.avgProgress}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {selectedTeacherIds.length > 0 && (
                    <div style={{ padding: '10px 16px', backgroundColor: '#f0fdf4', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#16a34a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Showing <strong>{teacherFilterLabel}</strong></span>
                      <button onClick={clearTeacherSelection} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', textDecoration: 'underline' }}>Show all</button>
                    </div>
                  )}
                </div>
              </div>

              <h3 style={{ margin: '0 0 16px 0', color: '#334155' }}>{selectedProgressSubject} — Sections by Teacher</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {visibleTeacherGroups.map(group => (
                  <div key={group.teacherId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>👤 {group.teacherName}</span>
                        {group.teacherMobile && <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginLeft: '10px' }}>{group.teacherMobile}</span>}
                      </div>
                      <div style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: `${getProgressColor(group.avgProgress)}18`, border: `1px solid ${getProgressColor(group.avgProgress)}40`, fontWeight: 'bold', fontSize: '0.85rem', color: getProgressColor(group.avgProgress) }}>
                        Avg {group.avgProgress}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '12px', borderLeft: `3px solid ${getProgressColor(group.avgProgress)}40` }}>
                      {group.sections.slice().sort((a, b) => (a.section || '').localeCompare(b.section || '')).map((detail, idx) => {
                        const pct = detail.progress || 0;
                        const cardKey = `${group.teacherId}|||${detail.section}`;
                        const isExpanded = expandedSection === cardKey;
                        const sylStart = formatDate(detail.startDate);
                        const sylEnd = formatDate(detail.endDate);
                        const hasComment = detail.comment && detail.comment !== 'No comment';

                        return (
                          <div key={idx} style={{ background: '#fff', border: `1px solid ${isExpanded ? getProgressColor(pct) : '#e2e8f0'}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div onClick={() => setExpandedSection(isExpanded ? null : cardKey)} style={{ padding: '14px 18px', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.92rem' }}>Section {detail.section}</h4>
                                  {(sylStart || sylEnd) && (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px' }}>
                                      📅 {sylStart || '—'} → {sylEnd || '—'}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ padding: '3px 10px', borderRadius: '14px', backgroundColor: `${getProgressColor(pct)}18`, border: `1px solid ${getProgressColor(pct)}40`, fontWeight: 'bold', fontSize: '0.82rem', color: getProgressColor(pct) }}>{pct}%</div>
                                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'}</span>
                                </div>
                              </div>

                              {/* ── Teacher comment — always visible ── */}
                              {hasComment && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '0 0 10px 0', padding: '7px 10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '0.78rem', flexShrink: 0 }}>💬</span>
                                  <span style={{ fontSize: '0.78rem', color: '#92400e', fontStyle: 'italic', lineHeight: '1.4' }}>{detail.comment}</span>
                                </div>
                              )}

                              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden', marginBottom: '5px' }}>
                                <div style={{ backgroundColor: getProgressColor(pct), width: `${pct}%`, height: '100%' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
                                <span>{detail.completedTopics} of {detail.totalTopics} topics completed</span>
                                {pct === 100 && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Complete</span>}
                              </div>
                            </div>

                            {isExpanded && (
                              <div style={{ borderTop: '1px solid #e2e8f0' }}>
                                {(detail.topics || []).length === 0 ? (
                                  <p style={{ padding: '16px 20px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No topics found.</p>
                                ) : (
                                  (detail.topics || []).map((topic, ti) => {
                                    const topicProg = getTopicProgress(detail, topic);
                                    const subs = topic.subtopics || [];
                                    return (
                                      <div key={ti} style={{ borderBottom: ti < detail.topics.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>{topic.title}</span>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {subs.length > 0 && (
                                              <>
                                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{topicProg.completed}/{topicProg.total} done</span>
                                                <div style={{ width: '80px', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                                  <div style={{ width: `${topicProg.pct}%`, height: '100%', backgroundColor: getProgressColor(topicProg.pct), borderRadius: '4px' }} />
                                                </div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: getProgressColor(topicProg.pct), minWidth: '32px', textAlign: 'right' }}>{topicProg.pct}%</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        {subs.map((sub, si) => {
                                          const isDone = getSubtopicStatus(detail, sub._id) === 'completed';
                                          return (
                                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px 9px 36px', borderBottom: si < subs.length - 1 ? '1px solid #f8fafc' : 'none', backgroundColor: isDone ? '#f0fdf4' : '#fff' }}>
                                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, backgroundColor: isDone ? '#16a34a' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {isDone && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
                                              </div>
                                              <span style={{ fontSize: '0.85rem', color: isDone ? '#94a3b8' : '#334155', textDecoration: isDone ? 'line-through' : 'none' }}>{sub.title}</span>
                                              {!isDone && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#cbd5e1' }}>not covered</span>}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HODDashboard;
