import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Button,
  ListGroup,
  Table,
  Card
} from 'react-bootstrap';


import { jwtDecode } from 'jwt-decode';

import ChatRoom from './ChatRoom';

let pp;
const API_BASE = 'http://localhost:5000/api';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  let studentId;
  try {
    studentId = token ? jwtDecode(token)._id : null;
  } catch {
    studentId = null;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  const [view, setView] = useState('all');
  const [availableClasses, setAvailable] = useState([]);
  const [joinedClasses, setJoined] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [submissionLookup, setLookup] = useState({});
  const [attendanceMarked, setAttendanceMarked] = useState({});
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendancePercentage, setAttendancePercentage] = useState(null);
  const [showChat, setShowChat] = useState(false);

  function countWorkingDays(startDate) {
    const start = new Date(startDate);
    const end = new Date();
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return count;
  }

  const fetchAttendance = async (selClass) => {
    try {
      const res = await fetch(`${API_BASE}/attendance/${selClass._id}/logs`, { headers });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setAttendanceLogs(data);

      const decoded = jwtDecode(token);
      const userid = decoded.id;

      const presentLogs = data.filter(log => log.student._id === userid).length;
      pp = presentLogs;

      const totalDays = selClass.startDate ? countWorkingDays(selClass.startDate) : 0;
      const pct = totalDays > 0
        ? Math.round((presentLogs / totalDays) * 100)
        : 0;

      setAttendancePercentage(pct);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Fetch class data
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/classes/getAllclasses`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAvailable(Array.isArray(data) ? data : []))
      .catch(() => setAvailable([]));

    fetch(`${API_BASE}/classes/getclass`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setJoined(Array.isArray(data) ? data : []))
      .catch(() => setJoined([]));
  }, [token]);


  const joinClass = async (classId) => {
    const code = prompt("Enter class code:");
    if (!code) return;

    try {
      const response = await fetch(`${API_BASE}/classes/${classId}/join`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ classCode: code })
      });

      if (!response.ok) {
        alert("Failed to join class. Please check the code.");
        return;
      }

      const data = await fetch(`${API_BASE}/classes/getclass`, { headers })
        .then(res => res.ok ? res.json() : [])
        .catch(() => []);

      setJoined(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("Error joining class.");
    }
  };


  const selectClass = async cls => {
    setSelectedClass(cls);

    const hwList = await fetch(`${API_BASE}/homework/class/${cls._id}`, { headers })
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);

    fetchAttendance(cls);
    setHomeworks(hwList || []);

    const lookup = {};
    hwList.forEach(hw => {
      const mine = hw.submissions?.find(s => s.student === studentId);
      lookup[hw._id] = { submitted: Boolean(mine), grade: mine?.grade ?? null };
    });

    setLookup(lookup);
  };


  const markAttendance = (classId) => {
    if (!navigator.geolocation) return alert('Geolocation not supported');

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `${API_BASE}/attendance/${classId}/mark`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude })
            }
          );

          const data = await res.json();
          if (data.success) {
            alert('Attendance marked');
            setAttendanceMarked(prev => ({ ...prev, [classId]: true }));
          } else throw new Error(data.error || 'Mark failed');
        } catch (err) {
          alert(err.message);
        }
      }
    );
  };


  const listToShow = view === 'all' ? availableClasses : joinedClasses;

  return (
    <div style={styles.page}>

      {/* ==================== NAV BAR ==================== */}
      <nav style={styles.navbar}>
        <h3 style={styles.navBrand}>Student Dashboard</h3>
        <Button style={styles.navButton} onClick={() => navigate('/login')}>
          Logout
        </Button>
      </nav>

      {/* ==================== MAIN CONTENT ==================== */}
      <Container className="mt-5">
        <Row className="mb-3">
          <Col>
            <Button style={styles.greenBtn} onClick={() => setView('all')} className="me-2">
              All Classes
            </Button>

            <Button style={styles.greenBtn} onClick={() => setView('joined')}>
              Joined Classes
            </Button>
          </Col>
        </Row>

        <Row>
          {/* CLASS LIST */}
          <Col md={4}>
            <ListGroup>
      {listToShow.map(cls => (
               <ListGroup.Item
  key={cls._id}
  onClick={() => selectClass(cls)}
  style={{
    cursor: "pointer",
    backgroundColor: selectedClass?._id === cls._id ? "#c8f7c5" : "white", 
    color: selectedClass?._id === cls._id ? "black" : "black",
    border: "1px solid #0a6b35",
    borderRadius: "5px",
  }}
>

                  {cls.name}
                  {view !== 'joined' && (
                    <Button
                      size="sm"
                      style={styles.greenBtnSm}
                      className="float-end"
                      onClick={e => {
                        e.stopPropagation();
                        joinClass(cls._id);
                      }}
                    >
                      Join
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>

          {/* HOMEWORK + ATTENDANCE */}
          <Col md={8}>
            {selectedClass && view === 'joined' && (
              <>
                <h4>{selectedClass.name}</h4>

                {/* Homeworks */}
                <Card className="mb-3">
                  <Card.Header>Homeworks</Card.Header>
                  <Card.Body>
                    <Table striped bordered>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Due</th>
                          <th>Grade</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {homeworks.map(hw => (
                          <tr key={hw._id}>
                            <td>{hw.title}</td>
                            <td>{new Date(hw.dueDate).toLocaleDateString()}</td>
                            <td>{submissionLookup[hw._id]?.submitted ? (submissionLookup[hw._id].grade ?? 'Pending') : '—'}</td>

                            <td>
                              {submissionLookup[hw._id]?.submitted ? (
                                <span>Submitted</span>
                              ) : (
                                <Button
                                  size="sm"
                                  style={styles.greenBtnSm}
                                  onClick={() => navigate(`/homework-dashboard/${hw._id}`)}
                                >
                                  Open
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>

                {/* Attendance */}
                <Card>
                  <Card.Header>Attendance</Card.Header>
                  <Card.Body>
                    <Button size="sm" style={styles.greenBtnSm} onClick={() => markAttendance(selectedClass._id)}>
                      Mark Attendance
                    </Button>
                  </Card.Body>
                </Card>

                {attendancePercentage !== null && (
                  <p className="mt-2">
                    Attendance: <strong>{attendancePercentage}%</strong> (
                    {pp} / {countWorkingDays(selectedClass.startDate)} days)
                  </p>
                )}

                {/* Chat Button */}
                <Button style={styles.greenBtn} className="mt-3" onClick={() => setShowChat(true)}>
                  Ask Doubt (Chat)
                </Button>

                {showChat && (
                  <ChatRoom
                    classCode={selectedClass._id}
                    onClose={() => setShowChat(false)}
                  />
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}




// ==================== INLINE STYLING ==================== //
const styles = {
  page: {
    minHeight: "150vh",
    backgroundColor: "#f2f2f2",
  },

  navbar: {
    width: "100%",
    height: "60px",
    backgroundColor: "#064420",   // Dark Green
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0px 20px",
    color: "white",
  },

  navBrand: {
    margin: 0,
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
  },

  navButton: {
    backgroundColor: "#0a6b35",
    border: "none",
    color: "white",
  },

  greenBtn: {
    backgroundColor: "#0a6b35",
    border: "none",
    color: "white",
    width: "140px",
  },

  greenBtnSm: {
    backgroundColor: "#0a6b35",
    border: "none",
    color: "white",
    padding: "3px 10px",
  }
};

