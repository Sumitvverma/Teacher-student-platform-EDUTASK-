// src/Pages/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate }                 from 'react-router-dom';
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
import {jwtDecode}   from 'jwt-decode';





 let teacherId;
  try {
    teacherId = token ? jwtDecode(token)._id : null;
  } catch {
    teacherId = null;
  }



const API_BASE = 'http://localhost:5000/api';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  if (!token) return navigate('/login');

  const headers = {
    'Content-Type':  'application/json',
    'Authorization': token,
  };

  // ── State ──────────────────────────────────────────────────────────────────────
  const [classes, setClasses]                 = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [attendanceLogs, setAttendanceLogs]   = useState([]);
  const [homeworks,      setHomeworks]      = useState([]);   
  const [showChat, setShowChat] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    geofence: { latitude: '', longitude: '', radius: '' },
    schedule: { startTime: '', endTime: '' },
    startDate: '',
  });

  const [hwForm, setHwForm] = useState({
    title: '', description: '', dueDate: '', classId: '',
  });

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch teacher’s classes
    fetch(`${API_BASE}/classes/getclass`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(setClasses)
      .catch(err => alert('Fetch classes failed: ' + err.message));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  // Create a new class
  const handleClassChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('geofence.')) {
      const field = name.split('.')[1];
      setClassForm(f => ({
        ...f,
        geofence: { ...f.geofence, [field]: value },
      }));
    } else if (name.startsWith('schedule.')) {
      const field = name.split('.')[1];
      setClassForm(f => ({
        ...f,
        schedule: { ...f.schedule, [field]: value },
      }));
    } else {
      setClassForm(f => ({ ...f, [name]: value }));
    }
  };

 const handleShowChat = () => setShowChat(true);

  const submitClass = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/classes/createclass`, {
        method: 'POST',
        headers,
        body: JSON.stringify(classForm),
      });
      if (!res.ok) throw new Error(await res.text() || res.statusText);
      setClassForm({
        name: '',
        geofence: { latitude: '', longitude: '', radius: '' },
        schedule: { startTime: '', endTime: '' },
      });
      // refresh list
      const updated = await fetch(`${API_BASE}/classes/getclass`, { headers }).then(r => r.json());
      setClasses(updated);
    } catch (err) {
      alert('Create class failed: ' + err.message);
    }
  };

  // Select a class and load its attendance
  const fetchAttendance = async classId => {
    try {
      const res = await fetch(`${API_BASE}/attendance/${classId}/logs`, { headers });
      if (!res.ok) throw new Error(await res.text() || res.statusText);
      const data = await res.json();
      setAttendanceLogs(data);

    const hwRes = await fetch(`${API_BASE}/homework/class/${classId}`, { headers });
    if (!hwRes.ok) throw new Error(await hwRes.text() || hwRes.statusText);
    const hwData = await hwRes.json();
    setHomeworks(hwData);

    } catch (err) {
      alert('Fetch attendance failed: ' + err.message);
    }
  };







  // Homework form change
  const handleHwChange = e => {
    const { name, value } = e.target;
    setHwForm(f => ({ ...f, [name]: value }));
  };

  // Submit new homework
  const submitHomework = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/homework/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(hwForm),
      });
      if (!res.ok) throw new Error(await res.text() || res.statusText);
      alert('Homework created!');
      setHwForm({ title:'', description:'', dueDate:'', classId:'' });
    } catch (err) {
      alert('Create homework failed: ' + err.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <Container className="mt-4">
        <Row>

          {/* Left: create class + list */}
          <Col md={4}>
            {/* Create Class */}
            <Card className="mb-4">
              <Card.Header>Create New Class</Card.Header>
              <Card.Body>
                <Form onSubmit={submitClass}>
                  <Form.Group className="mb-2">
                    <Form.Label>Class Name</Form.Label>
                    <Form.Control
                      name="name"
                      value={classForm.name}
                      onChange={handleClassChange}
                      required
                    />
                  </Form.Group>

                  {['latitude','longitude','radius'].map(fld => (
                    <Form.Group key={fld} className="mb-2">
                      <Form.Label>
                        {fld.charAt(0).toUpperCase() + fld.slice(1)}
                      </Form.Label>
                      <Form.Control
                        name={`geofence.${fld}`}
                        value={classForm.geofence[fld]}
                        onChange={handleClassChange}
                        required
                      />
                    </Form.Group>
                  ))}

                  {['startTime','endTime'].map(fld => (
                    <Form.Group key={fld} className="mb-2">
                      <Form.Label>
                        {fld === 'startTime' ? 'Start Time' : 'End Time'}
                      </Form.Label>
                      <Form.Control
                        type="time"
                        name={`schedule.${fld}`}
                        value={classForm.schedule[fld]}
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

                  <Button type="submit">Create Class</Button>
                </Form>
              </Card.Body>
            </Card>

            {/* List Classes */}
            <Card>
              <Card.Header>All My Classes</Card.Header>
              <Card.Body>
                <ListGroup>
                  {classes.map(c => (
                    <ListGroup.Item
                      key={c._id}
                      action
                      active={c._id === selectedClassId}
                      onClick={() => {
                        setSelectedClassId(c._id);
                        fetchAttendance(c._id);
                      }}
                    >
                      {c.name}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Right: attendance + create homework */}
          <Col md={8}>
            {selectedClassId && (
              <>
                <h4>
                  Attendance for{' '}
                  {classes.find(c => c._id === selectedClassId)?.name}
                </h4>
                <Table striped bordered hover>
                  <thead>
                    <tr><th>Date</th><th>Student</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map(log => (
                      <tr key={log._id}>
                        <td>{new Date(log.date).toLocaleDateString()}</td>
                        <td>{log.student.name}</td>
                        <td>{log.present ? 'Present' : 'Absent'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              <h4>Homeworks</h4>
             <ListGroup className="mb-4">
               {homeworks.map(hw => (
                <ListGroup.Item
                key={hw._id}
                 action
                onClick={() => navigate(`/teacher/homework/${hw._id}/submissions`)}
                  >
                 {hw.title} (Due Date :- {new Date(hw.dueDate).toLocaleDateString()})
                 </ListGroup.Item>
                  ))}
               </ListGroup>

                <Card className="mt-4">
                  <Card.Header>Create Homework</Card.Header>
                  <Card.Body>
                    <Form onSubmit={submitHomework}>
                      <Form.Group className="mb-2">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          name="title"
                          value={hwForm.title}
                          onChange={handleHwChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="description"
                          value={hwForm.description}
                          onChange={handleHwChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Due Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="dueDate"
                          value={hwForm.dueDate}
                          onChange={handleHwChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Class</Form.Label>
                        <Form.Select
                          name="classId"
                          value={hwForm.classId}
                          onChange={handleHwChange}
                          required
                        >
                          <option value="">Select Class</option>
                          {classes.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Button
                        type="submit"
                        disabled={
                          !hwForm.title ||
                          !hwForm.description ||
                          !hwForm.dueDate ||
                          !hwForm.classId
                        }
                      >
                        Create Homework
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              
              <Button onClick={() => setShowChat(true)}>Open Chat</Button>
           {showChat && (
  <ChatRoom
    classCode={classes.find(c=>c._id===selectedClassId)._id}
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

const styles = {
  container: {
    minHeight: '200vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: '20px',
  }
};
