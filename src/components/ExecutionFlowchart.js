import React, { useState, useEffect, useRef, useCallback } from 'react';

// Colors per stage type
const STAGE_COLOR = {
  parse:   '#a78bfa',
  from:    '#f7971e',
  join:    '#ff6584',
  where:   '#43e97b',
  groupby: '#c084fc',
  having:  '#fda085',
  distinct:'#84fab0',
  select:  '#6c63ff',
  subq:    '#f093fb',
  orderby: '#38bdf8',
  limit:   '#f472b6',
};
function stageColor(id) {
  for (const [k,v] of Object.entries(STAGE_COLOR)) if (id.startsWith(k)) return v;
  return '#6c63ff';
}

// ── Main flowchart ───────────────────────────────────────────────────────────
export default function ExecutionFlowchart({ parsed }) {
  const [activeNode, setActiveNode] = useState(null);
  const [revealedUpTo, setRevealedUpTo] = useState(-1);
  const [particles, setParticles] = useState([]);
  const particleId = useRef(0);

  // Reveal nodes one by one on mount / parsed change
  useEffect(() => {
    if (!parsed) { setRevealedUpTo(-1); setActiveNode(null); return; }
    setRevealedUpTo(-1);
    setActiveNode(null);
    let i = 0;
    const tick = () => {
      setRevealedUpTo(i);
      i++;
      if (i < parsed.stages.length) setTimeout(tick, 220);
    };
    setTimeout(tick, 100);
  }, [parsed]);

  // Spawn flowing particles along the pipeline
  const spawnParticle = useCallback((fromIdx) => {
    const id = particleId.current++;
    setParticles(ps => [...ps, { id, fromIdx, progress: 0, born: Date.now() }]);
  }, []);

  useEffect(() => {
    if (!parsed || parsed.stages.length < 2) return;
    let stageIdx = 0;
    const loop = setInterval(() => {
      if (stageIdx < parsed.stages.length - 1) {
        spawnParticle(stageIdx);
        stageIdx = (stageIdx + 1) % (parsed.stages.length - 1);
      }
    }, 600);
    return () => clearInterval(loop);
  }, [parsed, spawnParticle]);

  // Animate particles
  useEffect(() => {
    let raf;
    const step = () => {
      setParticles(ps =>
        ps
          .map(p => ({ ...p, progress: p.progress + 0.025 }))
          .filter(p => p.progress < 1)
      );
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!parsed) return null;
  const stages = parsed.stages;
  const NODE_W = 220;
  const NODE_H = 64;
  const CONN_H = 52;
  const totalH = stages.length * NODE_H + (stages.length - 1) * CONN_H + 40;
  const SVG_W  = NODE_W + 160; // extra for side labels

  return (
    <div style={S.outer}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.title}>🔀 Interactive Execution Flowchart</span>
        <span style={S.sub}>Click any node to explore — watch data flow down</span>
        <span style={{
          ...S.badge,
          background: parsed.complexity==='Simple'?'rgba(67,233,123,0.15)':parsed.complexity==='Moderate'?'rgba(247,151,30,0.15)':'rgba(255,101,132,0.15)',
          color: parsed.complexity==='Simple'?'#43e97b':parsed.complexity==='Moderate'?'#f7971e':'#ff6584',
        }}>
          {parsed.complexity} · {parsed.stages.length} steps
        </span>
      </div>

      <div style={S.body}>
        {/* SVG pipeline */}
        <div style={S.svgWrap}>
          <svg width={SVG_W} height={totalH} style={S.svg}>
            <defs>
              {stages.map((s,i) => {
                const col = stageColor(s.id);
                return (
                  <radialGradient key={s.id} id={`grd_${i}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={col} stopOpacity="0.25"/>
                    <stop offset="100%" stopColor={col} stopOpacity="0.05"/>
                  </radialGradient>
                );
              })}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Connector lines between nodes */}
            {stages.map((s, i) => {
              if (i === stages.length - 1) return null;
              const x = SVG_W / 2;
              const y1 = i * (NODE_H + CONN_H) + NODE_H;
              const y2 = y1 + CONN_H;
              const col = stageColor(s.id);
              const revealed = revealedUpTo >= i + 1;
              return (
                <g key={`conn_${i}`}>
                  {/* Dashed track */}
                  <line x1={x} y1={y1} x2={x} y2={y2}
                    stroke={col} strokeWidth="2" strokeDasharray="4 4"
                    opacity={revealed ? 0.35 : 0.1}/>
                  {/* Solid fill as connector reveals */}
                  {revealed && <line x1={x} y1={y1} x2={x} y2={y2}
                    stroke={col} strokeWidth="2" opacity="0.7"/>}
                  {/* Arrowhead */}
                  {revealed && <polygon
                    points={`${x-6},${y2-8} ${x+6},${y2-8} ${x},${y2}`}
                    fill={col} opacity="0.9"/>}
                  {/* Row-effect label */}
                  {revealed && s.rowEffect && (
                    <text x={x + 14} y={(y1+y2)/2+4}
                      fontSize="9" fill={col} opacity="0.85"
                      fontFamily="'DM Mono',monospace" letterSpacing="0.5">
                      {rowEffectLabel(s.rowEffect)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Flowing particles */}
            {particles.map(p => {
              const col = stageColor(stages[p.fromIdx]?.id || 'select');
              const x = SVG_W / 2;
              const y1 = p.fromIdx * (NODE_H + CONN_H) + NODE_H;
              const y2 = y1 + CONN_H;
              const cy = y1 + (y2 - y1) * p.progress;
              return (
                <circle key={p.id} cx={x} cy={cy} r="4"
                  fill={col} opacity={0.9 - p.progress * 0.5}
                  filter="url(#glow)"/>
              );
            })}

            {/* Nodes */}
            {stages.map((stage, i) => {
              const col = stageColor(stage.id);
              const y = i * (NODE_H + CONN_H) + 8;
              const x = (SVG_W - NODE_W) / 2;
              const isActive = activeNode === i;
              const revealed = revealedUpTo >= i;

              return (
                <g key={stage.id}
                  onClick={() => setActiveNode(isActive ? null : i)}
                  style={{ cursor: 'pointer' }}
                  opacity={revealed ? 1 : 0}
                >
                  {/* Glow background when active */}
                  {isActive && <rect x={x-4} y={y-4} width={NODE_W+8} height={NODE_H+8}
                    rx="14" fill={`url(#grd_${i})`} />}

                  {/* Node card */}
                  <rect x={x} y={y} width={NODE_W} height={NODE_H} rx="10"
                    fill="#13131c"
                    stroke={isActive ? col : '#2a2a3a'}
                    strokeWidth={isActive ? 2 : 1}
                  />

                  {/* Left color strip */}
                  <rect x={x} y={y} width="5" height={NODE_H} rx="3" fill={col}/>

                  {/* Step number */}
                  <rect x={x+14} y={y+12} width="22" height="22" rx="6"
                    fill={col} opacity="0.2" stroke={col} strokeWidth="0.5"/>
                  <text x={x+25} y={y+27} textAnchor="middle"
                    fontSize="10" fontWeight="700" fill={col}
                    fontFamily="'DM Mono',monospace">{i+1}</text>

                  {/* Icon */}
                  <text x={x+48} y={y+28} fontSize="16" dominantBaseline="middle">{stage.icon}</text>

                  {/* Label */}
                  <text x={x+70} y={y+22} fontSize="12" fontWeight="600" fill="#e8e8f0"
                    fontFamily="'DM Sans',sans-serif">{stage.label.slice(0,24)}{stage.label.length>24?'…':''}</text>
                  <text x={x+70} y={y+38} fontSize="10" fill="#6060788"
                    fontFamily="'DM Mono',monospace"
                    style={{fill:'#505068'}}>{stage.detail ? stage.detail.slice(0,30)+(stage.detail.length>30?'…':'') : ''}</text>

                  {/* Expand indicator */}
                  <text x={x+NODE_W-16} y={y+35} fontSize="10" fill={col} opacity="0.7"
                    fontFamily="'DM Mono',monospace">{isActive ? '▲' : '▼'}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel — slides in when node active */}
        <div style={{
          ...S.detail,
          opacity: activeNode !== null ? 1 : 0,
          transform: activeNode !== null ? 'translateX(0)' : 'translateX(16px)',
          pointerEvents: activeNode !== null ? 'all' : 'none',
        }}>
          {activeNode !== null && (() => {
            const s = stages[activeNode];
            const col = stageColor(s.id);
            return (
              <>
                <div style={{...S.detailHeader, borderBottomColor: `${col}40`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:24}}>{s.icon}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:col,fontFamily:'var(--mono)'}}>{s.label}</div>
                      <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:1}}>Step {activeNode+1} of {stages.length}</div>
                    </div>
                  </div>
                  <button onClick={()=>setActiveNode(null)} style={S.closeBtn}>✕</button>
                </div>

                <div style={S.detailBody}>
                  <p style={S.detailDesc}>{s.description}</p>

                  {s.detail && (
                    <div style={{...S.detailCode, borderLeftColor: col}}>
                      <span style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>SQL Fragment</span>
                      <span style={{fontSize:12,color:col,fontFamily:'var(--mono)'}}>{s.detail}</span>
                    </div>
                  )}

                  {s.rowEffect && (
                    <div style={{...S.rowEffectBox, background:`${col}10`, borderColor:`${col}30`}}>
                      <span style={{fontSize:18}}>{rowEffectIcon(s.rowEffect)}</span>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:col}}>{rowEffectTitle(s.rowEffect)}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>{rowEffectDesc(s.rowEffect)}</div>
                      </div>
                    </div>
                  )}

                  {/* Prev / Next */}
                  <div style={S.navRow}>
                    <button style={{...S.navBtn, opacity: activeNode>0?1:0.3}} onClick={()=>setActiveNode(n=>Math.max(0,n-1))} disabled={activeNode===0}>← Prev</button>
                    <span style={{fontSize:11,color:'var(--text3)'}}>{activeNode+1} / {stages.length}</span>
                    <button style={{...S.navBtn, opacity: activeNode<stages.length-1?1:0.3}} onClick={()=>setActiveNode(n=>Math.min(stages.length-1,n+1))} disabled={activeNode===stages.length-1}>Next →</button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Tips */}
      {parsed.tips.length > 0 && (
        <div style={S.tips}>
          <div style={S.tipsTitle}>💡 Performance Tips</div>
          {parsed.tips.map((tip,i) => (
            <div key={i} style={{...S.tip, borderLeftColor: tip.type==='error'?'#ff6584':tip.type==='warn'?'#f7971e':'#6c63ff', background: tip.type==='error'?'rgba(255,101,132,0.05)':tip.type==='warn'?'rgba(247,151,30,0.05)':'rgba(108,99,255,0.05)'}}>
              {tip.type==='error'?'🚨':tip.type==='warn'?'⚠️':'ℹ️'} {tip.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function rowEffectLabel(e) {
  return {all:'load all rows',join:'match + combine',reduce:'filter ↓',group:'group rows',project:'pick columns',limit:'truncate ✂'}[e]||'';
}
function rowEffectIcon(e) {
  return {all:'📥',join:'🔗',reduce:'🔽',group:'🗂',project:'🎯',limit:'✂️'}[e]||'➡️';
}
function rowEffectTitle(e) {
  return {all:'All rows loaded',join:'Rows joined',reduce:'Rows reduced',group:'Rows grouped',project:'Columns projected',limit:'Result truncated'}[e]||'';
}
function rowEffectDesc(e) {
  return {
    all:'Full table scan — every row enters the pipeline.',
    join:'Matching rows from both tables combined into one.',
    reduce:'Rows that fail the condition are discarded here.',
    group:'Multiple rows collapsed into aggregate groups.',
    project:'Only selected columns survive to the output.',
    limit:'Only the first N rows returned to the client.',
  }[e]||'';
}

const S = {
  outer:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'},
  header:{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg2)',flexWrap:'wrap'},
  title:{fontSize:13,fontWeight:700,color:'var(--text)',fontFamily:'var(--mono)',flex:1},
  sub:{fontSize:11,color:'var(--text3)'},
  badge:{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,fontFamily:'var(--mono)'},
  body:{display:'flex',gap:0,alignItems:'flex-start',padding:'16px',overflowX:'auto'},
  svgWrap:{flexShrink:0},
  svg:{overflow:'visible',display:'block'},
  detail:{
    flex:1, minWidth:200, maxWidth:320,
    background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,
    marginLeft:16, transition:'all 0.3s ease', overflow:'hidden',
    position:'sticky', top:0,
  },
  detailHeader:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderBottom:'1px solid'},
  closeBtn:{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:14,padding:'2px 6px'},
  detailBody:{padding:14,display:'flex',flexDirection:'column',gap:12},
  detailDesc:{fontSize:13,color:'var(--text2)',lineHeight:1.7},
  detailCode:{borderLeft:'2px solid',padding:'8px 10px',background:'var(--bg3)',borderRadius:'0 6px 6px 0'},
  rowEffectBox:{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 12px',border:'1px solid',borderRadius:8},
  navRow:{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid var(--border)'},
  navBtn:{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text2)',cursor:'pointer',fontSize:12,padding:'5px 12px',fontFamily:'var(--sans)'},
  tips:{padding:'12px 16px',borderTop:'1px solid var(--border)',background:'var(--bg2)',display:'flex',flexDirection:'column',gap:6},
  tipsTitle:{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:1,marginBottom:2},
  tip:{fontSize:12,color:'var(--text2)',padding:'8px 10px',borderLeft:'3px solid',borderRadius:'0 6px 6px 0',lineHeight:1.5},
};