// server.js
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');

// try require bad-words; fallback to simple regex if it fails
let Filter;
try {
  Filter = require('bad-words');
} catch (err) {
  Filter = null;
  console.warn('bad-words require failed — using fallback profanity checker');
}

const filter = Filter
  ? new Filter()
  : {
      badRegex: /\b(?:fuck|shit|bitch|asshole|damn)\b/ig,
      isProfane(text) { return this.badRegex.test(String(text)); },
      clean(text) { return String(text).replace(this.badRegex, m => '*'.repeat(m.length)); }
    };

// models & routes (assumes these files exist in your project)
const Message = require('./models/Message');
const Moderation = require('./models/Moderation');

const authRoutes       = require('./routes/authroutes');
const classRoutes      = require('./routes/classroutes');
const attendanceRoutes = require('./routes/attendanceroutes');
const homeworkRoutes   = require('./routes/homeworkroutes');
const chatAdminRoutes  = require('./routes/banning');   
const chatController   = require('./controller/Chats');  
const moderationStore  =require('./utils/db.js');
const app    = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// moderation config
const STRIKE_THRESHOLD = Number(process.env.STRIKE_THRESHOLD) || 3;
const BAN_DURATION_MS  = Number(process.env.BAN_DURATION_MS) || 10 * 60 * 1000; // 10 minutes


global.moderationStore = moderationStore; // allow other modules to reference

function getKey(senderName) {
  if (senderName) return `name:${senderName}`;
}

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-classroom', (payload) => {
    // payload: string classCode or { classCode, senderName, userId }
    console.log(payload);
    let classCode, senderName;
    if (typeof payload === 'string') classCode = payload;
    else if (payload && typeof payload === 'object') {
      classCode  = payload.classCode || payload.room;
      senderName = payload.senderName;
    }
    if (!classCode) return;

    const key = getKey(senderName);
    const now = Date.now();
    const entry = moderationStore[key];

    // check in-memory ban first
    if (entry && entry.bannedUntil && entry.bannedUntil > now) {
      socket.emit('ban-notice', { until: entry.bannedUntil, reason: 'You are temporarily banned' });
      return;
    }

    // check persisted ban (DB)
    (async () => {
      try {
        const modDB = senderName ? await Moderation.findOne({ userId:senderName }) : null;
        if (modDB && modDB.bannedUntil && new Date(modDB.bannedUntil).getTime() > now) {
          // persist in-memory too
          moderationStore[key] = {
            strikes: modDB.strikes || 0,
            bannedUntil: new Date(modDB.bannedUntil).getTime(),
            lastStrike: modDB.lastStrike ? new Date(modDB.lastStrike).getTime() : null
          };
          
          socket.emit('ban-notice', { until: modDB.bannedUntil, reason: 'You are temporarily banned' });
          return;
        }

        socket.join(classCode);
        console.log(`Socket ${socket.id} joined room ${classCode} (key=${key})`);
        socket.emit('system-message', `Joined class ${classCode}`);
      } catch (err) {
        console.warn('Error checking persistent moderation on join:', err);
        socket.join(classCode);
        socket.emit('system-message', `Joined class ${classCode}`);
      }
    })();
  });

  // send-message -> payload: { classCode, senderName, text, userId }
  socket.on('send-message', async (payload) => {
    try {
      if (!payload) return;
      const { classCode, senderName, text } = payload;
      if (!classCode || typeof text === 'undefined') return;

      const now = Date.now();

      // 1) check DB moderation record (prefer userId)
      let dbMod = null;
      try {
        if (senderName) dbMod = await Moderation.findOne({ userId:senderName });
      } catch (err) {
        console.warn('Moderation DB lookup failed:', err);
      }
      if (dbMod && dbMod.bannedUntil && new Date(dbMod.bannedUntil).getTime() > now) {
        socket.emit('chat-error', 'You are banned from sending messages');
        return;
      }

      // 2) in-memory entry
      const key = getKey( senderName);
      const entry = moderationStore[key] || { strikes: 0, bannedUntil: null, lastStrike: null };

      if (entry.bannedUntil && entry.bannedUntil > now) {
        socket.emit('ban-notice', { until: entry.bannedUntil, reason: 'Temporary ban' });
        return;
      }

      // 3) profanity detection
      let violationDetected = false;
      try {
        violationDetected = filter && typeof filter.isProfane === 'function' ? filter.isProfane(text) : false;
      } catch (err) {
        console.warn('Profanity check error:', err);
        violationDetected = false;
      }

      if (violationDetected) {
        // increment strikes
        entry.strikes = (entry.strikes || 0) + 1;
        entry.lastStrike = now;
        moderationStore[key] = entry;

        // persist strike to DB (upsert)
        try {
          const filterQuery =  (senderName ? { userId:senderName } : null);
          if (filterQuery) {
            await Moderation.findOneAndUpdate(filterQuery, {
              $inc: { strikes: 1 },
              $set: { lastStrike: new Date(now) }
            }, { upsert: true, new: true });
          }
        } catch (err) {
          console.warn('Failed to persist strike to DB:', err);
        }

        // ban if threshold reached
        if (entry.strikes >= STRIKE_THRESHOLD) {
          entry.bannedUntil = now + BAN_DURATION_MS;
          moderationStore[key] = entry;

          // persist ban to DB
          try {
            const filterQuery =(senderName ? { userId:senderName } : null);
            if (filterQuery) {
              await Moderation.findOneAndUpdate(filterQuery, {
                $set: { bannedUntil: new Date(entry.bannedUntil), strikes: 0 }
              }, { upsert: true, new: true });
            }
          } catch (err) {
            console.warn('Failed to persist ban to DB:', err);
          }

          io.to(classCode).emit('system-message', `${senderName || 'A user'} has been temporarily banned for abusive language.`);
          socket.emit('ban-notice', { until: entry.bannedUntil, reason: 'Too many violations' });
          console.log(`User key=${key} banned until ${new Date(entry.bannedUntil).toLocaleString()}`);

          try { socket.disconnect(true); } catch (e) {}
          return; // do NOT save or broadcast the offending message
        } else {
          socket.emit('system-message', `Warning: abusive language detected. Strike ${entry.strikes}/${STRIKE_THRESHOLD}`);
          return; // do not broadcast flagged message
        }
      }

      // message is ok: clean (mask) and persist + broadcast
      const cleanedText = (filter && typeof filter.clean === 'function') ? filter.clean(text) : String(text);
      const msg = {
        classCode,
        senderName: senderName || 'Unknown',
        text: cleanedText,
        originalText: String(text),
        timestamp: new Date()
      };

      // best-effort save
      try { await Message.create(msg); } catch (err) { console.warn('Message save failed:', err); }

      io.to(classCode).emit('receive-message', msg);
    } catch (err) {
      console.error('Error in send-message handler:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edugeoclass';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes (keep your existing routes)
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homework', homeworkRoutes);

// Chat history and admin routes (assumed to exist)
app.use('/api/chat', chatController);
app.use('/api/chat-admin', chatAdminRoutes);

app.get('/', (req, res) => res.send('EduGeoClass API is running'));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
