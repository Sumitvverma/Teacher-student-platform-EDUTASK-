import React, { useEffect, useState } from 'react';
import { useParams, useNavigate }       from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

export default function HomeworkDashboard() {
  const { hwId } = useParams();
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  const headers = { 'Content-Type': 'application/json', 'Authorization': token };
  const [hw, setHw]               = useState(null);
  const [content, setContent]     = useState('');
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/homework/homework/${hwId}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load homework (status ${res.status})`);
        return res.json();
      })
      .then(data => {
        setHw(data);
        if (data.mySubmission?.content) setContent(data.mySubmission.content);
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [hwId, token, navigate]);

  const handleSubmit = async () => {
    if (!content.trim()) return alert('Please enter something');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/homework/${hwId}/submit`, {
        method: 'POST', headers, body: JSON.stringify({ content })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Submit failed (status ${res.status})`);
      // re-fetch updated homework
      window.location.reload()
      const reloaded = await fetch(`${API_BASE}/homework/${hwId}`, { headers })
        .then(r => {
          if (!r.ok) throw new Error(`Homework Submitted`);
          return r.json();
        });
      setHw(reloaded);
      alert('Submitted successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!hw)     return <p>Homework not found.</p>;

  return (
    <div className="container py-4" style={{ maxWidth: '600px' }}>
      <h2 className="mb-3">{hw.title}</h2>
      <p><strong>Due:</strong> {new Date(hw.dueDate).toLocaleString()}</p>
      <p>{hw.description}</p>

      {hw.mySubmission ? (
        <div className="mt-4">
          <h5>Your Submission</h5>
          <pre className="p-3 bg-light">{hw.mySubmission.content}</pre>
          <h5 className="mt-3">Grade</h5>
          <p>{hw.mySubmission.status ? hw.mySubmission.grade : 'Pending teacher grading'}</p>
        </div>
      ) : (
        <div className="mt-4">
          <h5>Submit Your Work</h5>
          <textarea
            className="form-control mb-3"
            rows={6}
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={submitting}
          />
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={submitting}
          >{submitting ? 'Submitting…' : 'Submit'}</button>
        </div>
      )}
    </div>
  );
}