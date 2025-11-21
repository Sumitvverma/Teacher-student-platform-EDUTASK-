// src/Pages/HomeworkSubmissions.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Table,
  Button,
  Form,
  Card,
} from 'react-bootstrap';

const API_BASE = 'http://localhost:5000/api';

export default function HomeworkSubmissions() {
  const { hwId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token,
  };

  const [submissions, setSubmissions] = useState([]);
  const [grading, setGrading] = useState({}); // { subId: gradeValue }

  // Fetch submissions for this homework
  useEffect(() => {
    async function fetchSubs() {
      try {
        const res = await fetch(`${API_BASE}/homework/homework/${hwId}/submissions`, { headers });
        if (!res.ok) throw new Error('Failed to load submissions');
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    }
    fetchSubs();
  }, [hwId, token]);

  // Handle input change for grade
  const handleGradeChange = (subId, value) => {
    setGrading(g => ({ ...g, [subId]: value }));
  };

  // Submit grade
  const submitGrade = async (subId) => {
    const grade = grading[subId];
    if (grade === undefined || grade === '') {
      alert('Enter a grade');
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/homework/${hwId}/${subId}/grade`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ grade }),
        }
      );
      if (!res.ok) throw new Error('Grade submission failed');
      // Remove graded submission from list
      setSubmissions(s => s.filter(sub => sub._id !== subId));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <Button variant="link" onClick={() => navigate(-1)}>&lt; Back</Button>
          Submissions for Homework
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Student</th>
                <th>Content</th>
                <th>Submitted At</th>
                <th>Assign Grade</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub._id}>
                  <td>{sub.student.name}</td>
                  <td>{sub.content}</td>
                  <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                  <td style={{ minWidth: 160 }}>
                    <Form.Control
                      type="text"
                      placeholder="Grade"
                      value={grading[sub._id] || ''}
                      onChange={e => handleGradeChange(sub._id, e.target.value)}
                      className="d-inline-block w-auto me-2"
                    />
                    <Button
                      size="sm"
                      onClick={() => submitGrade(sub._id)}
                    >
                      Submit
                    </Button>
                   {sub.grade && (
             <div>Assigned Grade: {sub.grade}</div>
                )}

                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">
                    No pending submissions.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}
