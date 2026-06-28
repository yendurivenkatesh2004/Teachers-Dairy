import React, { useState, useEffect } from 'react';

function AdminPanel({ userId }) {
  const [activeTab, setActiveTab] = useState('sections');
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sectionForm, setSectionForm] = useState({ name: '', className: '', description: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', className: '' });

  const token = localStorage.getItem('token');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [secRes, userRes, allocRes, subRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/sections`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/allocations`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (secRes.ok) setSections(await secRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (allocRes.ok) setAllocations(await allocRes.json());
      if (subRes.ok) setSubjects(await subRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(sectionForm)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to create section');
      }
      setSectionForm({ name: '', className: '', description: '' });
      fetchAllData();
    } catch (err) { setError(err.message); }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/sections/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete section');
      fetchAllData();
    } catch (err) { setError(err.message); }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subjectForm)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to create subject');
      }
      setSubjectForm({ name: '', className: '' });
      fetchAllData();
    } catch (err) { setError(err.message); }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Delete this subject? Teachers will no longer see it in their dropdown.')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete subject');
      fetchAllData();
    } catch (err) { setError(err.message); }
  };

  const handleDeRegisterUser = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to completely deregister this user?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to deregister user');
      fetchAllData();
    } catch (err) { setError(err.message); }
  };

  const subjectsByClass = subjects.reduce((acc, sub) => {
    if (!acc[sub.className]) acc[sub.className] = [];
    acc[sub.className].push(sub);
    return acc;
  }, {});

  if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}>Loading admin panel...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '24px', color: '#1e293b', fontSize: 'clamp(1.2rem, 5vw, 1.7rem)' }}>Admin Control Panel</h1>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '20px', wordBreak: 'break-word' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '10px', cursor: 'pointer', background: 'none', border: 'none', color: '#c62828', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      <div className="scroll-x-tabs" style={{ marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        {['sections', 'subjects', 'users', 'allocations audit'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              minHeight: '44px',
              backgroundColor: activeTab === tab ? '#4CAF50' : '#f1f5f9',
              color: activeTab === tab ? 'white' : '#475569',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '6px 6px 0 0',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: '0.92rem'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'sections' && (
        <div className="responsive-grid-2" style={{ gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Create New Section</h2>
            <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Section Name (e.g., A, B, C)" value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                required />
              <input type="text" placeholder="Class Name (e.g., Class 10)" value={sectionForm.className}
                onChange={(e) => setSectionForm({ ...sectionForm, className: e.target.value })}
                required />
              <textarea placeholder="Description (optional)" value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                style={{ minHeight: '80px' }} />
              <button type="submit" style={{ padding: '12px', minHeight: '44px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Create Section
              </button>
            </form>
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Existing Sections</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {sections.map(section => (
                <div key={section._id} style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', wordBreak: 'break-word' }}>{section.className} - Section {section.name}</p>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#64748b', wordBreak: 'break-word' }}>{section.description || 'No description'}</p>
                  </div>
                  <button onClick={() => handleDeleteSection(section._id)} style={{ padding: '8px 14px', minHeight: '38px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="responsive-grid-2" style={{ gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Add Subject to a Class</h2>
            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Class Name (e.g., Class 10)" value={subjectForm.className}
                onChange={(e) => setSubjectForm({ ...subjectForm, className: e.target.value })}
                required />
              <input type="text" placeholder="Subject Name (e.g., Mathematics)" value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                required />
              <button type="submit" style={{ padding: '12px', minHeight: '44px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Add Subject
              </button>
            </form>
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Subjects by Class</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '500px', overflowY: 'auto' }}>
              {Object.keys(subjectsByClass).length === 0 ? (
                <p style={{ color: '#777', fontStyle: 'italic' }}>No subjects added yet.</p>
              ) : (
                Object.entries(subjectsByClass).map(([className, subs]) => (
                  <div key={className}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#475569' }}>{className}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {subs.map(sub => (
                        <div key={sub._id} style={{ padding: '10px 15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: '500', wordBreak: 'break-word' }}>{sub.name}</span>
                          <button onClick={() => handleDeleteSubject(sub._id)} style={{ padding: '6px 12px', minHeight: '34px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}>Delete</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>System Management Directory <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.95rem' }}>({users.length} total)</span></h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {users.map(u => (
              <div key={u._id} style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ wordBreak: 'break-word' }}>{u.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Role: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{u.role}</span> | Mobile: {u.mobileNo}</div>
                </div>
                <button onClick={() => handleDeRegisterUser(u._id)} style={{ padding: '8px 14px', minHeight: '38px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }}>Deregister</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'allocations audit' && (
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>Active Allocated System Pipelines</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allocations.map(alloc => (
              <div key={alloc._id} style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <strong>{alloc.className} - Section {alloc.section}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#475569', wordBreak: 'break-word' }}>
                  Subject: {alloc.subject || 'No Subject'} | Teacher: {alloc.teacher?.name || 'Unknown'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
