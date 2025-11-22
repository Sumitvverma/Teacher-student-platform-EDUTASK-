// src/components/ChatRoom.jsx
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, Button, Form, Spinner } from 'react-bootstrap';
import {jwtDecode} from 'jwt-decode';

const SOCKET_URL = 'http://localhost:5000';
const API_BASE   = 'http://localhost:5000/api';

export default function ChatRoom({ classCode, userName: propUserName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [inputDisabled, setInputDisabled]   = useState(false);
  const [banUntil, setBanUntil]             = useState(null);
  const bottomRef = useRef();
  const socketRef = useRef(null);
  const [openForMessage, setOpenForMessage] = useState(null);

  
  let token = localStorage.getItem('token');
  let tokenName = null;
  let user='teacher';
  try {
    if (token) {
      const decoded = jwtDecode(token);

      tokenName = decoded.name || decoded.email || decoded._id || decoded.id;
      user=decoded.role;
    }
  } catch (e) {
    tokenName = null;
  }
  
  const userName = propUserName || tokenName || 'Anonymous';

  // helper to normalize incoming messages
  function normalizeMsg(m) {
    return {
      senderName: m.senderName ?? m.sender ?? 'Unknown',
      text:       m.text ?? m.message ?? '',
      timestamp:  m.timestamp ?? m.createdAt ?? new Date().toISOString()
    };
  }

  // 1. Load chat history
  useEffect(() => {
    setLoadingHistory(true);
    fetch(`${API_BASE}/chat/${encodeURIComponent(classCode)}/history`, {
      headers: { 'Content-Type': 'application/json', Authorization: token || '' }
    })
      .then(res => {
        if (!res.ok) throw new Error('No history endpoint or failed to load');
        return res.json();
      })
      .then(history => {
        if (Array.isArray(history)) {
          setMessages(history.map(normalizeMsg));
        }
      })
      .catch(() => {
  
      })
      .finally(() => setLoadingHistory(false));
  }, [classCode]);





//Create socket when component mounts; cleanup on unmount
  useEffect(() => {
    
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: token || '' }, // optional: send token in auth
      autoConnect: true
    });
    socketRef.current = s;

    // join room with senderName (so server can key moderation by name or id)
    s.emit('join-classroom', { classCode, senderName: userName });

    const onReceive = (msg) => {
      setMessages(prev => [...prev, normalizeMsg(msg)]);
    };
    
    const onSystem = (txt) =>{
      setMessages(prev => [...prev, { senderName: 'System', text: txt, timestamp: new Date().toISOString() }]);
    };
  
    const onBan = (payload) => {
      let until = null, reason = 'Violation';
      if (payload && typeof payload === 'object') {
        until = payload.until ? new Date(payload.until) : null;
        reason = payload.reason || reason;
      } else if (typeof payload === 'string') {
        reason = payload;
      }
      setBanUntil(until);
      setInputDisabled(true);
      const untilStr = until ? until.toLocaleString() : 'unknown';
      setMessages(prev => [...prev, { senderName: 'System', text: `Banned until ${untilStr}. Reason: ${reason}`, timestamp: new Date().toISOString() }]);
    };

    s.on('receive-message', onReceive);
    s.on('system-message', onSystem);
    s.on('ban-notice', onBan);

    // cleanup
    return () => {
      try {
        s.emit('leave-classroom', { classCode, senderName: userName });
      } catch (e) {}
      s.off('receive-message', onReceive);
      s.off('system-message', onSystem);
      s.off('ban-notice', onBan);
      s.disconnect();
    };
    
  }, [classCode, token, userName]);

  // auto-scroll on messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // send message
  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || inputDisabled) return;
    const msg = {
      classCode,
      senderName: userName,
      text:        trimmed,
      timestamp:   new Date().toISOString()
    };
  
    socketRef.current?.emit('send-message', msg);
  
    setMessages(prev => [...prev, msg]);
    setText('');
  };

// Add this helper function at the top (inside component)
const banUser = async (targetUserId, minutes = 10) => {
  await fetch('http://localhost:5000/api/chat-admin/ban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: targetUserId, minutes })
  });
};

const unbanUser = async (targetUserId) => {
  await fetch('http://localhost:5000/api/chat-admin/unban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: targetUserId })
  });
};





  return (
    <Card className="mt-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Chat — Class {classCode}</h5>
        <div>
          {banUntil && <small className="me-2 text-danger">Banned until: {banUntil.toLocaleString()}</small>}
          <Button variant="outline-secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </Card.Header>

      <Card.Body style={{ height: 320, overflowY: 'auto' }}>
        {loadingHistory ? (
          <div className="d-flex justify-content-center my-4"><Spinner animation="border" /></div>
        ) : (
     messages.map((m, i) => (
        <div key={i} className="mb-2">
          <strong
            onClick={() => setOpenForMessage(prev => (prev === i ? null : i))}
            style={{ cursor: "pointer" }}
          >
            {m.senderName}:
          </strong>{" "}
          {m.text}
          <div style={{ fontSize: "0.75em", color: "#666" }}>
            {new Date(m.timestamp).toLocaleTimeString()}
          </div>
          {user === "teacher" && openForMessage === i && (
            <div>
              <Button size="sm" variant="danger" onClick={() => banUser(m.senderName)}>
                Ban
              </Button>{" "}
              <Button size="sm" variant="success" onClick={() => unbanUser(m.senderName)}>
                Unban
              </Button>
            </div>
          )}
        </div>
      ))
        )}
        <div ref={bottomRef} />
      </Card.Body>

      <Card.Footer className="d-flex">
        <Form.Control
          placeholder={inputDisabled ? "You are temporarily banned" : "Type a message..."}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          className="me-2"
          disabled={inputDisabled}
        />
        <Button onClick={sendMessage} disabled={inputDisabled}>Send</Button>
      </Card.Footer>
    </Card>
  );
}
