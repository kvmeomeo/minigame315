'use strict';
/* BẦU CUA ONLINE — realtime via Server-Sent Events; Node.js core only.
   For fun with VIRTUAL POINTS; no cash, payment, or cash-out features. */
const http = require('node:http');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const BET_SECONDS = 30;
const MAX_PLAYERS = 16;
const ANIM_MS = 1850;
const FACES = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
const ROOMS = new Map();

// Tất cả giao diện HTML, CSS và JS được đóng gói ngay tại đây.
// Không cần thư mục public/, không cần thư viện ngoài hay cài npm install.
// Dữ liệu giao diện đã được nén gzip; trình duyệt tự giải nén khi nhận.
const EMBEDDED_ASSETS = {
  "/index.html": {mime: "text/html; charset=utf-8", data: Buffer.from(
    "H4sIAAAAAAAC/41TvY7TQBDu7ykG08aODpCgsFNwr8ALbHYn9nDrXWt37SgSBRIlDUg0SCDudBKBguKuIykocuI9fE/AIzC2cxAgEmn2Z2a+b2bnm03vKCvDokIoQqknR2m3gRYmz6KGos6AQk2OANISgwBZCOcxZFEdZvGjCMa/XUaU2IFwXlkXIpDWBDQcOicVikxhQxLj/jICMhRI6NhLoTE7HsEtLp5RyKRt0O0hDwWWGEurrdvhv/vwwfH03v098Qq9dFQFsmYn/nG7WtZwUgt40q6+Bbh5/gZCuzq3UBWbK5OPIG/XXwjKzQW/18KUfQamm0/QbM7Y8v2cQG6+mhxMIWrgoiwv7fo9QU7C9OdL2cEuOeb6NbXrFyW0qwub3NYYKGic/F3IMzjZIWeWtzQkT8cDoINqMqfgUGeRDwuNvkDkZhcOZ1k07k2J9L5PlI4H8dKpVYserKgBqYX3WSTKKXE7YLvH1mAEwpGIC1IKDXfb1RhN0jGD/gcOc3s4WNfydBErlNZBv8YaZ2Ev/ubdxwMpHOXFgRyk+AFVxdXtMPogXKjZ+OPDcgnXr/gHsNR1u/rM0rfrl6z/mYFfiiVJMpD+Sx2s8N34D7zbm7M85l2SUPttlZoaNlVWU/ijU8PIgneSBeU6k6eMUDhDx0GDs5N20JQl7v/tTwrD9hzIAwAA", 'base64')},
  "/app.js": {mime: "text/javascript; charset=utf-8", data: Buffer.from(
    "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", 'base64')},
  "/style.css": {mime: "text/css; charset=utf-8", data: Buffer.from(
    "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", 'base64')}
};
const CODES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nextCode = () => Array.from({length: 5}, () => CODES[crypto.randomInt(CODES.length)]).join('');
const token = (bytes = 18) => crypto.randomBytes(bytes).toString('hex');
const freshBets = () => Object.fromEntries(FACES.map(face => [face, 0]));

