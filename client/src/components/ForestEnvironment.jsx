import React, { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   THE UPSIDE DOWN — Immersive 3D Environment
   "You are not browsing a website. You have crossed through the Gate."
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Parallax hook ─────────────────────────────────────────────────────────
function useParallax() {
  const mouse  = useRef({ x: 0.5, y: 0.5 });
  const target = useRef({ x: 0.5, y: 0.5 });
  const raf    = useRef(null);
  useEffect(() => {
    const lerp = (a,b,t) => a + (b-a)*t;
    const tick = () => {
      mouse.current.x = lerp(mouse.current.x, target.current.x, 0.032);
      mouse.current.y = lerp(mouse.current.y, target.current.y, 0.032);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    const onM = (e) => { target.current = { x: e.clientX/window.innerWidth, y: e.clientY/window.innerHeight }; };
    const onT = (e) => { const t=e.touches[0]; target.current={x:t.clientX/window.innerWidth,y:t.clientY/window.innerHeight}; };
    window.addEventListener("mousemove", onM, {passive:true});
    window.addEventListener("touchmove", onT, {passive:true});
    return () => {
      window.removeEventListener("mousemove", onM);
      window.removeEventListener("touchmove", onT);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);
  return mouse;
}

// ── LAYER 0: THE VOID ─────────────────────────────────────────────────────
function VoidLayer() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: -10,
      background: "#040404",
    }}/>
  );
}

// ── LAYER 1: DEEP FOG ─────────────────────────────────────────────────────
function DeepFog() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: -9,
      background: "radial-gradient(ellipse at center, rgba(20,0,0,0.0) 0%, rgba(0,0,0,0.95) 100%)",
      animation: "fog-breathe 20s ease-in-out infinite",
      transformOrigin: "center center",
      pointerEvents: "none",
    }}/>
  );
}

