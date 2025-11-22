// src/Pages/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Card,
  ListGroup,
} from 'react-bootstrap';
import ChatRoom from './ChatRoom';
import { jwtDecode } from 'jwt-decode';


const API_BASE = 'http://localhost:5000/api';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  if (!token) return navigate('/login');

  let teacherId;
  try {
    teacherId = jwtDecode(token)._id;
  } catch {
    teacherId = null;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token,
  };

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [showChat, setShowChat] = useState(false);

  const [classForm, setClassForm] = useState({
    name: '',
    geofence: { latitude: '', longitude: '', radius: '' },
    schedule: { startTime: '', endTime: '' },
    startDate: '',
  });

  const [hwForm, setHwForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    classId: '',
  });

  useEffect(() => {
    fetch(`${API_BASE}/classes/getclass`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(setClasses)
      .catch(() => alert("Failed to load your classes"));
  }, []);


  const handleClassChange = e => {
    const { name, value } = e.target;

    if (name.startsWith("geofence.")) {
      const field = name.split(".")[1];
      setClassForm(f => ({
        ...f,
        geofence: { ...f.geofence, [field]: value }
      }));
    } else if (name.startsWith("schedule.")) {
      const field = name.split(".")[1];
      setClassForm(f => ({
        ...f,
        schedule: { ...f.schedule, [field]: value }
      }));
    } else {
      setClassForm(f => ({ ...f, [name]: value }));
    }
  };
const handleHwChange = (e) => {
  const { name, value } = e.target;
  setHwForm(prev => ({
    ...prev,
    [name]: value
  }));
};


  const submitClass = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/classes/createclass`, {
        method: "POST",
        headers,
        body: JSON.stringify(classForm),
      });

      if (!res.ok) throw new Error(await res.text());

      setClassForm({
        name: '',
        geofence: { latitude: '', longitude: '', radius: '' },
        schedule: { startTime: '', endTime: '' },
        startDate: ''
      });

      const updated = await fetch(`${API_BASE}/classes/getclass`, { headers }).then(r => r.json());
      setClasses(updated);

    } catch (err) {
      alert(err.message);
    }
  };


  const fetchAttendance = async (classId) => {
    try {
      const res = await fetch(`${API_BASE}/attendance/${classId}/logs`, { headers });
      if (!res.ok) throw new Error(await res.text());
      setAttendanceLogs(await res.json());

      const hwRes = await fetch(`${API_BASE}/homework/class/${classId}`, { headers });
      setHomeworks(hwRes.ok ? await hwRes.json() : []);

    } catch (err) {
      alert(err.message);
    }
  };


  const submitHomework = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/homework/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(hwForm),
      });

      if (!res.ok) throw new Error(await res.text());

      alert("Homework created!");
      setHwForm({ title: "", description: "", dueDate: "", classId: "" });

    } catch (err) {
      alert(err.message);
    }
  };


  return (
    <div style={styles.page}>

      {/* ================= NAVBAR ================= */}
      <nav style={styles.navbar}>
        <h3 style={styles.navBrand}>Teacher Dashboard</h3>

        <Button
          style={styles.greenBtnNav}
          onClick={() => navigate('/login')}
        >
          Logout
        </Button>
      </nav>


      {/* ================= MAIN CONTENT ================= */}
      <Container className="mt-5">
        <Row>

          {/* LEFT SIDE */}
          <Col md={4}>

            {/* CREATE CLASS */}
            <Card className="mb-4">
              <Card.Header>Create Class</Card.Header>
              <Card.Body>

                <Form onSubmit={submitClass}>
                  <Form.Group className="mb-2">
                    <Form.Label>Class Name</Form.Label>
                    <Form.Control name="name" value={classForm.name} onChange={handleClassChange} required />
                  </Form.Group>

                  {["latitude", "longitude", "radius"].map(f => (
                    <Form.Group key={f} className="mb-2">
                      <Form.Label>{f.toUpperCase()}</Form.Label>
                      <Form.Control
                        name={`geofence.${f}`}
                        value={classForm.geofence[f]}
                        onChange={handleClassChange}
                        required
                      />
                    </Form.Group>
                  ))}

                  {["startTime", "endTime"].map(f => (
                    <Form.Group key={f} className="mb-2">
                      <Form.Label>{f === "startTime" ? "Start Time" : "End Time"}</Form.Label>
                      <Form.Control
                        type="time"
                        name={`schedule.${f}`}
                        value={classForm.schedule[f]}
                        onChange={handleClassChange}
                        required
                      />
                    </Form.Group>
                  ))}

                  <Form.Group className="mb-2">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={classForm.startDate}
                      onChange={handleClassChange}
                      required
                    />
                  </Form.Group>

                  <Button type="submit" style={styles.greenBtnFull}>Create Class</Button>
                </Form>

              </Card.Body>
            </Card>


            {/* LIST CLASSES */}
            <Card>
              <Card.Header>My Classes</Card.Header>
              <Card.Body>
                <ListGroup>
                  {classes.map(c => (
                    <ListGroup.Item
                      key={c._id}
                      onClick={() => { setSelectedClassId(c._id); fetchAttendance(c._id); }}
                      style={{
                        cursor: "pointer",
                        backgroundColor: selectedClassId === c._id ? "#c8f7c5" : "white",
                        color: "black",
                        border: "1px solid #0a6b35",
                      }}
                    >
                      {c.name}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>

          </Col>

          {/* RIGHT SIDE */}
          <Col md={8}>

            {selectedClassId && (
              <>
                <h4>Attendance</h4>

                <Table bordered striped>
                  <thead>
                    <tr><th>Date</th><th>Student</th><th>Status</th></tr>
                  </thead>

                  <tbody>
                    {attendanceLogs.map(log => (
                      <tr key={log._id}>
                        <td>{new Date(log.date).toLocaleDateString()}</td>
                        <td>{log.student.name}</td>
                        <td>{log.present ? "Present" : "Absent"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>


                {/* HOMEWORKS */}
                <h4>Homeworks</h4>
                <ListGroup className="mb-4">
                  {homeworks.map(hw => (
                    <ListGroup.Item
                      key={hw._id}
                      onClick={() => navigate(`/teacher/homework/${hw._id}/submissions`)}
                      style={{ cursor: "pointer" }}
                    >
                      {hw.title} (Due: {new Date(hw.dueDate).toLocaleDateString()})
                    </ListGroup.Item>
                  ))}
                </ListGroup>


                {/* CREATE HOMEWORK */}
                <Card>
                  <Card.Header>Create Homework</Card.Header>
                  <Card.Body>

                    <Form onSubmit={submitHomework}>

                      <Form.Group className="mb-2">
                        <Form.Label>Title</Form.Label>
                        <Form.Control name="title" value={hwForm.title} onChange={handleHwChange} required />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" name="description" value={hwForm.description} onChange={handleHwChange} required />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Due Date</Form.Label>
                        <Form.Control type="date" name="dueDate" value={hwForm.dueDate} onChange={handleHwChange} required />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Class</Form.Label>
                        <Form.Select name="classId" value={hwForm.classId} onChange={handleHwChange} required>
                          <option value="">Select</option>
                          {classes.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Button type="submit" style={styles.greenBtnFull}>Create Homework</Button>

                    </Form>

                  </Card.Body>
                </Card>

                <Button className="mt-3" style={styles.greenBtnFull} onClick={() => setShowChat(true)}>
                  Open Chat
                </Button>

                {showChat && (
                  <ChatRoom
                    classCode={selectedClassId}
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




// ===================== INLINE STYLE ======================
const styles = {
  page: {
    minHeight: "150vh",
    backgroundColor: "#f2f2f2",
  },

  navbar: {
    width: "100%",
    height: "60px",
    backgroundColor: "#064420",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0px 20px",
    color: "white",
  },

  navBrand: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
  },

  greenBtnNav: {
    backgroundColor: "#0a6b35",
    border: "none",
    color: "white",
  },

  greenBtnFull: {
    backgroundColor: "#0a6b35",
    border: "none",
    width: "100%",
    color: "white",
  },
};

