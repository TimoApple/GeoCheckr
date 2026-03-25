// ═══════════════════════════════════════════════════════════════
// GeoCheckr Web — Networking (PeerJS WebRTC)
// Room-based multiplayer, no server needed
// ═══════════════════════════════════════════════════════════════

const Net = (() => {
  let peer = null;
  let hostConn = null;   // For guests: connection to host
  let guestConns = [];    // For host: connections to guests
  let isHost = false;
  let roomId = null;
  let playerName = '';
  let onMessage = null;
  let onPlayerJoin = null;
  let onPlayerLeave = null;
  let onReady = null;
  let onError = null;

  // Generate 6-digit room code
  function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ═══ HOST: Create Room ═══
  function createRoom(name) {
    return new Promise((resolve, reject) => {
      playerName = name;
      isHost = true;
      roomId = generateRoomCode();

      peer = new Peer('geocheckr-' + roomId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peer.on('open', (id) => {
        console.log('[Net] Host ready:', id);
        playConnect();
        if (onReady) onReady({ isHost: true, roomId });
        resolve({ isHost: true, roomId });
      });

      peer.on('connection', (conn) => {
        console.log('[Net] Guest connecting:', conn.peer);
        setupGuestConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('[Net] Host error:', err);
        if (onError) onError(err);
        reject(err);
      });

      peer.on('disconnected', () => {
        console.warn('[Net] Host disconnected, reconnecting...');
        peer.reconnect();
      });
    });
  }

  // ═══ GUEST: Join Room ═══
  function joinRoom(code, name) {
    return new Promise((resolve, reject) => {
      playerName = name;
      isHost = false;
      roomId = code;

      peer = new Peer(null, { debug: 1 });

      peer.on('open', (id) => {
        console.log('[Net] Guest peer ready:', id);

        hostConn = peer.connect('geocheckr-' + code, {
          reliable: true,
          metadata: { name: playerName }
        });

        hostConn.on('open', () => {
          console.log('[Net] Connected to host');
          playConnect();
          // Send join message
          hostConn.send({ type: 'join', name: playerName });
          if (onReady) onReady({ isHost: false, roomId: code });
          resolve({ isHost: false, roomId: code });
        });

        hostConn.on('data', (data) => {
          console.log('[Net] From host:', data.type);
          if (onMessage) onMessage(data);
        });

        hostConn.on('close', () => {
          console.warn('[Net] Connection to host closed');
          playDisconnect();
          if (onPlayerLeave) onPlayerLeave('host');
        });

        hostConn.on('error', (err) => {
          console.error('[Net] Connection error:', err);
          if (onError) onError(err);
          reject(err);
        });
      });

      peer.on('error', (err) => {
        console.error('[Net] Guest error:', err);
        if (err.type === 'peer-unavailable') {
          reject(new Error('Raum nicht gefunden'));
        } else {
          if (onError) onError(err);
          reject(err);
        }
      });
    });
  }

  // ═══ HOST: Setup guest connection ═══
  function setupGuestConnection(conn) {
    conn.on('open', () => {
      console.log('[Net] Guest connected:', conn.metadata?.name);
      guestConns.push(conn);

      conn.on('data', (data) => {
        console.log('[Net] From guest:', data.type);
        if (data.type === 'join') {
          if (onPlayerJoin) onPlayerJoin({
            name: data.name || conn.metadata?.name || 'Spieler',
            conn: conn
          });
        }
        if (onMessage) onMessage(data, conn);
      });

      conn.on('close', () => {
        console.warn('[Net] Guest disconnected');
        guestConns = guestConns.filter(c => c !== conn);
        if (onPlayerLeave) onPlayerLeave(conn.metadata?.name || 'unknown');
      });
    });
  }

  // ═══ SEND ═══
  function send(data) {
    if (isHost) {
      guestConns.forEach(conn => {
        if (conn.open) conn.send(data);
      });
    } else if (hostConn && hostConn.open) {
      hostConn.send(data);
    }
  }

  function sendTo(conn, data) {
    if (conn && conn.open) conn.send(data);
  }

  // ═══ UTILS ═══
  function getPeers() {
    return guestConns.length;
  }

  function disconnect() {
    guestConns.forEach(c => { try { c.close(); } catch(e) {} });
    guestConns = [];
    if (hostConn) { try { hostConn.close(); } catch(e) {} hostConn = null; }
    if (peer) { try { peer.destroy(); } catch(e) {} peer = null; }
  }

  function getIsHost() { return isHost; }
  function getRoomId() { return roomId; }

  return {
    createRoom, joinRoom, send, sendTo,
    disconnect, getPeers, getIsHost, getRoomId,
    set onMessage(fn) { onMessage = fn; },
    set onPlayerJoin(fn) { onPlayerJoin = fn; },
    set onPlayerLeave(fn) { onPlayerLeave = fn; },
    set onReady(fn) { onReady = fn; },
    set onError(fn) { onError = fn; },
  };
})();
