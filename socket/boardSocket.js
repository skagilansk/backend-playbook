// ── Redis with in-memory fallback ──────────────────────────────────────────
// If Redis is not available (ECONNREFUSED / ENOTFOUND) we silently switch to
// a plain JavaScript Map so the server keeps running in single-process mode.

const Redis = require('ioredis');

// ---- In-memory store (used when Redis is unavailable) --------------------
class MemoryStore {
  constructor() {
    this._store = new Map();   // key -> { value, expiresAt }
    this._usingMemory = true;
  }

  async set(key, value, ...opts) {
    // Parse NX / EX options the same way ioredis does
    let nx = false;
    let ttlMs = null;
    for (let i = 0; i < opts.length; i++) {
      const o = String(opts[i]).toUpperCase();
      if (o === 'NX') nx = true;
      if (o === 'EX' && opts[i + 1] != null) { ttlMs = Number(opts[i + 1]) * 1000; i++; }
      if (o === 'PX' && opts[i + 1] != null) { ttlMs = Number(opts[i + 1]); i++; }
    }
    if (nx && this._store.has(key)) {
      const entry = this._store.get(key);
      if (!entry.expiresAt || entry.expiresAt > Date.now()) return null; // still valid
    }
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this._store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) { this._store.delete(key); return null; }
    return entry.value;
  }

  async del(key) {
    return this._store.delete(key) ? 1 : 0;
  }

  async keys(pattern) {
    // Convert Redis glob (e.g. "lock:boardId:*") to a simple prefix match
    const prefix = pattern.replace('*', '');
    const now = Date.now();
    const result = [];
    for (const [k, entry] of this._store.entries()) {
      if (k.startsWith(prefix) && (!entry.expiresAt || entry.expiresAt > now)) {
        result.push(k);
      }
    }
    return result;
  }
}

// ---- Build the store: try Redis first, fall back to memory ---------------
let store;

function buildStore() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, {
    lazyConnect: true,          // don't connect until we call .connect()
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,  // disable auto-reconnect
  });

  client.connect().then(() => {
    console.log('✅ Connected to Redis');
    store = client;
  }).catch(() => {
    console.warn('⚠️  Redis not available – using in-memory lock store (single-process mode)');
    client.disconnect();
    store = new MemoryStore();
  });

  // If an error fires after connection, log it but don't crash
  client.on('error', () => {});

  // Default to memory store until Redis resolves
  store = new MemoryStore();
}

buildStore();

// ── Socket handlers ────────────────────────────────────────────────────────

// Helper to keep track of sockets and their locks
const socketLocks = new Map(); // socketId -> array of lock keys

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socketLocks.set(socket.id, []);

    // Join a specific board room
    socket.on('join-board', async ({ boardId, username }) => {
      socket.join(boardId);
      socket.boardId = boardId;
      socket.username = username;
      console.log(`Socket ${socket.id} joined board ${boardId} as ${username}`);

      // Send all current locks to the joining client
      try {
        const keys = await store.keys(`lock:${boardId}:*`);
        const locks = {};
        for (const key of keys) {
          const lockedBy = await store.get(key);
          const playerId = key.split(':').pop();
          locks[playerId] = lockedBy;
        }
        socket.emit('initial-locks', locks);
      } catch (err) {
        console.error('Lock store error getting locks:', err);
      }
    });

    // Handle player drag start (lock)
    socket.on('player-busy', async ({ boardId, playerId }) => {
      const lockKey = `lock:${boardId}:${playerId}`;
      try {
        // Set lock with 5 second TTL
        const acquired = await store.set(lockKey, socket.id, 'NX', 'EX', 5);
        if (acquired) {
          socketLocks.get(socket.id).push(lockKey);
          socket.to(boardId).emit('player-busy', { playerId, lockedBy: socket.id });
        }
      } catch (err) {
        console.error('Lock acquire error:', err);
      }
    });

    // Handle player drag end (release)
    socket.on('player-released', async ({ boardId, playerId }) => {
      const lockKey = `lock:${boardId}:${playerId}`;
      try {
        const owner = await store.get(lockKey);
        if (owner === socket.id) {
          await store.del(lockKey);
          const locks = socketLocks.get(socket.id);
          socketLocks.set(socket.id, locks.filter(key => key !== lockKey));
          socket.to(boardId).emit('player-released', { playerId });
        }
      } catch (err) {
        console.error('Lock release error:', err);
      }
    });

    // Handle throttled player movement
    socket.on('move-player', ({ boardId, playerId, x, y }) => {
      socket.to(boardId).emit('move-player', { playerId, x, y });
    });

    // Cursor movement broadcasting
    socket.on('cursor-move', ({ boardId, x, y }) => {
      socket.to(boardId).emit('cursor-move', {
        socketId: socket.id,
        username: socket.username || 'Anonymous',
        x,
        y
      });
    });

    // Drawing events
    socket.on('draw-stroke', ({ boardId, stroke }) => {
      socket.to(boardId).emit('draw-stroke', { stroke });
    });

    socket.on('delete-stroke', ({ boardId, strokeId }) => {
      socket.to(boardId).emit('delete-stroke', { strokeId });
    });

    // Playback sync
    socket.on('play-snapshot', ({ boardId, players, drawings }) => {
      socket.to(boardId).emit('play-snapshot', { players, drawings });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Tell others this cursor is gone
      if (socket.boardId) {
        socket.to(socket.boardId).emit('cursor-leave', { socketId: socket.id });
      }

      // Release all locks held by this socket
      const locks = socketLocks.get(socket.id) || [];
      for (const lockKey of locks) {
        try {
          await store.del(lockKey);
          if (socket.boardId) {
            const playerId = lockKey.split(':').pop();
            socket.to(socket.boardId).emit('player-released', { playerId });
          }
        } catch (err) {
          console.error('Error cleaning up lock on disconnect:', err);
        }
      }
      socketLocks.delete(socket.id);
    });
  });
};
