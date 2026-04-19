// ===== MEE Block Runner - MeeChain Mini Game =====
// MeeBot วิ่งเก็บ MEE Token หลบ Blockchain Blocks
// Theme: Cyber-Ritual / MeeChain neon dark

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  const CFG = {
    W: 800, H: 400,
    GROUND: 310,
    GRAVITY: 0.55,
    JUMP1: -13.5,
    JUMP2: -11.5,
    SPEED0: 4,
    SPEED_INC: 0.0007,
    SPEED_MAX: 12,
    MEE_PER_COIN: 5,
    MAX_LIVES: 3,
  };

  const C = {
    bg0: '#050810', bg1: '#0D1525',
    ground: '#111827', groundLine: '#7C3AED',
    purple: '#7C3AED', purpleL: '#9333EA', purpleD: '#5B21B6',
    orange: '#E96C1F', orangeL: '#F97316',
    red: '#EF4444', redD: '#7F1D1D',
    gold: '#F59E0B', goldL: '#FCD34D',
    blue: '#38BDF8', white: '#F3F4F6',
    violet: '#A78BFA', green: '#10B981',
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let canvas, ctx, rafId;
  let state = 'idle'; // idle | running | paused | gameover
  let speed, dist, score, lives, meeEarned, coinCount;
  let obTimer, coinTimer, obInterval;
  let invincible = false, invEndTime = 0; // time-based invincibility
  let highScore = +localStorage.getItem('mee_hs') || 0;
  let totalMee  = +localStorage.getItem('mee_total') || 0;

  const player = { x:100, y:0, vy:0, w:50, h:68, grounded:true, jumps:0 };
  let obstacles=[], coins=[], particles=[], stars=[];

  // ── Helpers ────────────────────────────────────────────────────────────────
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
  }
  const lerp = (a,b,t) => a+(b-a)*t;
  const sin  = (f,p=0) => Math.sin(Date.now()/f+p);

  // ── Stars ──────────────────────────────────────────────────────────────────
  function initStars() {
    stars = Array.from({length:70}, () => ({
      x: Math.random()*CFG.W,
      y: Math.random()*CFG.GROUND*0.95,
      r: Math.random()*1.4+0.3,
      spd: Math.random()*0.4+0.1,
      a: Math.random()*0.7+0.15,
    }));
  }

  // ── Draw Background ────────────────────────────────────────────────────────
  function drawBG() {
    const g = ctx.createLinearGradient(0,0,0,CFG.GROUND);
    g.addColorStop(0, C.bg0); g.addColorStop(1, C.bg1);
    ctx.fillStyle = g; ctx.fillRect(0,0,CFG.W,CFG.H);

    // Scrolling stars
    const ratio = speed/CFG.SPEED0;
    stars.forEach(s => {
      s.x -= s.spd*ratio;
      if (s.x<0) { s.x=CFG.W; s.y=Math.random()*CFG.GROUND*0.95; }
      ctx.globalAlpha = s.a;
      ctx.fillStyle = C.violet;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ground platform
    ctx.fillStyle = C.ground;
    ctx.fillRect(0, CFG.GROUND, CFG.W, CFG.H-CFG.GROUND);

    // Neon ground line
    ctx.shadowBlur=12; ctx.shadowColor=C.purple;
    ctx.strokeStyle=C.purple; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,CFG.GROUND); ctx.lineTo(CFG.W,CFG.GROUND); ctx.stroke();
    ctx.shadowBlur=0;

    // Moving grid on ground
    ctx.strokeStyle='rgba(124,58,237,0.08)'; ctx.lineWidth=1;
    const off=(Date.now()*(speed/60))%60;
    for (let x=-off; x<CFG.W; x+=60) {
      ctx.beginPath(); ctx.moveTo(x,CFG.GROUND); ctx.lineTo(x,CFG.H); ctx.stroke();
    }
    for (let y=CFG.GROUND+20; y<CFG.H; y+=20) {
      ctx.strokeStyle=`rgba(124,58,237,${0.04+(CFG.H-y)/CFG.H*0.06})`;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CFG.W,y); ctx.stroke();
    }
  }

  // ── Draw Player (MeeBot) ───────────────────────────────────────────────────
  function drawPlayer() {
    const { x, y, w, h, grounded } = player;
    const cx = x+w/2, cy = y+h/2;
    const t = Date.now();
    const inAir = !grounded;

    // Shadow
    ctx.fillStyle='rgba(124,58,237,0.18)';
    ctx.beginPath(); ctx.ellipse(cx, CFG.GROUND+4, w*0.45*(inAir?0.7:1), 7, 0, 0, Math.PI*2); ctx.fill();

    ctx.save(); ctx.translate(cx, cy);

    // Squash/stretch
    const sy = inAir ? 1.12 : (grounded ? 1-Math.abs(sin(180))*0.03 : 1);
    const sx = inAir ? 0.88 : 1;
    ctx.scale(sx, sy);

    // Glow
    ctx.shadowBlur=22; ctx.shadowColor=C.purple;

    // Body
    const bg = ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);
    bg.addColorStop(0, C.purpleL); bg.addColorStop(0.6, C.purple); bg.addColorStop(1, C.purpleD);
    ctx.fillStyle=bg; rr(ctx,-w/2,-h/2,w,h,10); ctx.fill();

    // Highlight
    ctx.fillStyle='rgba(255,255,255,0.12)'; rr(ctx,-w/2,-h/2,w,h/2.8,10); ctx.fill();

    // Glowing eyes
    ctx.shadowColor=C.blue; ctx.shadowBlur=14;
    ctx.fillStyle=C.blue;
    const eyeY = -h/6 + (inAir ? -4 : 0);
    ctx.beginPath(); ctx.ellipse(-w/4, eyeY, 7.5, 9, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( w/4, eyeY, 7.5, 9, 0, 0, Math.PI*2); ctx.fill();

    // Pupils
    ctx.shadowBlur=0; ctx.fillStyle='#0F172A';
    ctx.beginPath(); ctx.ellipse(-w/4+2, eyeY+1, 3.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( w/4+2, eyeY+1, 3.5, 4.5, 0, 0, Math.PI*2); ctx.fill();

    // Antenna
    ctx.shadowColor=C.orange; ctx.shadowBlur=10;
    ctx.strokeStyle=C.orange; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,-h/2); ctx.lineTo(0,-h/2-14); ctx.stroke();
    ctx.fillStyle=C.orange;
    ctx.beginPath(); ctx.arc(0,-h/2-18,5,0,Math.PI*2); ctx.fill();

    // Scarf
    ctx.shadowBlur=0; ctx.fillStyle=C.red;
    rr(ctx,-w/2,h/4-7,w,9,3); ctx.fill();

    // Legs
    const legSwing = grounded ? sin(130)*9 : 0;
    ctx.shadowBlur=0; ctx.fillStyle=C.purpleD;
    rr(ctx,-w/2+4, h/2-4, w/2-7, 14+legSwing, 4); ctx.fill();
    rr(ctx, 3,      h/2-4, w/2-7, 14-legSwing, 4); ctx.fill();

    // Feet
    ctx.fillStyle=C.orangeL;
    rr(ctx,-w/2+2, h/2+8+legSwing, w/2-4, 7, 3); ctx.fill();
    rr(ctx, 1,     h/2+8-legSwing, w/2-4, 7, 3); ctx.fill();

    ctx.restore(); ctx.shadowBlur=0;
  }

  // ── Obstacles ──────────────────────────────────────────────────────────────
  const OB_TYPES = [
    { w:38, h:55, oy:55, tag:'block' },
    { w:30, h:95, oy:95, tag:'tall' },
    { w:65, h:38, oy:38, tag:'wide' },
    { w:36, h:42, oy:150, tag:'float' },
  ];

  function spawnOb() {
    const t = OB_TYPES[Math.floor(Math.random()*OB_TYPES.length)];
    const hash = '0x'+Math.random().toString(16).slice(2,8).toUpperCase();
    const ob = { x:CFG.W+10, y:CFG.GROUND-t.oy, w:t.w, h:t.h, tag:t.tag, hash, ph:Math.random()*Math.PI*2 };
    obstacles.push(ob);
    if (Math.random()<0.18) {
      const t2 = OB_TYPES[Math.floor(Math.random()*3)];
      const h2  = '0x'+Math.random().toString(16).slice(2,8).toUpperCase();
      obstacles.push({ x:CFG.W+t.w+55, y:CFG.GROUND-t2.oy, w:t2.w, h:t2.h, tag:t2.tag, hash:h2, ph:Math.random()*Math.PI*2 });
    }
  }

  function drawOb(ob) {
    const glow = 0.5+0.5*Math.sin(Date.now()/400+ob.ph);
    ctx.shadowBlur=12+glow*10; ctx.shadowColor=C.red;
    const g = ctx.createLinearGradient(ob.x,ob.y,ob.x+ob.w,ob.y+ob.h);
    g.addColorStop(0,'#991B1B'); g.addColorStop(1,C.red);
    ctx.fillStyle=g; rr(ctx,ob.x,ob.y,ob.w,ob.h,6); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.08)'; rr(ctx,ob.x+3,ob.y+3,ob.w-6,ob.h-6,4); ctx.fill();

    // Hash label
    ctx.shadowBlur=0; ctx.fillStyle='rgba(254,202,202,0.85)';
    ctx.font='bold 7.5px monospace'; ctx.textAlign='center';
    ctx.fillText(ob.hash, ob.x+ob.w/2, ob.y+ob.h/2+3);

    // Chain from bottom if grounded obstacle
    if (ob.tag!=='float') {
      const steps=Math.floor((CFG.GROUND-ob.y-ob.h)/16);
      ctx.strokeStyle='rgba(239,68,68,0.4)'; ctx.lineWidth=1.5;
      for(let i=0;i<=steps;i++) {
        const cy2=ob.y+ob.h+i*16+8;
        ctx.beginPath(); ctx.arc(ob.x+ob.w/2,cy2,5,0,Math.PI*2); ctx.stroke();
      }
    }
    ctx.textAlign='left'; ctx.shadowBlur=0;
  }

  // ── Coins ──────────────────────────────────────────────────────────────────
  const COIN_YS = [CFG.GROUND-55, CFG.GROUND-105, CFG.GROUND-155];

  function spawnCoin() {
    const y = COIN_YS[Math.floor(Math.random()*COIN_YS.length)];
    const n = Math.random()<0.35 ? 3 : 1;
    for(let i=0;i<n;i++) {
      coins.push({ x:CFG.W+i*46, y, r:13, ph:Math.random()*Math.PI*2, done:false });
    }
  }

  function drawCoin(c) {
    const bob = sin(300,c.ph)*4;
    const cy = c.y+bob;
    ctx.shadowBlur=18; ctx.shadowColor=C.goldL;
    ctx.strokeStyle=C.goldL; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(c.x,cy,c.r+3,0,Math.PI*2); ctx.stroke();
    const g=ctx.createRadialGradient(c.x-3,cy-3,2,c.x,cy,c.r);
    g.addColorStop(0,C.goldL); g.addColorStop(1,C.gold);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(c.x,cy,c.r,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#78350F';
    ctx.font="bold 8px 'Kanit',sans-serif"; ctx.textAlign='center';
    ctx.fillText('MEE',c.x,cy+3); ctx.textAlign='left';
  }

  // ── Particles ──────────────────────────────────────────────────────────────
  function burst(x,y,col,n=8) {
    for(let i=0;i<n;i++) {
      const a=(i/n)*Math.PI*2+Math.random()*0.5;
      const spd=2+Math.random()*3;
      particles.push({ x,y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd-2,
        life:1, dec:0.04+Math.random()*0.03, r:3+Math.random()*4, col });
    }
  }

  function drawParticles() {
    particles=particles.filter(p=>p.life>0);
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=p.dec;
      ctx.globalAlpha=p.life; ctx.fillStyle=p.col;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function drawHUD() {
    // Score panel
    ctx.fillStyle='rgba(5,8,16,0.75)'; rr(ctx,CFG.W-215,12,200,66,10); ctx.fill();
    ctx.strokeStyle='rgba(124,58,237,0.5)'; ctx.lineWidth=1; rr(ctx,CFG.W-215,12,200,66,10); ctx.stroke();
    ctx.fillStyle=C.violet; ctx.font="bold 11px 'Kanit',sans-serif"; ctx.fillText('คะแนน',CFG.W-200,33);
    ctx.fillStyle=C.white;  ctx.font="bold 21px 'Kanit',sans-serif"; ctx.fillText(Math.floor(score).toLocaleString('th-TH'),CFG.W-200,56);
    ctx.fillStyle=C.gold;   ctx.font="bold 10px 'Kanit',sans-serif"; ctx.fillText(`สูงสุด: ${highScore.toLocaleString('th-TH')}`,CFG.W-95,33);
    ctx.fillStyle=C.white;  ctx.font="10px 'Kanit',sans-serif";
    ctx.fillText(`🪙 MEE +${meeEarned}`,CFG.W-95,50); ctx.fillText(`x${coinCount} เหรียญ`,CFG.W-95,65);

    // Lives
    ctx.font='17px sans-serif';
    for(let i=0;i<CFG.MAX_LIVES;i++){
      ctx.globalAlpha=i<lives?1:0.2; ctx.fillText('❤️',18+i*28,38);
    }
    ctx.globalAlpha=1;

    // Speed
    ctx.fillStyle='rgba(5,8,16,0.7)'; rr(ctx,14,52,88,20,5); ctx.fill();
    ctx.fillStyle=C.violet; ctx.font="11px 'Kanit',sans-serif";
    ctx.fillText(`⚡ ${speed.toFixed(1)}x`,20,66);
  }

  // ── Overlay Screens ────────────────────────────────────────────────────────
  function drawOverlay(title, titleColor, lines, btnLabel) {
    ctx.fillStyle='rgba(5,8,16,0.88)'; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.textAlign='center';
    ctx.shadowBlur=30; ctx.shadowColor=titleColor;
    ctx.fillStyle=titleColor; ctx.font="bold 40px 'Kanit',sans-serif";
    ctx.fillText(title, CFG.W/2, 130); ctx.shadowBlur=0;
    lines.forEach((l,i) => {
      ctx.fillStyle=l.col||C.white; ctx.font=l.font||"16px 'Kanit',sans-serif";
      ctx.fillText(l.text, CFG.W/2, 175+i*35);
    });
    const bx=CFG.W/2-105, by=175+lines.length*35+10;
    const pulse=0.5+0.5*sin(400);
    ctx.shadowBlur=18*pulse; ctx.shadowColor=C.purple;
    const bg=ctx.createLinearGradient(bx,by,bx+210,by+50);
    bg.addColorStop(0,C.purple); bg.addColorStop(1,C.orange);
    ctx.fillStyle=bg; rr(ctx,bx,by,210,50,12); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font="bold 19px 'Kanit',sans-serif";
    ctx.fillText(btnLabel, CFG.W/2, by+32);
    ctx.textAlign='left';
  }

  function drawStart() {
    drawBG();
    // Show MeeBot running in place
    player.y=CFG.GROUND-player.h; player.grounded=true; drawPlayer();
    // Decorative coins
    [180,380,580].forEach((cx,i)=>drawCoin({x:cx,y:CFG.GROUND-120,r:16,ph:i*1.2,done:false}));

    ctx.textAlign='center';
    ctx.fillStyle='rgba(5,8,16,0.86)'; rr(ctx,CFG.W/2-240,55,480,235,16); ctx.fill();
    ctx.strokeStyle='rgba(124,58,237,0.55)'; ctx.lineWidth=1.5; rr(ctx,CFG.W/2-240,55,480,235,16); ctx.stroke();

    ctx.shadowBlur=28; ctx.shadowColor=C.purple;
    ctx.fillStyle='#fff'; ctx.font="bold 34px 'Kanit',sans-serif";
    ctx.fillText('MEE Block Runner',CFG.W/2,108); ctx.shadowBlur=0;

    ctx.fillStyle=C.violet; ctx.font="14px 'Kanit',sans-serif";
    ctx.fillText('🤖 MeeBot วิ่งเก็บ MEE Token หลบ Blockchain Blocks!',CFG.W/2,142);
    ctx.fillStyle=C.white; ctx.font="13px 'Kanit',sans-serif";
    ctx.fillText('⬆ Space / ↑ / แตะหน้าจอ = กระโดด',CFG.W/2,170);
    ctx.fillText('กดอีกครั้งกลางอากาศ = Double Jump 🚀',CFG.W/2,196);
    ctx.fillStyle=C.gold; ctx.font="13px 'Kanit',sans-serif";
    ctx.fillText(`🏆 สูงสุด: ${highScore.toLocaleString('th-TH')}   |   🪙 MEE สะสม: ${totalMee}`,CFG.W/2,222);

    const bx=CFG.W/2-100, by=238;
    const pulse=0.5+0.5*sin(500);
    ctx.shadowBlur=18*pulse; ctx.shadowColor=C.purple;
    const bg=ctx.createLinearGradient(bx,by,bx+200,by+50);
    bg.addColorStop(0,C.purple); bg.addColorStop(1,C.orange);
    ctx.fillStyle=bg; rr(ctx,bx,by,200,50,12); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font="bold 19px 'Kanit',sans-serif";
    ctx.fillText('▶ เริ่มเกม',CFG.W/2,by+32);
    ctx.textAlign='left';

    if (state==='idle') rafId=requestAnimationFrame(drawStart);
  }

  // ── Collision ──────────────────────────────────────────────────────────────
  function hitTest(ax,ay,aw,ah,bx,by,bw,bh){
    return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;
  }

  function checkHits() {
    const {x,y,w,h} = player;
    for(const ob of obstacles){
      if(hitTest(x+9,y+9,w-18,h-18, ob.x+4,ob.y+4,ob.w-8,ob.h-8)){
        if(!invincible){ getHit(); break; }
      }
    }
    const px=x+w/2, py=y+h/2;
    coins.forEach(c=>{
      if(!c.done){
        const bob=sin(300,c.ph)*4;
        if(Math.hypot(px-c.x, py-(c.y+bob)) < w/2+c.r-4){
          c.done=true; score+=50; meeEarned+=CFG.MEE_PER_COIN; coinCount++;
          burst(c.x,c.y+sin(300,c.ph)*4,C.gold,10);
          updateUI();
        }
      }
    });
  }

  function getHit(){
    lives--;
    burst(player.x+player.w/2,player.y+player.h/2,'#EF4444',16);
    invincible=true; invEndTime=Date.now()+1500; // 1.5 seconds always
    updateLivesUI();
    if(lives<=0){ endGame(); return; }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  function update(){
    if(state!=='running') return;

    speed = Math.min(CFG.SPEED_MAX, speed+CFG.SPEED_INC);
    dist += speed; score += speed*0.1;

    // Player physics
    player.vy += CFG.GRAVITY; player.y += player.vy;
    if(player.y >= CFG.GROUND-player.h){
      player.y=CFG.GROUND-player.h; player.vy=0; player.grounded=true; player.jumps=0;
    } else { player.grounded=false; }
    if(player.y<0){ player.y=0; player.vy=0; }

    // Invincibility — time-based (not frame-based) so Android slowdown can't freeze it
    if(invincible && Date.now() >= invEndTime) invincible = false;

    // Spawn
    obTimer++; coinTimer++;
    if(obTimer >= obInterval){ obTimer=0; obInterval=Math.max(52,88-speed*3.5); spawnOb(); }
    if(coinTimer >= 65){ coinTimer=0; if(Math.random()<0.72) spawnCoin(); }

    // Move
    obstacles=obstacles.filter(o=>o.x+o.w>-20); obstacles.forEach(o=>o.x-=speed);
    coins=coins.filter(c=>c.x+c.r>-20&&!c.done); coins.forEach(c=>c.x-=speed);

    checkHits();
    if(score>highScore){ highScore=Math.floor(score); localStorage.setItem('mee_hs',highScore); }
  }

  // ── Draw Frame ─────────────────────────────────────────────────────────────
  function draw(){
    ctx.clearRect(0,0,CFG.W,CFG.H);
    drawBG();
    obstacles.forEach(drawOb);
    coins.forEach(c=>{ if(!c.done) drawCoin(c); });
    if(!invincible || Math.floor(Date.now()/80)%2===0) drawPlayer();
    drawParticles();
    drawHUD();
    if(state==='paused'){
      ctx.fillStyle='rgba(5,8,16,0.75)'; ctx.fillRect(0,0,CFG.W,CFG.H);
      ctx.textAlign='center'; ctx.fillStyle=C.violet; ctx.font="bold 34px 'Kanit',sans-serif";
      ctx.fillText('⏸ หยุดชั่วคราว',CFG.W/2,CFG.H/2-20);
      ctx.fillStyle=C.white; ctx.font="16px 'Kanit',sans-serif";
      ctx.fillText('กด Space หรือ P เพื่อเล่นต่อ',CFG.W/2,CFG.H/2+20); ctx.textAlign='left';
    }
    if(state==='gameover') drawGameOver();
  }

  function drawGameOver(){
    drawOverlay('GAME OVER', C.red,[
      {text:`คะแนน: ${Math.floor(score).toLocaleString('th-TH')}`, col:C.white, font:"bold 20px 'Kanit',sans-serif"},
      {text:`สูงสุด: ${highScore.toLocaleString('th-TH')}`, col:C.gold},
      {text:`🪙 MEE ได้รับ: +${meeEarned}`, col:C.green},
      {text:`รวม MEE สะสม: ${totalMee}`, col:C.violet, font:"13px 'Kanit',sans-serif"},
    ], '▶ เล่นอีกครั้ง');
  }

  // ── Main Loop — always reschedule even on error ────────────────────────────
  function loop(){
    try { update(); draw(); } catch(e){ console.warn('[MeeGame] loop err:', e); }
    rafId = requestAnimationFrame(loop);
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  function doJump(){
    if(state==='idle'||state==='gameover'){ startGame(); return; }
    if(state==='paused'){ resume(); return; }
    if(state!=='running') return;
    if(player.grounded||player.jumps<2){
      player.vy = player.grounded ? CFG.JUMP1 : CFG.JUMP2;
      player.grounded=false; player.jumps++;
      burst(player.x+player.w/2,player.y+player.h, player.jumps===1?C.purple:C.orange, 5);
    }
  }

  // ── Game Lifecycle ─────────────────────────────────────────────────────────
  function startGame(){
    cancelAnimationFrame(rafId);
    player.y=CFG.GROUND-player.h; player.vy=0; player.grounded=true; player.jumps=0;
    obstacles=[]; coins=[]; particles=[];
    score=0; meeEarned=0; coinCount=0; lives=CFG.MAX_LIVES;
    speed=CFG.SPEED0; dist=0; obTimer=0; coinTimer=0; obInterval=95;
    invincible=false; invEndTime=0;
    initStars(); updateUI(); updateLivesUI();
    state='running'; loop();
  }

  function pauseGame(){
    if(state!=='running') return;
    state='paused'; cancelAnimationFrame(rafId);
    rafId=requestAnimationFrame(draw);
  }

  function resume(){
    if(state!=='paused') return;
    state='running'; loop();
  }

  function endGame(){
    state='gameover';
    totalMee+=meeEarned; localStorage.setItem('mee_total',totalMee);
    updateUI();
    // Award virtual MEE to demo wallet
    if(window.WalletState?.connected&&window.WalletState?.isDemo&&meeEarned>0){
      window.WalletState.demoBalance=(window.WalletState.demoBalance||0)+meeEarned;
      window.WalletState.balanceMEE=window.WalletState.demoBalance.toFixed(2);
      if(typeof updateWalletUI==='function') updateWalletUI();
      if(typeof showToast==='function') showToast(`+${meeEarned} MEE ได้รับจากเกม! 🎮`,  'success');
    }
  }

  // ── UI Sync ────────────────────────────────────────────────────────────────
  function updateUI(){
    const q=id=>document.getElementById(id);
    if(q('game-score-val')) q('game-score-val').textContent=Math.floor(score).toLocaleString('th-TH');
    if(q('game-mee-val'))   q('game-mee-val').textContent=meeEarned;
    if(q('game-total-val')) q('game-total-val').textContent=totalMee;
    if(q('game-hi-val'))    q('game-hi-val').textContent=highScore.toLocaleString('th-TH');
  }
  function updateLivesUI(){
    const el=document.getElementById('game-lives-val');
    if(el) el.textContent='❤️'.repeat(lives)+'🖤'.repeat(CFG.MAX_LIVES-lives);
  }

  // ── Resize — safe: skips if container not visible yet ──────────────────────
  function resizeCanvas(){
    const wrap=document.getElementById('game-canvas-wrap');
    if(!wrap||!canvas) return;
    const w = wrap.clientWidth || wrap.offsetWidth || 0;
    if(w <= 0) return; // hidden — don't overwrite with 0px
    const scale=Math.min(1, w/CFG.W);
    canvas.style.width =`${CFG.W*scale}px`;
    canvas.style.height=`${CFG.H*scale}px`;
  }

  // ── Init (lazy — only called when game page is actually visible) ────────────
  let listenersAdded = false;
  function init(){
    canvas=document.getElementById('game-canvas');
    if(!canvas) return;
    ctx=canvas.getContext('2d');
    canvas.width=CFG.W; canvas.height=CFG.H;
    initStars(); resizeCanvas();

    if(!listenersAdded){
      listenersAdded = true;
      // Keyboard
      document.addEventListener('keydown',e=>{
        if(['Space','ArrowUp','KeyW'].includes(e.code)){ e.preventDefault(); doJump(); }
        if(e.code==='KeyP'){ if(state==='running') pauseGame(); else if(state==='paused') resume(); }
      });
      // Touch / click on canvas — use both touchstart and pointerdown for Android reliability
      let lastJumpTime = 0;
      function handleCanvasTouch(e){
        e.preventDefault();
        const now = Date.now();
        if(now - lastJumpTime < 80) return; // debounce double-fire
        lastJumpTime = now;
        doJump();
      }
      canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
      canvas.addEventListener('pointerdown', e=>{ if(e.pointerType!=='touch') handleCanvasTouch(e); });
      // Buttons
      const btns={
        'game-start-btn':  ()=>startGame(),
        'game-pause-btn':  ()=>{ if(state==='running') pauseGame(); else if(state==='paused') resume(); },
        'game-restart-btn':()=>startGame(),
      };
      Object.entries(btns).forEach(([id,fn])=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener('click',fn);
      });
      window.addEventListener('resize',resizeCanvas);
    }

    state='idle'; updateUI(); updateLivesUI();
    rafId=requestAnimationFrame(drawStart);
  }

  // ── Retry resize until container has real dimensions (mobile-safe) ──────────
  function resizeWithRetry(attemptsLeft){
    const wrap=document.getElementById('game-canvas-wrap');
    const w = wrap ? (wrap.clientWidth || wrap.offsetWidth || 0) : 0;
    if(w > 0){
      resizeCanvas();
    } else if(attemptsLeft > 0){
      requestAnimationFrame(()=>resizeWithRetry(attemptsLeft-1));
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.MeeGame={ init, startGame, pauseGame, resume };

  // Navigate to game page
  window.addEventListener('meeGameOpen',()=>{
    if(!canvas){
      // First visit — init after 2 rAF frames so layout is computed
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        init();
        resizeWithRetry(20); // retry up to 20 frames if still 0
      }));
    } else {
      // Returning to game page — just resize and restart idle loop
      resizeWithRetry(20);
      if(state==='idle'){
        cancelAnimationFrame(rafId);
        initStars(); updateUI(); updateLivesUI();
        rafId=requestAnimationFrame(drawStart);
      }
    }
  });

})();
