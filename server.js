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
// Toàn bộ giao diện HTML, CSS, JS được đóng gói trong server.js (gzip).
// GitHub chỉ cần server.js và package.json, không cần thư mục public/.
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
    // Chỉ nhà cái hiện tại mới được xem chi tiết cược từng nhà con.
    // Gửi qua cùng sự kiện realtime sau mỗi lần đặt hoặc xóa cược.
    ...(me.id===room.hostId ? {bankerBets:[...room.players.values()]
      .filter(p=>p.id!==room.hostId)
      .map(p=>({id:p.id,name:p.name,online:isOnline(p),
        bets:{...p.bets},total:FACES.reduce((sum,f)=>sum+p.bets[f],0)}))} : {}),
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
function staticFile(req,res,pathname) {
  const key=pathname==='/'?'/index.html':pathname;
  const asset=EMBEDDED_ASSETS[key];
  if(!asset)return error(res,404,'Không tìm thấy trang.');
  res.writeHead(200,{'Content-Type':asset.mime,'Content-Encoding':'gzip','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
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
