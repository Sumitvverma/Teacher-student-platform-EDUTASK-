import React, { useEffect, useState } from 'react';
import { useNavigate }                  from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Button,
  ListGroup,
  Table,
  Card
} from 'react-bootstrap';
import {jwtDecode}                        from 'jwt-decode';

import ChatRoom from './ChatRoom';
let pp;
const API_BASE = 'http://localhost:5000/api';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem('token');

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

  const [view, setView]                   = useState('all');
  const [availableClasses, setAvailable]  = useState([]);
  const [joinedClasses, setJoined]        = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [homeworks, setHomeworks]         = useState([]);
  const [submissionLookup, setLookup]     = useState({});
  const [attendanceMarked, setAttendanceMarked] = useState({});
const [attendanceLogs, setAttendanceLogs]       = useState([]);
const [attendancePercentage, setAttendancePercentage] = useState(null);
const [showChat, setShowChat] = useState(false);

function countWorkingDays(startDate) {
  const start = new Date(startDate);
  const end   = new Date(); 
  console.log(end,"fffff",start);
  let count   = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const day = d.getDay();
     if (day !== 0 && day !== 6) count++;
  }
  return count;
}

 const handleShowChat = () => setShowChat(true);
const fetchAttendance = async (selClass) => {
  try {
    const res  = await fetch(`${API_BASE}/attendance/${selClass._id}/logs`, { headers });
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    setAttendanceLogs(data);


const decoded = jwtDecode(token);
const userid=decoded.id;
    console.log(userid,"sid") ;
    const presentLogs = data.filter(
      log => log.student._id === userid            
    ).length;

    pp=presentLogs;
    const totalDays = selClass.startDate
      ? countWorkingDays(selClass.startDate)
      : 0;
console.log(totalDays,"tday",presentLogs,"pdays");
    
     const pct = totalDays > 0
      ? Math.round((presentLogs / totalDays) * 100)
      : 0;

    setAttendancePercentage(pct);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


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
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ classCode: code }) 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Join class failed:", errorText);
      alert("Failed to join class. Please check the code and try again.");
      return;
    }

    const data = await fetch(`${API_BASE}/classes/getclass`, { headers })
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);

    setJoined(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error joining class:", err);
    alert("An error occurred. Please try again later.");
  }
};


  const selectClass = async cls => {
    setSelectedClass(cls);
   
    const hwList = await fetch(`${API_BASE}/homework/class/${cls._id}`, { headers })
      .then(res => (res.ok ? res.json() : []))
      .catch(() => []);
       console.log(cls,"refefergfrg");
        fetchAttendance(cls);
    setHomeworks(Array.isArray(hwList) ? hwList : []);

    const lookup = {};
    hwList.forEach(hw => {
      const submissions = Array.isArray(hw.submissions) ? hw.submissions : [];
      const mine = submissions.find(s => s.student === studentId);
      lookup[hw._id] = { submitted: Boolean(mine), grade: mine?.grade ?? null };
    });
    setLookup(lookup);
  };
const markAttendance = (classId) => {
    if (!navigator.geolocation) {
      return alert('Geolocation not supported');
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `${API_BASE}/attendance/${classId}/mark`,
            {
              method: 'POST', headers,
              body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude })
            }
          );
          const data = await res.json();
          if (data.success) {
            alert('Attendance marked');
            setAttendanceMarked(prev => ({ ...prev, [classId]: true }));
          } else throw new Error(data.error || 'Mark failed');
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      },
      (err) => {
        console.error(err);
        alert('Location error');
      }
    );
  };











  const listToShow = Array.isArray(view === 'all' ? availableClasses : joinedClasses)
    ? (view === 'all' ? availableClasses : joinedClasses)
    : [];

  return (
    <div style={styles.container}>
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <Button variant={view==='all'?'primary':'outline-primary'} onClick={()=>setView('all')} className="me-2">All Classes</Button>
          <Button variant={view==='joined'?'primary':'outline-primary'} onClick={()=>setView('joined')}>Joined Classes</Button>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <ListGroup>
            {listToShow.map(cls => (
              <ListGroup.Item key={cls._id} active={selectedClass?._id===cls._id} onClick={()=>selectClass(cls)}>
                {cls.name}
                {view  && !(view==='joined') && (
                  <Button as="div" size="sm" className="float-end" onClick={e=>{e.stopPropagation();joinClass(cls._id);}}>
                    Join
                  </Button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={8}>
          {selectedClass && view==='joined' &&(
            <>
              <h4>{selectedClass.name}</h4>
              <Card className="mb-3">
                <Card.Header>Homeworks</Card.Header>
                <Card.Body>
                  <Table striped bordered>
                    <thead><tr><th>Title</th><th>Due</th><th>Grade</th><th>Action</th></tr></thead>
                    <tbody>
                      {homeworks.map(hw => (
                        <tr key={hw._id}>
                          <td>{hw.title}</td>
                          <td>{new Date(hw.dueDate).toLocaleDateString()}</td>
                          <td>{submissionLookup[hw._id]?.submitted ? (submissionLookup[hw._id].grade ?? 'Pending') : '—'}</td>
                          <td>
                            {submissionLookup[hw._id]?.submitted ? <span>Submitted</span> : (
                              <Button size="sm" onClick={()=>navigate(`/homework-dashboard/${hw._id}`)}>Open</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

                 <Card>
                <Card.Header>Attendance</Card.Header>
                <Card.Body>
                  <Button size="sm" onClick={()=>markAttendance(selectedClass._id)}>
                    Mark Attendance
                  </Button>
                </Card.Body>
              </Card>
{attendancePercentage !== null  && view=='joined'  && (
  <p className="mt-2">
    Your attendance: <strong>{attendancePercentage}%</strong> (
    {pp}
    {' / '}
    {countWorkingDays(selectedClass.startDate)} days)
  </p>
)}

<Button onClick={() => setShowChat(true)} className="mt-3">
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




const styles = {
  container: {
    height: "200vh",
    display: "flex",
    justifyContent: "center",  
    alignItems: "center",      
    backgroundColor: "#f2f2f2",
  },
  form: {
    padding: "20px",
    backgroundColor: "white",
    boxShadow: "0 0 10px rgba(7, 8, 3, 0.1)",
    borderRadius: "8px"
  }
};

