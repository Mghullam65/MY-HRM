/**
 * scripts/verify-realtime-websockets.js
 * Comprehensive automated verification for Real-Time WebSockets,
 * Team Chat presence, messaging, typing indicators, and push notifications.
 */

const http = require('http');
const WebSocket = require('ws');
const wsService = require('../server/src/websocket');

console.log('════════════════════════════════════════════════════════════');
console.log('⚡ VERIFYING REAL-TIME WEBSOCKETS & COLLABORATION CHAT');
console.log('════════════════════════════════════════════════════════════\n');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, label) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${label}`);
  } else {
    console.error(`  ❌ [FAIL] ${label}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  // Create an isolated HTTP server for WebSocket testing
  const server = http.createServer();
  wsService.init(server);

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const wsUrl = `ws://127.0.0.1:${port}/ws`;

  console.log(`▶ Test WebSocket Server listening on ${wsUrl}\n`);

  // Helper to create and wait for open connection
  function connectClient(userId, empId, name, role = 'employee') {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.on('open', () => {
        // Authenticate
        ws.send(JSON.stringify({
          type: 'auth',
          userId,
          empId,
          name,
          role
        }));
      });
      ws.on('error', reject);
      ws.on('message', function onMsg(raw) {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'auth:success') {
          ws.removeListener('message', onMsg);
          resolve({ ws, welcomeMsg: msg });
        }
      });
    });
  }

  try {
    // CATEGORY 1: WebSocket Connection & Handshake
    console.log('▶ CATEGORY 1: Connection & Authentication Handshake...');
    const client1 = await connectClient(1, 101, 'Super Admin', 'superadmin');
    assert(client1.welcomeMsg.type === 'auth:success', 'Client received auth:success acknowledgment from server');
    assert(client1.welcomeMsg.user.empId === 101, 'Server correctly bound socket to empId 101');
    assert(Array.isArray(client1.welcomeMsg.onlineUserIds), 'Server returned initial online users roster');
    assert(client1.welcomeMsg.onlineUserIds.includes(101), 'EmpId 101 is registered as online');

    // CATEGORY 2: Presence Tracking (Join / Online)
    console.log('\n▶ CATEGORY 2: Real-Time Presence & Online Roster...');
    let presencePromise = new Promise(resolve => {
      client1.ws.on('message', function onMsg(raw) {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'presence:online') {
          client1.ws.removeListener('message', onMsg);
          resolve(msg);
        }
      });
    });

    const client2 = await connectClient(2, 102, 'Sara Khan', 'employee');
    const presenceJoin = await presencePromise;
    assert(presenceJoin.type === 'presence:online', 'Presence event dispatched on new user connection (presence:online)');
    assert(presenceJoin.empId === 102, 'Dispatched presence update correctly identified empId 102');
    assert(presenceJoin.name === 'Sara Khan', 'Dispatched presence update correctly identified Sara Khan');

    // CATEGORY 3: Real-Time Channel Message Broadcasting
    console.log('\n▶ CATEGORY 3: Real-Time Channel Message Broadcasting...');
    let messagePromise = new Promise(resolve => {
      client2.ws.on('message', function onMsg(raw) {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'chat:message') {
          client2.ws.removeListener('message', onMsg);
          resolve(msg);
        }
      });
    });

    const sentMessage = {
      id: 'msg-test-101',
      channelId: 'chan-announcements',
      text: 'Team All-Hands scheduled for Friday at 3:00 PM',
      senderId: 101,
      senderName: 'Super Admin',
      createdAt: new Date().toISOString()
    };
    client1.ws.send(JSON.stringify({
      type: 'chat:message',
      message: sentMessage
    }));

    const receivedEnvelope = await messagePromise;
    assert(receivedEnvelope.message.channelId === 'chan-announcements', 'Message delivered to correct channel (chan-announcements)');
    assert(receivedEnvelope.message.text === sentMessage.text, 'Message text delivered with exact payload integrity');
    assert(receivedEnvelope.message.senderId === 101, 'Message sender identified as 101');

    // CATEGORY 4: Direct 1-on-1 Messaging
    console.log('\n▶ CATEGORY 4: Direct 1-on-1 Messaging Between Employees...');
    let dmPromise = new Promise(resolve => {
      client2.ws.on('message', function onMsg(raw) {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'chat:message' && msg.message.channelId === 'dm-101-102') {
          client2.ws.removeListener('message', onMsg);
          resolve(msg);
        }
      });
    });

    const dmMessage = {
      id: 'msg-test-102',
      channelId: 'dm-101-102',
      recipientId: 102,
      text: 'Hi Sara, could you please review the Q3 performance appraisals?',
      senderId: 101,
      senderName: 'Super Admin',
      createdAt: new Date().toISOString()
    };
    client1.ws.send(JSON.stringify({
      type: 'chat:message',
      message: dmMessage
    }));

    const receivedDmEnvelope = await dmPromise;
    assert(receivedDmEnvelope.message.recipientId === 102, 'Direct message tagged with intended recipient 102');
    assert(receivedDmEnvelope.message.text === dmMessage.text, 'Direct message content matches transmitted payload');

    // CATEGORY 5: Typing Indicators
    console.log('\n▶ CATEGORY 5: Typing Indicators Broadcast...');
    let typingPromise = new Promise(resolve => {
      client1.ws.on('message', function onMsg(raw) {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'chat:typing') {
          client1.ws.removeListener('message', onMsg);
          resolve(msg);
        }
      });
    });

    client2.ws.send(JSON.stringify({
      type: 'chat:typing',
      channelId: 'dm-101-102',
      isTyping: true
    }));

    const receivedTyping = await typingPromise;
    assert(receivedTyping.userName === 'Sara Khan', 'Typing event emitted by Sara Khan received by peer');
    assert(receivedTyping.isTyping === true, 'Typing state is true');

    // CATEGORY 6: System Notification Live Push
    console.log('\n▶ CATEGORY 6: Real-Time System Notification Push...');
    let notifPromise = new Promise(resolve => {
      client2.ws.on('message', function onMsg(raw) {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'notification:live') {
          client2.ws.removeListener('message', onMsg);
          resolve(msg);
        }
      });
    });

    const deliveredCount = wsService.broadcastNotification(102, {
      id: 'notif-999',
      title: 'Annual Leave Approved',
      message: 'Your leave application for Sep 28-30 has been granted by HR.',
      category: 'leave'
    });

    assert(deliveredCount === 1, 'broadcastNotification returned 1 recipient reached');
    const receivedNotif = await notifPromise;
    assert(receivedNotif.notif.title === 'Annual Leave Approved', 'Targeted live notification received by EMP-102');
    assert(receivedNotif.notif.category === 'leave', 'Notification category preserved');

    // Disconnect client2 and verify presence offline broadcast
    let leavePromise = new Promise(resolve => {
      client1.ws.on('message', function onMsg(raw) {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'presence:offline') {
          client1.ws.removeListener('message', onMsg);
          resolve(msg);
        }
      });
    });

    client2.ws.close();
    const presenceLeave = await leavePromise;
    assert(presenceLeave.empId === 102, 'Disconnect triggers presence:offline event for empId 102');
    assert(presenceLeave.name === 'Sara Khan', 'Presence offline contains disconnected user name');

    // Clean up
    client1.ws.close();
    wsService.close();
    server.close();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`📊 WEBSOCKET VERIFICATION: ${passedChecks} OF ${totalChecks} CHECKS PASSED`);
    console.log('════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Error during WebSocket verification:', err);
    process.exitCode = 1;
    wsService.close();
    server.close();
  }
}

runTests();
