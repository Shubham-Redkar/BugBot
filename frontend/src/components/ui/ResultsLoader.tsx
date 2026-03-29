// ResultsLoader.tsx — Place at: src/components/ui/ResultsLoader.tsx

import { type FC, useEffect, useRef, useState } from "react";

// ─── Steps ────────────────────────────────────────────────────────────────────
// Steps 0-5 animate freely to 95%.
// Steps 6-7 are HELD (red/pending) until dataReady, then burst to 100%.
const COMPILE_STEPS = [
  { label: "PARSING RAW TELEMETRY",       duration: 400 },
  { label: "CLUSTERING ANOMALY VECTORS",  duration: 480 },
  { label: "RUNNING NEURAL CLASSIFIER",   duration: 520 },
  { label: "SCORING SEVERITY INDICES",    duration: 360 },
  { label: "GENERATING REMEDIATION MAP",  duration: 440 },
  { label: "COMPRESSING INTELLIGENCE",    duration: 320 },
  { label: "AWAITING PAYLOAD",            duration: 0   }, // held red
  { label: "READY FOR EXTRACTION",        duration: 0   }, // held red
];
const HOLD_FROM     = 6;   // first step index to hold
const HOLD_PROGRESS = 95;  // progress % to hold at

// ─── Hex ring ─────────────────────────────────────────────────────────────────
const HexRing: FC<{ progress: number; holding: boolean }> = ({ progress, holding }) => {
  const R = 70; const cx = 90; const cy = 90;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  const hexPath = hex.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + " Z";
  const perim   = 6 * R;
  const offset  = perim - (progress / 100) * perim;
  const done    = progress === 100;

  const stroke = done ? "#00FF88" : holding ? "#FF4060" : "#00F5FF";
  const glow   = done ? "rgba(0,255,136,0.9)" : holding ? "rgba(255,64,96,0.85)" : "rgba(0,245,255,0.9)";

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r="82" fill="none" stroke="rgba(0,245,255,0.04)" strokeWidth="1"/>
      <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(0,245,255,0.05)" strokeWidth="0.5"/>
      <path d={hexPath} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" strokeLinejoin="round"/>
      <path d={hexPath} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round"
        strokeDasharray={perim} strokeDashoffset={offset}
        style={{ filter:`drop-shadow(0 0 8px ${glow}) drop-shadow(0 0 22px ${glow})`, transition:"stroke-dashoffset 0.55s cubic-bezier(0.16,1,0.3,1),stroke 0.4s ease" }}
      />
      {Array.from({length:6},(_,i)=>{
        const a=(Math.PI/3)*i-Math.PI/6; const r=55;
        return <line key={i}
          x1={(cx+r*Math.cos(a)).toFixed(1)} y1={(cy+r*Math.sin(a)).toFixed(1)}
          x2={(cx+r*Math.cos(a+Math.PI/3)).toFixed(1)} y2={(cy+r*Math.sin(a+Math.PI/3)).toFixed(1)}
          stroke="rgba(0,245,255,0.05)" strokeWidth="0.5"/>;
      })}
      {hex.map(([hx,hy],i)=>{
        const a=(Math.PI/3)*i-Math.PI/6;
        return <circle key={i}
          cx={(cx+(R+10)*Math.cos(a)).toFixed(1)} cy={(cy+(R+10)*Math.sin(a)).toFixed(1)} r="1.5"
          fill={progress>(i/6)*100 ? stroke : "rgba(255,255,255,0.07)"}
          style={{transition:"fill 0.3s"}}/>;
      })}
      <text x="90" y="82" textAnchor="middle" style={{
        fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:"28px",
        fill:stroke, filter:`drop-shadow(0 0 14px ${glow})`, transition:"fill 0.4s,filter 0.4s",
      }}>{progress}</text>
      <text x="90" y="96" textAnchor="middle" style={{
        fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
        fill: holding?"rgba(255,64,96,0.45)":done?"rgba(0,255,136,0.5)":"rgba(0,245,255,0.4)",
        letterSpacing:"0.2em", transition:"fill 0.4s",
      }}>%</text>
      <text x="90" y="112" textAnchor="middle" style={{
        fontFamily:"'Share Tech Mono',monospace", fontSize:"7px",
        fill: holding?"rgba(255,64,96,0.4)":done?"rgba(0,255,136,0.5)":"rgba(0,245,255,0.3)",
        letterSpacing:"0.15em", transition:"fill 0.4s",
      }}>{done?"COMPLETE":holding?"AWAITING":"COMPILING"}</text>
    </svg>
  );
};

