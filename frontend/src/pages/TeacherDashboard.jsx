import React, { useState, useEffect, useCallback, useRef } from 'react';
import SyllabusTracker from '../components/SyllabusTracker';

function TeacherDashboard({ teacherId }) {
  const [allocations, setAllocations] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedClassName, setSelectedClassName] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [rawTopicsInput, setRawTopicsInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const token = localStorage.getItem('token');
  const selectedAllocationRef = useRef(selectedAllocation);

  useEffect(() => { selectedAllocationRef.current = selectedAllocation; }, [selectedAllocation]);

  const availableClasses = [...new Set(sections.map(s => s.className))].sort();
  const sectionsForClass = sections.filter(s => s.className === selectedClassName);

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
        const updatedMatch = allocData.find(item => item._id === selectedAllocationRef.current._id);
        if (updatedMatch) setSelectedAllocation(updatedMatch);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId, token]);

  useEffect(() => { if (teacherId) fetchDashboardData(); }, [teacherId, fetchDashboardData]);

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

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedSectionIds([]);
    setRawTopicsInput('');
    setStartDate('');
    setEndDate('');
  };

  const handleSectionToggle = (sectionId) => {
    setSelectedSectionIds(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleDeploySyllabus = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedSectionIds.length === 0) {
      setError('Please select at least one section.');
      return;
    }

    const topics = rawTopicsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) {
          return { title: line, subtopics: [], description: '' };
        }
        const title = line.slice(0, colonIdx).trim();
        const subtopics = line.slice(colonIdx + 1)
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => ({ title: s, description: '' }));
        return { title, subtopics, description: '' };
      });
    
    if (topics.length === 0) {
      setError('Please enter at least one topic.');
      return;
    }

    if(!startDate || !endDate) {
      setError('Please provide both start and end dates.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    const sectionsPayload = selectedSectionIds.map(sectionId => ({ sectionId, topics }));

    console.log('Payload:', JSON.stringify({
      className: selectedClassName,
      subject: selectedSubject,
      sections: sectionsPayload,
      startDate,
      endDate
    }, null, 2));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          className: selectedClassName,
          subject: selectedSubject,
          sections: sectionsPayload,
          startDate: startDate,
          endDate: endDate
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to create syllabus');

      if (resData.errors && resData.errors.length > 0) {
        setError(`Some sections had errors: ${resData.errors.map(e => e.reason).join(', ')}`);
      }

      setSelectedClassName('');
      setSelectedSubject('');
      setAvailableSubjects([]);
      setSelectedSectionIds([]);
      setRawTopicsInput('');
      setStartDate('');
      setEndDate('');
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDropSyllabusAllocation = async (syllabusId, e) => {
    e.stopPropagation();
    if (!window.confirm('Erase this entire syllabus and clear its history?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabus/${syllabusId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not delete the syllabus allocation.');
      if (selectedAllocation && selectedAllocation._id === syllabusId) {
        setSelectedAllocation(null);
      }
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading allotted classes...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Teacher Tracker Center</h2>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '10px', cursor: 'pointer', background: 'none', border: 'none' }}>×</button>
        </div>
      )}

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Deploy New Syllabus</h3>
        <form onSubmit={handleDeploySyllabus}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Class</label>
              <select
                value={selectedClassName}
                onChange={(e) => handleClassChange(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff' }}
                required
              >
                <option value="">-- Select Class --</option>
                {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff' }}
                disabled={!selectedClassName || subjectsLoading}
                required
              >
                <option value="">
                  {subjectsLoading ? 'Loading subjects...' : selectedClassName ? availableSubjects.length === 0 ? 'No subjects available for this class' : '-- Select Subject --' : '-- Select a class first --'}
                </option>
                {availableSubjects.map(sub => <option key={sub._id} value={sub.name}>{sub.name}</option>)}
              </select>
            </div>
          </div>

          {selectedSubject && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Select Sections</label>
              {sectionsForClass.length === 0 ? (
                <p style={{ color: '#f59e0b', fontStyle: 'italic' }}>No sections found for {selectedClassName}. Ask admin to create sections first.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {sectionsForClass.map(sec => {
                    const isChecked = selectedSectionIds.includes(sec._id);
                    return (
                      <label
                        key={sec._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                          border: `2px solid ${isChecked ? '#4CAF50' : '#e2e8f0'}`, borderRadius: '8px',
                          background: isChecked ? '#f0fdf4' : '#fff', cursor: 'pointer', fontWeight: 'bold',
                          transition: 'all 0.2s ease', userSelect: 'none'
                        }}
                      >
                        <input type="checkbox" checked={isChecked} onChange={() => handleSectionToggle(sec._id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        Section {sec.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedSectionIds.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Topics — one per line: <code>Topic Name : subtopic1, subtopic2</code>
              </label>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: '#64748b' }}>
                Subtopics are optional. Lines without <code>:</code> are treated as topics with no subtopics.
              </p>
              <textarea
                rows="7"
                value={rawTopicsInput}
                onChange={(e) => setRawTopicsInput(e.target.value)}
                placeholder={`Chapter 1: Intro to Cells\nChapter 2: Cell Division, Mitosis, Meiosis\nChapter 3: Genetics\nRevision`}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', fontSize: '0.9rem', fontFamily: 'monospace' }}
                required
              />
            </div>
          )}

          {selectedSectionIds.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {selectedSubject && (
            <button
              type="submit"
              disabled={selectedSectionIds.length === 0 || rawTopicsInput.trim() === ''}
              style={{
                width: '100%', padding: '12px',
                backgroundColor: selectedSectionIds.length === 0 || rawTopicsInput.trim() === '' ? '#94a3b8' : '#2196F3',
                color: 'white', border: 'none', borderRadius: '6px',
                cursor: selectedSectionIds.length === 0 || rawTopicsInput.trim() === '' ? 'not-allowed' : 'pointer',
                fontWeight: 'bold', fontSize: '1rem'
              }}
            >
              Deploy to {selectedSectionIds.length} Section(s)
            </button>
          )}
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px' }}>
        <div>
          <h3 style={{ marginBottom: '15px', color: '#444' }}>Your Active Course Tracks</h3>
          {allocations.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic' }}>No syllabuses initialized yet. Build one above!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {allocations.map((alloc) => {
                const totalTopics = (alloc.topics || []).reduce((sum, t) => sum + (t.subtopics?.length || 0), 0);
                const completedCount = alloc.completedTopics?.filter(t => t.status === 'completed').length || 0;
                const percentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
                const isCurrentActive = selectedAllocation?._id === alloc._id;
                const sylStart = formatDate(alloc.startDate);
                const sylEnd = formatDate(alloc.endDate);

                return (
                  <div
                    key={alloc._id}
                    onClick={() => setSelectedAllocation(alloc)}
                    style={{
                      border: isCurrentActive ? '2px solid #4CAF50' : '1px solid #ddd', padding: '15px',
                      borderRadius: '8px', backgroundColor: isCurrentActive ? '#f9fdf9' : '#fff',
                      cursor: 'pointer', position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginRight: '50px' }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{alloc.className} [Sec {alloc.section}]</h4>
                      <span style={{ fontSize: '0.8rem', backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: '4px' }}>{alloc.subject}</span>
                    </div>

                    {(sylStart || sylEnd) && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                        📅 {sylStart || '—'} → {sylEnd || '—'}
                      </p>
                    )}

                    <div style={{ backgroundColor: '#eee', borderRadius: '4px', height: '8px', width: '100%', marginTop: '8px', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: percentage === 100 ? '#2e7d32' : '#4CAF50', width: `${percentage}%`, height: '100%' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.8rem', color: '#666' }}>
                      <span>Completed Units</span>
                      <strong>{percentage}% ({completedCount}/{totalTopics})</strong>
                    </div>
                    <button
                      onClick={(e) => handleDropSyllabusAllocation(alloc._id, e)}
                      style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Drop
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {selectedAllocation ? (
            <SyllabusTracker
              allocation={selectedAllocation}
              completedTopics={selectedAllocation.completedTopics || []}
              onProgressUpdate={fetchDashboardData}
            />
          ) : (
            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '50px 20px', textAlign: 'center', color: '#888', backgroundColor: '#fafafa' }}>
              <h3>📋 Performance Workspace Canvas</h3>
              <p>Select a course track card on the left to view and update progress.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