// ── LAYER 2: VINE NETWORK ─────────────────────────────────────────────────
function VineNetwork() {
  const mouse = useParallax();
  const ref   = useRef(null);
  const raf   = useRef(null);

  useEffect(() => {
    const el = ref.current; if(!el) return;
    const tick = () => {
      const dx = (mouse.current.x - 0.5) * -0.015 * window.innerWidth * 0.3;
      const dy = (mouse.current.y - 0.5) * -0.015 * window.innerHeight * 0.3;
      el.style.transform = `translateX(${dx}px) translateY(${dy}px)`;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if(raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <div ref={ref} style={{
      position: "fixed", inset: "-5%", zIndex: -8,
      pointerEvents: "none",
      willChange: "transform",
    }}>
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
        style={{ width: "110%", height: "110%", opacity: 0.5 }}>
        <defs>
          <filter id="vine-blur"><feGaussianBlur stdDeviation="1.2"/></filter>
        </defs>
        {/* Main thick vines from corners/edges */}
        <path d="M0,900 Q60,780 30,660 Q0,540 50,420 Q100,300 70,180 Q40,60 90,0"
          fill="none" stroke="#1a0a00" strokeWidth="14" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 6s ease-in-out infinite"}}/>
        <path d="M0,700 Q80,620 50,530 Q20,440 70,350 Q120,260 90,170"
          fill="none" stroke="#1a0a00" strokeWidth="9" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 7s ease-in-out infinite 1s"}}/>
        <path d="M1440,900 Q1380,780 1410,660 Q1440,540 1390,420 Q1340,300 1370,180 Q1400,60 1350,0"
          fill="none" stroke="#1a0a00" strokeWidth="14" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 5.5s ease-in-out infinite 0.5s"}}/>
        <path d="M1440,650 Q1360,580 1390,490 Q1420,400 1370,310 Q1320,220 1350,130"
          fill="none" stroke="#1a0a00" strokeWidth="8" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 8s ease-in-out infinite 2s"}}/>
        {/* Top vines creeping down */}
        <path d="M200,0 Q180,80 210,160 Q240,240 200,320"
          fill="none" stroke="#1a0a00" strokeWidth="10" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 6.5s ease-in-out infinite 1.5s"}}/>
        <path d="M700,0 Q720,100 690,200 Q660,300 700,380"
          fill="none" stroke="#1a0a00" strokeWidth="12" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 7.5s ease-in-out infinite 0.8s"}}/>
        <path d="M1100,0 Q1080,90 1110,180 Q1140,270 1100,360"
          fill="none" stroke="#1a0a00" strokeWidth="11" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 5s ease-in-out infinite 3s"}}/>
        {/* Bottom vines creeping up */}
        <path d="M400,900 Q420,800 390,720 Q360,640 400,560 Q440,480 410,400"
          fill="none" stroke="#1a0a00" strokeWidth="16" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 4.5s ease-in-out infinite 1.2s"}}/>
        <path d="M1000,900 Q980,810 1010,730 Q1040,650 1000,570"
          fill="none" stroke="#1a0a00" strokeWidth="13" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 6s ease-in-out infinite 2.5s"}}/>
        {/* Smaller tendrils */}
        <path d="M30,660 Q-10,640 -20,600" fill="none" stroke="#150800" strokeWidth="4" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 5s ease-in-out infinite 0.3s"}}/>
        <path d="M50,420 Q10,400 -10,370" fill="none" stroke="#150800" strokeWidth="3" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 6s ease-in-out infinite 1.8s"}}/>
        <path d="M1410,660 Q1450,640 1460,600" fill="none" stroke="#150800" strokeWidth="4" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 5.5s ease-in-out infinite 0.7s"}}/>
        <path d="M1390,420 Q1430,400 1450,370" fill="none" stroke="#150800" strokeWidth="3" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 7s ease-in-out infinite 2.2s"}}/>
        <path d="M210,160 Q250,180 280,160" fill="none" stroke="#150800" strokeWidth="3" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 4s ease-in-out infinite 1s"}}/>
        <path d="M690,200 Q650,220 630,200" fill="none" stroke="#150800" strokeWidth="4" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 5s ease-in-out infinite 3.5s"}}/>
        <path d="M400,560 Q440,540 460,560" fill="none" stroke="#150800" strokeWidth="5" strokeLinecap="round"
          filter="url(#vine-blur)" style={{animation:"vine-pulse 6s ease-in-out infinite 0.5s"}}/>
      </svg>
    </div>
  );
}

// ── Floating ash particles ────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ps:[], raf:null});

  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    resize();
    window.addEventListener("resize",resize,{passive:true});

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 30 : 70;

    const mk=()=>({
      x:Math.random()*canvas.width,
      y:canvas.height+Math.random()*60,
      sz:  Math.random()*2.2+0.3,
      vx: (Math.random()-0.5)*0.35,
      vy: -(Math.random()*0.55+0.1),
      op:  Math.random()*0.45+0.12,
      pulse: Math.random()*Math.PI*2,
      pspd:  Math.random()*0.008+0.003,
      wobble:Math.random()*Math.PI*2,
      wspd:  Math.random()*0.006+0.002,
      // 0=ash-gray, 1=ember-red, 2=deep-red
      type:[0,0,0,0,0,0,1,1,1,2,2][Math.floor(Math.random()*11)],
      life:0, maxLife:700+Math.random()*2000,
    });
    stateRef.current.ps = Array.from({length:count},mk);

    const cols=[[180,170,160],[183,28,28],[239,83,80]];

    let last=0;
    const animate=(now)=>{
      const dt=Math.min((now-last)/16.67,3); last=now;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const p of stateRef.current.ps){
        p.life+=dt; p.wobble+=p.wspd*dt; p.pulse+=p.pspd*dt;
        p.x+=(p.vx+Math.sin(p.wobble)*0.18)*dt;
        p.y+=p.vy*dt;
        if(p.y<-16||p.life>p.maxLife) Object.assign(p,mk(),{life:0});
        if(p.x<-12) p.x=canvas.width+5;
        if(p.x>canvas.width+12) p.x=-5;
        const[r,g,b]=cols[p.type];
        const osc=0.62+Math.sin(p.pulse)*0.38;
        const op=p.op*osc;
        if(p.type>0){
          const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz*6);
          grd.addColorStop(0,`rgba(${r},${g},${b},${op*0.22})`);
          grd.addColorStop(1,"rgba(0,0,0,0)");
          ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*6,0,Math.PI*2);
          ctx.fillStyle=grd; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${op})`; ctx.fill();
      }
      stateRef.current.raf=requestAnimationFrame(animate);
    };
    stateRef.current.raf=requestAnimationFrame(animate);
    return()=>{
      window.removeEventListener("resize",resize);
      if(stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
    };
  }, []);

  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:4}}/>;
}

// ── Subtle red atmospheric glow ───────────────────────────────────────────
function AtmosphericGlow() {
  return (
    <>
      {/* Top gate glow */}
      <div style={{
        position:"fixed", top:0, left:"30%", width:"40%", height:"25vh",
        background:"radial-gradient(ellipse at 50% 0%, rgba(183,28,28,0.08) 0%, transparent 70%)",
        pointerEvents:"none", zIndex: -7,
        animation:"breathe 8s ease-in-out infinite",
      }}/>
      {/* Bottom ground mist */}
      <div style={{
        position:"fixed", bottom:0, left:"-5%", width:"110%", height:"20vh",
        background:"linear-gradient(to top, rgba(4,4,4,0.95) 0%, rgba(183,28,28,0.04) 60%, transparent 100%)",
        pointerEvents:"none", zIndex: -6,
      }}/>
    </>
  );
}

// ── Gate Portal Glow — Pulsing circular portal in upper center ─────────────
function GatePortalGlow() {
  return (
    <div style={{
      position: "fixed",
      top: "-5%",
      left: "50%",
      transform: "translateX(-50%)",
      width: "clamp(200px, 30vw, 400px)",
      height: "clamp(200px, 30vw, 400px)",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(183,28,28,0.06) 0%, rgba(127,0,0,0.03) 40%, transparent 70%)",
      boxShadow: "0 0 80px rgba(183,28,28,0.05), 0 0 160px rgba(127,0,0,0.03)",
      pointerEvents: "none",
      zIndex: -5,
      animation: "breathe 6s ease-in-out infinite",
    }}>
      {/* Inner ring */}
      <div style={{
        position: "absolute",
        inset: "20%",
        borderRadius: "50%",
        border: "1px solid rgba(239,83,80,0.06)",
        boxShadow: "0 0 30px rgba(239,83,80,0.04), inset 0 0 30px rgba(183,28,28,0.03)",
        animation: "breathe 4s ease-in-out infinite reverse",
      }}/>
      {/* Core */}
      <div style={{
        position: "absolute",
        inset: "40%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(239,83,80,0.08) 0%, transparent 70%)",
        animation: "breathe 3s ease-in-out infinite",
      }}/>
    </div>
  );
}

/* ── Main Export ─────────────────────────────────────────────────────────── */
export default function ForestEnvironment() {
  return (
    <div id="upside-down-env" style={{
      position:"fixed", inset:0, overflow:"hidden",
      pointerEvents:"none", zIndex:0,
      perspective: "1200px",
      transformStyle: "preserve-3d",
    }}>
      <VoidLayer/>
      <DeepFog/>
      <VineNetwork/>
      <AtmosphericGlow/>
      <GatePortalGlow/>
      <ParticleCanvas/>
    </div>
  );
}