// ─── Cyan burst lines rising from bottom on completion ────────────────────────
const BurstLines: FC<{ active: boolean }> = ({ active }) => {
  const lines = useRef(Array.from({length:36},(_,i)=>({
    x: `${(i/36)*100+Math.random()*1.5}%`,
    delay: Math.random()*400,
    dur: 0.55+Math.random()*0.55,
    opacity: 0.35+Math.random()*0.65,
    w: 1+Math.random()*1.5,
  })));
  if (!active) return null;
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:600,overflow:"hidden"}}>
      {lines.current.map((l,i)=>(
        <div key={i} style={{
          position:"absolute", bottom:0, left:l.x,
          width:`${l.w}px`, height:"0%",
          background:`linear-gradient(to top,transparent,rgba(0,245,255,${l.opacity}),rgba(0,245,255,0.08),transparent)`,
          boxShadow:`0 0 6px rgba(0,245,255,0.9),0 0 12px rgba(0,245,255,0.4)`,
          animation:`burstRise ${l.dur}s cubic-bezier(0.16,1,0.3,1) ${l.delay}ms both`,
        }}/>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
interface ResultsLoaderProps {
  onComplete: () => void;
  dataReady:  boolean;
}

const ResultsLoader: FC<ResultsLoaderProps> = ({ onComplete, dataReady }) => {
  const [progress,  setProgress]  = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [holding,   setHolding]   = useState(false);
  const [burst,     setBurst]     = useState(false);
  const [exiting,   setExiting]   = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [dataLines, setDataLines] = useState<string[]>([]);
  const logRef       = useRef<HTMLDivElement>(null);
  const dataReadyRef = useRef(dataReady);
  dataReadyRef.current = dataReady;

  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),50); return()=>clearTimeout(t); },[]);
  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; },[dataLines]);

  // ── Main animation sequence ────────────────────────────────────────────────
  useEffect(()=>{
    let dead=false;
    const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));

    const run=async()=>{
      // Phase 1 — animate steps 0–5 up to 95%
      const phase1=COMPILE_STEPS.slice(0,HOLD_FROM);
      const total1=phase1.reduce((s,c)=>s+c.duration,0);
      let cum=0;

      for(let i=0;i<phase1.length;i++){
        if(dead)return;
        setStepIndex(i);
        const step=phase1[i];
        cum+=step.duration;
        const tgt=Math.round((cum/total1)*HOLD_PROGRESS);
        const start=Math.round(((cum-step.duration)/total1)*HOLD_PROGRESS);
        for(let t=0;t<=10;t++){
          await wait(step.duration/10);
          if(dead)return;
          setProgress(Math.round(start+(t/10)*(tgt-start)));
          if(t===5) setDataLines(p=>[...p.slice(-12),step.label]);
        }
        setDoneSteps(p=>[...p,i]);
      }

      // Phase 2 — HOLD at 95%, show red pending steps, wait for data
      if(dead)return;
      setProgress(HOLD_PROGRESS);
      setStepIndex(HOLD_FROM);
      setHolding(true);
      setDataLines(p=>[...p.slice(-12),"AWAITING PAYLOAD — SIGNAL INCOMPLETE"]);

      while(!dataReadyRef.current){
        await wait(80);
        if(dead)return;
      }

      // Phase 3 — data arrived, flash to green and rush to 100%
      setHolding(false);
      setDataLines(p=>[...p.slice(-12),"PAYLOAD RECEIVED — FINALIZING EXTRACTION"]);

      for(let t=0;t<=20;t++){
        await wait(600/20);
        if(dead)return;
        setProgress(Math.round(HOLD_PROGRESS+(t/20)*(100-HOLD_PROGRESS)));
      }

      setDoneSteps(p=>[...p,HOLD_FROM,HOLD_FROM+1]);
      setStepIndex(HOLD_FROM+1);
      setDataLines(p=>[...p.slice(-12),"READY FOR EXTRACTION — ALL SYSTEMS NOMINAL"]);

      await wait(500);
      if(dead)return;

      // Phase 4 — burst + exit
      setBurst(true);
      await wait(950);
      if(dead)return;
      setExiting(true);
      await wait(520);
      if(!dead) onComplete();
    };

    run();
    return()=>{ dead=true; };
  },[]); // eslint-disable-line

  const isComplete = progress===100;

  // Derived colors
  const accentR = "255,64,96";
  const accentC = "0,245,255";
  const accentG = "0,255,136";
  const accent  = holding ? `rgba(${accentR},0.7)` : isComplete ? `rgba(${accentG},0.8)` : `rgba(${accentC},0.55)`;

  return(<>
    <style>{`
      @keyframes compilePulse{0%,100%{box-shadow:0 0 0 0 rgba(0,245,255,0)}50%{box-shadow:0 0 0 5px rgba(0,245,255,0.12)}}
      @keyframes redPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,64,96,0)}50%{box-shadow:0 0 0 5px rgba(255,64,96,0.18)}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      @keyframes pendingBlink{0%,100%{opacity:1}50%{opacity:0.4}}
      @keyframes scanLine{0%{top:0%;opacity:0.5}100%{top:100%;opacity:0}}
      @keyframes stepIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
      @keyframes burstRise{0%{height:0%;opacity:0}25%{opacity:1}100%{height:115%;opacity:0}}
      @keyframes completionFlare{0%{opacity:0;transform:scale(0.85)}35%{opacity:1}100%{opacity:0;transform:scale(1.7)}}
      @keyframes greenPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0)}50%{box-shadow:0 0 0 5px rgba(0,255,136,0.15)}}
    `}</style>

    <BurstLines active={burst}/>

    {/* Overlay */}
    <div style={{
      position:"fixed",inset:0,zIndex:500,
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(5,5,5,0.97)",backdropFilter:"blur(12px)",
      opacity:mounted&&!exiting?1:0,
      transform:exiting?"scale(1.05)":"scale(1)",
      transition:"opacity 0.5s ease,transform 0.55s ease",
    }}>

      {/* Completion radial flare */}
      {isComplete&&(
        <div style={{
          position:"absolute",inset:0,pointerEvents:"none",
          background:`radial-gradient(ellipse at center,rgba(0,245,255,0.16) 0%,transparent 65%)`,
          animation:"completionFlare 1.1s ease forwards",
        }}/>
      )}

      {/* Scan line — red when holding, cyan otherwise */}
      <div style={{
        position:"absolute",left:0,right:0,height:"1px",pointerEvents:"none",
        background:`linear-gradient(90deg,transparent,${holding?"rgba(255,64,96,0.4)":"rgba(0,245,255,0.4)"},transparent)`,
        animation:"scanLine 3s linear infinite",transition:"background 0.4s",
      }}/>

      {/* Corner brackets */}
      {([
        {t:24,l:24,bt:true,bl:true},{t:24,r:24,bt:true,br:true},
        {b:24,l:24,bb:true,bl:true},{b:24,r:24,bb:true,br:true},
      ] as any[]).map((c,i)=>{
        const col=holding?`rgba(${accentR},0.3)`:isComplete?`rgba(${accentG},0.4)`:`rgba(${accentC},0.35)`;
        return(
          <div key={i} style={{
            position:"absolute",width:28,height:28,
            top:c.t,bottom:c.b,left:c.l,right:c.r,
            borderTop:c.bt?`1px solid ${col}`:undefined,
            borderBottom:c.bb?`1px solid ${col}`:undefined,
            borderLeft:c.bl?`1px solid ${col}`:undefined,
            borderRight:c.br?`1px solid ${col}`:undefined,
            transition:"border-color 0.4s",
          }}/>
        );
      })}

      {/* Content row */}
      <div style={{
        display:"flex",gap:"64px",alignItems:"flex-start",padding:"0 24px",
        opacity:mounted?1:0,transform:mounted?"translateY(0)":"translateY(20px)",
        transition:"opacity 0.7s cubic-bezier(0.16,1,0.3,1),transform 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* LEFT */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"20px",flexShrink:0}}>
          <HexRing progress={progress} holding={holding}/>

          {/* Status label */}
          <div style={{
            fontFamily:"'Share Tech Mono',monospace",fontSize:"9px",letterSpacing:"0.25em",
            color:accent,display:"flex",alignItems:"center",gap:"8px",transition:"color 0.4s",
          }}>
            <span style={{
              display:"inline-block",width:6,height:6,borderRadius:"50%",
              background:holding?"#FF4060":isComplete?"#00FF88":"#00F5FF",
              boxShadow:holding?"0 0 8px #FF4060":isComplete?"0 0 8px #00FF88":"0 0 8px #00F5FF",
              animation:holding?"redPulse 0.8s ease-in-out infinite":isComplete?"greenPulse 1s ease-in-out infinite":"compilePulse 1s ease-in-out infinite",
              transition:"background 0.4s,box-shadow 0.4s",
            }}/>
            {holding?"AWAITING PAYLOAD":isComplete?"EXTRACTION READY":"COMPILING INTELLIGENCE"}
          </div>

          {/* Sub status */}
          <div style={{
            fontFamily:"'Share Tech Mono',monospace",fontSize:"8px",letterSpacing:"0.2em",
            color:holding?"rgba(255,64,96,0.55)":isComplete?"rgba(0,255,136,0.45)":"rgba(0,245,255,0.25)",
            textAlign:"center",maxWidth:"180px",lineHeight:1.8,
            animation:holding?"pendingBlink 1.2s ease-in-out infinite":"none",
            transition:"color 0.4s",
          }}>
            {holding
              ?"SIGNAL INCOMPLETE — HOLDING AT 95%"
              :isComplete
              ?"ALL SYSTEMS NOMINAL"
              :(COMPILE_STEPS[stepIndex]?.label??"FINALIZING...")}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{display:"flex",flexDirection:"column",gap:"6px",minWidth:"300px",maxWidth:"340px"}}>

          <div style={{
            fontFamily:"'Share Tech Mono',monospace",fontSize:"8px",letterSpacing:"0.25em",
            color:"rgba(0,245,255,0.22)",marginBottom:"8px",
          }}>── COMPILATION PIPELINE ──</div>

          {COMPILE_STEPS.map((step,i)=>{
            const isDone   = doneSteps.includes(i);
            const isActive = stepIndex===i&&!isDone;
            const isHeld   = i>=HOLD_FROM&&holding&&!isDone;
            const isPending= i>=HOLD_FROM&&!isDone&&!isHeld;

            const borderCol = isHeld
              ?"rgba(255,64,96,0.4)"
              :isDone&&i>=HOLD_FROM?"rgba(0,255,136,0.22)"
              :isDone?"rgba(0,245,255,0.1)"
              :isActive?"rgba(0,245,255,0.2)"
              :"rgba(255,255,255,0.03)";

            const bg = isHeld?"rgba(255,64,96,0.07)":isDone&&i>=HOLD_FROM?"rgba(0,255,136,0.04)":isActive?"rgba(0,245,255,0.04)":"transparent";

            const dotBg = isHeld?"#FF4060":isDone?"#00FF88":isActive?"#00F5FF":"rgba(255,255,255,0.08)";
            const dotShadow= isHeld?"0 0 8px rgba(255,64,96,0.9)":isDone?"0 0 6px #00FF88":isActive?"0 0 8px #00F5FF":"none";

            const labelCol = isHeld
              ?"rgba(255,64,96,0.9)"
              :isDone&&i>=HOLD_FROM?"rgba(0,255,136,0.85)"
              :isDone?"rgba(0,255,136,0.7)"
              :isActive?"rgba(0,245,255,0.85)"
              :"rgba(255,255,255,0.1)";

            const badge = isHeld?"⚠":isDone?"✓":isActive?"...":"";
            const badgeCol = isHeld?"rgba(255,64,96,0.7)":isDone?"rgba(0,255,136,0.55)":"rgba(0,245,255,0.5)";

            return(
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:"10px",
                padding:"7px 12px",borderRadius:"4px",
                border:`1px solid ${borderCol}`,background:bg,
                opacity:isPending?0.18:1,
                transition:"border-color 0.35s,background 0.35s,opacity 0.35s",
                boxShadow:isHeld?"inset 0 0 14px rgba(255,64,96,0.05)":"none",
              }}>
                <div style={{
                  width:6,height:6,borderRadius:"50%",flexShrink:0,
                  background:dotBg,boxShadow:dotShadow,
                  transition:"background 0.35s,box-shadow 0.35s",
                  animation:isHeld?"redPulse 0.8s ease-in-out infinite":isActive?"compilePulse 0.8s ease-in-out infinite":isDone&&i>=HOLD_FROM?"greenPulse 1s ease-in-out infinite":"none",
                }}/>
                <div style={{
                  fontFamily:"'Share Tech Mono',monospace",fontSize:"9px",letterSpacing:"0.12em",
                  color:labelCol,flex:1,transition:"color 0.35s",
                  animation:isHeld?"pendingBlink 1.2s ease-in-out infinite":"none",
                }}>{step.label}</div>
                <div style={{
                  fontFamily:"'Share Tech Mono',monospace",fontSize:"7px",letterSpacing:"0.12em",
                  color:badgeCol,fontWeight:isHeld?700:400,transition:"color 0.35s",
                }}>{badge}</div>
              </div>
            );
          })}

          {/* Log */}
          <div style={{
            marginTop:"14px",borderRadius:"6px",overflow:"hidden",
            border:`1px solid ${holding?"rgba(255,64,96,0.12)":isComplete?"rgba(0,255,136,0.1)":"rgba(0,245,255,0.07)"}`,
            background:"rgba(0,0,0,0.5)",transition:"border-color 0.4s",
          }}>
            <div style={{
              padding:"7px 12px",display:"flex",alignItems:"center",gap:"6px",
              borderBottom:`1px solid ${holding?"rgba(255,64,96,0.08)":"rgba(0,245,255,0.05)"}`,
              background:"rgba(0,0,0,0.3)",transition:"border-color 0.4s",
            }}>
              {["rgba(255,0,64,0.5)","rgba(255,180,0,0.5)","rgba(0,245,255,0.35)"].map(c=>(
                <span key={c} style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:c}}/>
              ))}
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"7px",letterSpacing:"0.15em",color:"#1e1e1e",marginLeft:"6px"}}>
                PIPELINE // LIVE
              </span>
            </div>
            <div ref={logRef} style={{height:"76px",overflowY:"hidden",padding:"8px 12px"}}>
              {dataLines.map((line,idx)=>(
                <div key={idx} style={{
                  fontFamily:"'Share Tech Mono',monospace",fontSize:"8px",lineHeight:1.9,
                  color:idx===dataLines.length-1
                    ?(holding?"rgba(255,64,96,0.75)":isComplete?"rgba(0,255,136,0.75)":"rgba(0,245,255,0.6)")
                    :"rgba(0,245,255,0.11)",
                  display:"flex",alignItems:"baseline",gap:"6px",
                  animation:"stepIn 0.2s ease both",
                }}>
                  <span style={{color:"rgba(0,245,255,0.18)",flexShrink:0}}>›</span>
                  {line}
                  {idx===dataLines.length-1&&(
                    <span style={{
                      color:holding?"#FF4060":isComplete?"#00FF88":"#00F5FF",
                      animation:"blink 1s step-start infinite",
                    }}>_</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>);
};

export default ResultsLoader;