const json = (res, status, obj) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(obj));
};
const error = (res, status, message) => json(res, status, { error: message });
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 12_000) { reject(new Error('Dữ liệu quá lớn.')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Dữ liệu không hợp lệ.')); } });
    req.on('error', reject);
  });
}
function nameOf(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 20);
}
function getRoom(code) { return ROOMS.get(String(code || '').toUpperCase().trim()); }
function auth(data) {
  const room = getRoom(data.code);
  if (!room) return [null, null];
  const player = room.players.get(String(data.playerId || ''));
  if (!player || player.secret !== data.secret) return [null, null];
  room.activeAt = Date.now();
  return [room, player];
}
function isOnline(player) { return player.connections.size > 0; }
function totalPools(room) {
  const pools = freshBets();
  for (const p of room.players.values()) {
    if (p.id === room.hostId) continue;
    for (const f of FACES) pools[f] += p.bets[f];
  }
  return pools;
}
function snapshot(room, me) {
  const players = [...room.players.values()].map(p => ({
    id:p.id, name:p.name, online:isOnline(p),
    isHost:p.id===room.hostId, isBanker:p.id===room.hostId, roundNet:p.roundNet, totalNet:p.totalNet,
    wins:p.wins, joinedAt:p.joinedAt
  })).sort((a, b) => b.totalNet - a.totalNet || a.joinedAt-b.joinedAt);
  const pools = totalPools(room);
  const banker = room.players.get(room.hostId);
  return {
    code:room.code, me:{ id:me.id, name:me.name, totalNet:me.totalNet, isHost:me.id===room.hostId,
      isBanker:me.id===room.hostId, bets:me.bets, roundNet:me.roundNet, lastDetails:me.lastDetails }, phase:room.phase, round:room.round,
    deadline:room.deadline, dice:room.phase==='result' ? room.dice : null,
    players, pools, history:room.history.slice(0,6),
    banker:{id:banker.id, name:banker.name, totalNet:banker.totalNet, roundNet:banker.roundNet},
    maxPlayers:MAX_PLAYERS, seconds:BET_SECONDS, serverTime:Date.now()
  };
}
function send(room) {
  for (const player of room.players.values()) {
    const packet = `event: state\ndata: ${JSON.stringify(snapshot(room, player))}\n\n`;
    for (const res of player.connections) {
      try { res.write(packet); } catch { player.connections.delete(res); }
    }
  }
}
function newPlayer(name) {
  return { id: token(8), secret: token(), name,
    bets:freshBets(), connections:new Set(), joinedAt:Date.now(),
    roundNet:0, totalNet:0, wins:0, lastDetails:[] };
}
function playerCredentials(room, player) {
  return {code:room.code, playerId:player.id, secret:player.secret};
}
function createRoom(name) {
  let code;
  do { code=nextCode(); } while (ROOMS.has(code));
  const player=newPlayer(name);
  const room = { code, hostId:player.id, players:new Map([[player.id,player]]),
    phase:'waiting', round:0, deadline:null, dice:null, history:[], activeAt:Date.now(), timer:null };
  ROOMS.set(code, room);
  return {room,player};
}
function joinRoom(code, name) {
  const room=getRoom(code);
  if (!room) throw new Error('Không tìm thấy phòng. Hãy kiểm tra lại mã phòng.');
  if (room.players.size >= MAX_PLAYERS) throw new Error('Phòng đã đủ 16 người.');
  const player=newPlayer(name);
  room.players.set(player.id,player);
  room.activeAt=Date.now();
  send(room);
  return {room,player};
}
function settle(room) {
  if (room.phase!=='rolling') return;
  room.phase='result';
  const counts=Object.fromEntries(FACES.map(f=>[f,0]));
  room.dice.forEach(f=>counts[f]++);
  const banker=room.players.get(room.hostId);
  let bankerNet=0;
  const winners=[];
  for (const p of room.players.values()) {
    if (p.id===room.hostId) continue;
    let roundNet=0;
    const details=[];
    for (const f of FACES) {
      const bet=p.bets[f], hits=counts[f];
      if (!bet) continue;
      const net=hits ? bet*hits : -bet;
      roundNet+=net;
      details.push({face:f,bet,hits,net});
    }
    p.roundNet=roundNet;
    p.lastDetails=details;
    p.totalNet+=p.roundNet;
    if(p.roundNet>0) {p.wins++; winners.push({name:p.name,amount:p.roundNet});}
    bankerNet-=p.roundNet;
  }
  banker.roundNet=bankerNet;
  banker.totalNet+=bankerNet;
  const pools=totalPools(room);
  banker.lastDetails=FACES.filter(f=>pools[f]>0).map(f=>{
    const bet=pools[f],hits=counts[f];
    return {face:f,bet,hits,net:hits?-bet*hits:bet};
  });
  if(bankerNet>0) {banker.wins++; winners.push({name:banker.name,amount:bankerNet});}
  room.history.unshift({round:room.round,dice:[...room.dice], bankerNet,
    winners:winners.sort((a,b)=>b.amount-a.amount).slice(0,3)});
  room.history=room.history.slice(0,20);
  room.deadline=null;
  send(room);
}
function clearRoundDisplay(room) {
  room.phase='waiting';
  room.dice=null;
  room.deadline=null;
  for(const p of room.players.values()) {p.bets=freshBets();p.roundNet=0;p.lastDetails=[];}
}
function roll(room) {
  if (room.phase!=='betting') return;
  if (room.timer) clearTimeout(room.timer);
  room.phase='rolling';
  room.deadline=null;
  room.dice=Array.from({length:3},()=>FACES[crypto.randomInt(FACES.length)]);
  send(room);
  room.timer=setTimeout(()=>settle(room),ANIM_MS);
}
function startRound(room) {
  if (room.timer) clearTimeout(room.timer);
  room.round++;
  room.phase='betting';
  room.dice=null;
  room.deadline=Date.now()+BET_SECONDS*1000;
  for (const p of room.players.values()) { p.bets=freshBets(); p.roundNet=0; p.lastDetails=[]; }
  send(room);
  room.timer=setTimeout(()=>roll(room),BET_SECONDS*1000+15);
}
function action(room, player, data) {
  const type=String(data.type||'');
  if (room.phase==='betting' && Date.now()>=room.deadline) roll(room);
  if (type==='bet') {
    if (room.phase!=='betting') throw new Error('Hiện chưa phải thời gian đặt cược.');
    if (player.id===room.hostId) throw new Error('Nhà cái không đặt cược. Nhà cái nhận/thanh toán điểm từ nhà con.');
    const face=String(data.face||'');
    if (!FACES.includes(face)) throw new Error('Linh vật không hợp lệ.');
    // Mỗi lần nhấn là 1 lượt cược = 1 điểm; không xét số dư.
    if (data.amount !== undefined && data.amount !== 1) throw new Error('Mỗi lượt đặt chỉ tính 1 điểm.');
    if (!Number.isSafeInteger(player.bets[face] + 1)) throw new Error('Đã vượt giới hạn số lượt có thể ghi nhận.');
    player.bets[face]+=1;
  } else if (type==='undo') {
    if (player.id===room.hostId) throw new Error('Nhà cái không đặt cược.');
    if (room.phase!=='betting') throw new Error('Không thể hoàn cược sau khi đã lắc.');
    const face=String(data.face||'');
    if (!FACES.includes(face)) throw new Error('Linh vật không hợp lệ.');
    player.bets[face]=0;
  } else if (type==='undoAll') {
    if (player.id===room.hostId) throw new Error('Nhà cái không đặt cược.');
    if (room.phase!=='betting') throw new Error('Không thể hoàn cược sau khi đã lắc.');
    for (const f of FACES) player.bets[f]=0;
  } else if (type==='start') {
    if (player.id!==room.hostId) throw new Error('Chỉ chủ phòng được bắt đầu ván.');
    if (!['waiting','result'].includes(room.phase)) throw new Error('Ván đang diễn ra.');
    startRound(room);
    return;
  } else if (type==='roll') {
    if (player.id!==room.hostId) throw new Error('Chỉ chủ phòng được lắc sớm.');
    if (room.phase!=='betting') throw new Error('Chưa thể lắc xúc xắc.');
    roll(room);
    return;
  } else if (type==='reset') {
    if (player.id!==room.hostId) throw new Error('Chỉ chủ phòng được đặt lại.');
    if (!['waiting','result'].includes(room.phase)) throw new Error('Hãy kết thúc ván hiện tại trước.');
    room.round=0;room.history=[];room.dice=null;room.phase='waiting';room.deadline=null;
    for (const p of room.players.values()) {p.bets=freshBets();p.roundNet=0;p.totalNet=0;p.wins=0;p.lastDetails=[];}
  } else if (type==='transferHost') {
    if (player.id!==room.hostId) throw new Error('Chỉ nhà cái hiện tại mới được chuyển quyền.');
    if (!['waiting','result'].includes(room.phase)) throw new Error('Chỉ đổi nhà cái giữa các ván.');
    const next=room.players.get(String(data.targetId||''));
    if (!next || next.id===player.id) throw new Error('Hãy chọn một nhà con hợp lệ.');
    room.hostId=next.id;
    clearRoundDisplay(room);
  } else if (type==='leave') {
    if (!['waiting','result'].includes(room.phase)) throw new Error('Không thể rời bàn khi ván đang diễn ra.');
    for(const r of player.connections) { try {r.end();} catch {} }
    player.connections.clear();
    room.players.delete(player.id);
    if (room.players.size===0) { if(room.timer) clearTimeout(room.timer); ROOMS.delete(room.code);return; }
    if (player.id===room.hostId) {
      room.hostId=[...room.players.values()][0].id;
      clearRoundDisplay(room);
    }
  } else if (type==='claimHost') {
    if (!['waiting','result'].includes(room.phase)) throw new Error('Chỉ đổi nhà cái giữa các ván.');
    const host=room.players.get(room.hostId);
    if (host && isOnline(host)) throw new Error('Chủ phòng vẫn đang kết nối.');
    if (player.id===room.hostId) throw new Error('Bạn đã là chủ phòng.');
    room.hostId=player.id;
    clearRoundDisplay(room);
  } else throw new Error('Thao tác không hợp lệ.');
  send(room);
}
function staticFile(req, res, pathname) {
  const key = pathname === '/' ? '/index.html' : pathname;
  const asset = EMBEDDED_ASSETS[key];
  if (!asset) return error(res, 404, 'Không tìm thấy trang.');
  res.writeHead(200, {
    'Content-Type': asset.mime,
    'Content-Encoding': 'gzip',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(asset.data);
}
const server=http.createServer(async(req,res)=>{
  const url = new URL(req.url||'/', `http://${req.headers.host||'localhost'}`);
  const pathname=url.pathname;
  if(req.method==='GET' && pathname==='/health') return json(res,200,{ok:true,rooms:ROOMS.size});
  if(req.method==='GET' && pathname==='/api/state') {
    const [room,player]=auth(Object.fromEntries(url.searchParams));
    return room ? json(res,200,snapshot(room,player)):error(res,401,'Phiên chơi không hợp lệ hoặc phòng đã đóng.');
  }
  if(req.method==='GET' && pathname==='/api/events') {
    const [room,player]=auth(Object.fromEntries(url.searchParams));
    if(!room) return error(res,401,'Phiên chơi không hợp lệ.');
    res.writeHead(200,{
      'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform',
      'Connection':'keep-alive','X-Accel-Buffering':'no', 'Access-Control-Allow-Origin':'same-origin'
    });
    res.write(': connected\n\n');
    player.connections.add(res);
    res.on('close',()=>{player.connections.delete(res);send(room);});
    send(room);
    return;
  }
  if(req.method==='POST' && ['/api/create','/api/join','/api/action'].includes(pathname)) {
    try {
      const data=await body(req);
      if(pathname==='/api/create'||pathname==='/api/join') {
        const name=nameOf(data.name);
        if(name.length<1) return error(res,400,'Vui lòng nhập tên người chơi.');
        const {room,player}=pathname==='/api/create'?createRoom(name):joinRoom(data.code,name);
        return json(res,200,{credentials:playerCredentials(room,player),state:snapshot(room,player)});
      }
      const [room,player]=auth(data);
      if(!room) return error(res,401,'Phiên chơi đã hết hạn. Hãy vào phòng lại.');
      action(room,player,data);
      return json(res,200,{ok:true});
    }catch(e){ return error(res,400,e.message||'Không thể xử lý yêu cầu.'); }
  }
  if(req.method==='GET') return staticFile(req,res,pathname);
  return error(res,405,'Phương thức không được hỗ trợ.');
});

// Keep streaming connections alive through proxy/load balancer; clean unused rooms.
const heartbeat=setInterval(()=>{
  for(const room of ROOMS.values()) for(const player of room.players.values()) for(const res of player.connections) {
    try{ res.write(': ping\n\n'); } catch {player.connections.delete(res);}
  }
},20_000);
heartbeat.unref();
const cleanup=setInterval(()=>{
  for(const [code,room] of ROOMS) {
    const connections=[...room.players.values()].some(isOnline);
    if(!connections && Date.now()-room.activeAt>6*60*60*1000) {
      if(room.timer) clearTimeout(room.timer);
      ROOMS.delete(code);
    }
  }
},10*60*1000);
cleanup.unref();

if(require.main===module) server.listen(PORT,HOST,()=>console.log(`🎲 Bầu Cua online: http://localhost:${PORT}`));
module.exports={server,ROOMS,FACES,settle};
