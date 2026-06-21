import React, { useState, useEffect, useRef } from 'react';

function HeadMasterDashboard() {
  const [classesData, setClassesData] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetailCache, setClassDetailCache] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sectionsProgress, setSectionsProgress] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const teacherDropdownRef = useRef(null);

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(e.target)) {
        setTeacherDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/headmaster/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load classes');
      setClassesData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = async (cls) => {
    setSelectedClass(cls);
    setSelectedSubject('');
    setSectionsProgress([]);
    setSubjects([]);
    setClassDetailCache(null);
    setSelectedTeacherIds([]);
    setTeacherDropdownOpen(false);
    setExpandedSection(null);
    try {
      setSubjectsLoading(true);
      setError('');
      const res = await fetch(
        `http://localhost:5000/api/headmaster/class/${encodeURIComponent(cls.className)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to load subjects for this class');
      const data = await res.json();
      setClassDetailCache(data);
      const uniqueSubjects = [...new Set(data.details.map(d => d.subject).filter(Boolean))].sort();
      setSubjects(uniqueSubjects);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSectionsProgress([]);
    setSelectedTeacherIds([]);
    setTeacherDropdownOpen(false);
    setExpandedSection(null);
    if (!subject || !classDetailCache) return;
    setProgressLoading(true);
    const filtered = classDetailCache.details.filter(d => d.subject === subject);
    setSectionsProgress(filtered);
    setProgressLoading(false);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setSelectedSubject('');
    setSubjects([]);
    setSectionsProgress([]);
    setClassDetailCache(null);
    setSelectedTeacherIds([]);
    setTeacherDropdownOpen(false);
    setExpandedSection(null);
    setError('');
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

  // ✅ Fixed: match by subtopic._id, not by title
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

  const getTeacherGroups = (sections) => {
    const groups = {};
    for (const detail of sections) {
      const teacherId = detail.teacher?._id || detail.teacher?.id || 'unassigned';
      const teacherName = detail.teacher?.name || 'Unassigned';
      const teacherMobile = detail.teacher?.mobileNo || '';
      if (!groups[teacherId]) {
        groups[teacherId] = { teacherId, teacherName, teacherMobile, sections: [] };
      }
      groups[teacherId].sections.push(detail);
    }
    return Object.values(groups).map(group => ({
      ...group,
      avgProgress: Math.round(
        group.sections.reduce((sum, s) => sum + s.progress, 0) / group.sections.length
      )
    })).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  };

  const getAllSubjects = (cls) => {
    return [...new Set((cls.allocations || []).map(a => a.subject).filter(Boolean))];
  };

  const getAllSections = (cls) => {
    return [...new Set((cls.allocations || []).map(a => a.section).filter(Boolean))];
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading dashboard...</div>
  );

  const allTeacherGroups = sectionsProgress.length > 0 ? getTeacherGroups(sectionsProgress) : [];
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

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>Academic Progress Dashboard</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Monitor syllabus progress across classes and subjects</p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#c62828', fontWeight: 'bold', fontSize: '1.1rem' }}>×</button>
        </div>
      )}

      {/* ── VIEW 1: Class Cards ── */}
      {!selectedClass && (
        <div>
          <h2 style={{ marginBottom: '20px', color: '#334155' }}>Select a Class</h2>
          {classesData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
              <p style={{ fontSize: '1.1rem' }}>No class allocations found yet.</p>
              <p style={{ fontSize: '0.9rem' }}>Teachers need to create syllabuses first.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {classesData.map(cls => {
                const pct = cls.progress || 0;
                const subjectCount = cls.totalSubjects ?? getAllSubjects(cls).length;
                const sectionCount = cls.totalSections ?? getAllSections(cls).length;
                return (
                  <div
                    key={cls.className}
                    onClick={() => handleClassSelect(cls)}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)'}
                  >
                    <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '1.2rem' }}>{cls.className}</h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>
                      {subjectCount} subject{subjectCount !== 1 ? 's' : ''} · {sectionCount} section{sectionCount !== 1 ? 's' : ''}
                    </p>
                    <div style={{ backgroundColor: '#f1f5f9', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ backgroundColor: getProgressColor(pct), width: `${pct}%`, height: '100%', borderRadius: '6px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
                      <span>Overall progress</span>
                      <strong style={{ color: getProgressColor(pct) }}>{pct}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: Subject + Sections ── */}
      {selectedClass && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={handleBackToClasses}
              style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}
            >
              ← All Classes
            </button>
            <span style={{ color: '#94a3b8' }}>›</span>
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1rem' }}>{selectedClass.className}</span>
            {selectedSubject && (<><span style={{ color: '#94a3b8' }}>›</span><span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{selectedSubject}</span></>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px', maxWidth: '720px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectSelect(e.target.value)}
                disabled={subjectsLoading}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '0.95rem', color: '#1e293b' }}
              >
                <option value="">{subjectsLoading ? 'Loading...' : subjects.length === 0 ? 'No subjects yet' : '-- Select a subject --'}</option>
                {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>

            <div ref={teacherDropdownRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Filter by Teacher</label>
              <button
                type="button"
                onClick={() => setTeacherDropdownOpen(open => !open)}
                disabled={!selectedSubject || allTeacherGroups.length === 0}
                style={{
                  width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px',
                  background: (!selectedSubject || allTeacherGroups.length === 0) ? '#f8fafc' : '#fff',
                  fontSize: '0.95rem', color: '#1e293b', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: (!selectedSubject || allTeacherGroups.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {teacherFilterLabel}
                </span>
                <span style={{ color: '#94a3b8', marginLeft: '8px' }}>{teacherDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {teacherDropdownOpen && allTeacherGroups.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
                  background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '260px', overflowY: 'auto'
                }}>
                  <div
                    onClick={clearTeacherSelection}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
                      color: selectedTeacherIds.length === 0 ? '#16a34a' : '#475569',
                      backgroundColor: selectedTeacherIds.length === 0 ? '#f0fdf4' : 'transparent',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    {selectedTeacherIds.length === 0 ? '✓ ' : ''}All Teachers
                  </div>
                  {allTeacherGroups.map(g => {
                    const checked = selectedTeacherIds.includes(g.teacherId);
                    return (
                      <label
                        key={g.teacherId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem',
                          backgroundColor: checked ? '#f0fdf4' : 'transparent'
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTeacherId(g.teacherId)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#16a34a' }}
                        />
                        <span style={{ color: '#1e293b', flex: 1 }}>{g.teacherName}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: getProgressColor(g.avgProgress) }}>{g.avgProgress}%</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {progressLoading && <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading section data...</div>}

          {!progressLoading && selectedSubject && sectionsProgress.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
              No sections allocated for {selectedSubject} in {selectedClass.className}.
            </div>
          )}

          {!progressLoading && visibleSections.length > 0 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
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

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 14px 0', color: '#334155' }}>Teacher Summary</h3>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Teacher</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Sections</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', width: '200px' }}>Avg. Progress</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTeacherGroups.map((group, idx) => {
                        const isSelected = selectedTeacherIds.includes(group.teacherId);
                        return (
                          <tr
                            key={group.teacherId}
                            onClick={() => toggleTeacherId(group.teacherId)}
                            style={{ borderBottom: idx < visibleTeacherGroups.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: isSelected ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer', outline: isSelected ? '2px solid #4CAF50' : 'none', outlineOffset: '-2px' }}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{group.teacherName}</div>
                              {group.teacherMobile && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{group.teacherMobile}</div>}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#475569' }}>{group.sections.map(s => `Sec ${s.section}`).join(', ')}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{ backgroundColor: getProgressColor(group.avgProgress), width: `${group.avgProgress}%`, height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', color: getProgressColor(group.avgProgress) }}>{group.avgProgress}%</td>
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

              <h3 style={{ margin: '0 0 16px 0', color: '#334155' }}>
                {selectedSubject} — {selectedTeacherIds.length === 0 ? 'All Sections by Teacher' : 'Sections by Selected Teacher(s)'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {visibleTeacherGroups.map(group => (
                  <div key={group.teacherId}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>👤 {group.teacherName}</span>
                        {group.teacherMobile && <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginLeft: '10px' }}>{group.teacherMobile}</span>}
                      </div>
                      <div style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: `${getProgressColor(group.avgProgress)}18`, border: `1px solid ${getProgressColor(group.avgProgress)}40`, fontWeight: 'bold', fontSize: '0.85rem', color: getProgressColor(group.avgProgress) }}>
                        Avg {group.avgProgress}%
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '12px', borderLeft: `3px solid ${getProgressColor(group.avgProgress)}40` }}>
                      {group.sections
                        .slice()
                        .sort((a, b) => (a.section || '').localeCompare(b.section || ''))
                        .map((detail, idx) => {
                          const pct = detail.progress || 0;
                          const cardKey = `${group.teacherId}|||${detail.section}`;
                          const isExpanded = expandedSection === cardKey;
                          const sylStart = formatDate(detail.startDate);
                          const sylEnd = formatDate(detail.endDate);

                          return (
                            <div key={idx} style={{ background: '#fff', border: `1px solid ${isExpanded ? getProgressColor(pct) : '#e2e8f0'}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

                              <div
                                onClick={() => setExpandedSection(isExpanded ? null : cardKey)}
                                style={{ padding: '16px 20px', cursor: 'pointer' }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem' }}>Section {detail.section}</h4>
                                    {(sylStart || sylEnd) && (
                                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px' }}>
                                        📅 {sylStart || '—'} → {sylEnd || '—'}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: `${getProgressColor(pct)}18`, border: `1px solid ${getProgressColor(pct)}40`, fontWeight: 'bold', fontSize: '0.85rem', color: getProgressColor(pct) }}>
                                      {pct}%
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'}</span>
                                  </div>
                                </div>
                                <div style={{ backgroundColor: '#f1f5f9', borderRadius: '6px', height: '8px', overflow: 'hidden', marginBottom: '6px' }}>
                                  <div style={{ backgroundColor: getProgressColor(pct), width: `${pct}%`, height: '100%', borderRadius: '6px', transition: 'width 0.4s ease' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                                  <span>{detail.completedTopics} of {detail.totalTopics} subtopics completed</span>
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
                                            // ✅ Fixed: match by sub._id, not sub.title
                                            const isDone = getSubtopicStatus(detail, sub._id) === 'completed';
                                            return (
                                              <div
                                                key={si}
                                                style={{
                                                  display: 'flex', alignItems: 'center', gap: '10px',
                                                  padding: '9px 20px 9px 36px',
                                                  borderBottom: si < subs.length - 1 ? '1px solid #f8fafc' : 'none',
                                                  backgroundColor: isDone ? '#f0fdf4' : '#fff'
                                                }}
                                              >
                                                <div style={{
                                                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                                                  backgroundColor: isDone ? '#16a34a' : '#e2e8f0',
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                  {isDone && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
                                                </div>
                                                <span style={{
                                                  fontSize: '0.85rem',
                                                  color: isDone ? '#94a3b8' : '#334155',
                                                  textDecoration: isDone ? 'line-through' : 'none'
                                                }}>
                                                  {sub.title}
                                                </span>
                                                {!isDone && (
                                                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#cbd5e1' }}>not covered</span>
                                                )}
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

export default HeadMasterDashboard;
