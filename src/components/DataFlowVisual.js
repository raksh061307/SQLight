import React, { useEffect, useRef, useState } from 'react';

const PALETTE = ['#6c63ff','#f7971e','#ff6584','#43e97b','#c084fc','#38bdf8','#fda085','#84fab0'];
function tableColor(name, idx) {
  const n = name.toLowerCase();
  if (n.includes('user')||n.includes('member')||n.includes('customer')) return '#6c63ff';
  if (n.includes('product')||n.includes('item')) return '#f7971e';
  if (n.includes('order')||n.includes('purchase')) return '#ff6584';
  if (n.includes('review')||n.includes('comment')) return '#43e97b';
  return PALETTE[idx % PALETTE.length];
}

export default function DataFlowVisual({ parsed, schema }) {
  const [animStep, setAnimStep] = useState(-1);
  const timerRef = useRef();

  useEffect(() => {
    if (!parsed) return;
    setAnimStep(-1);
    clearInterval(timerRef.current);
    let i = 0;
    timerRef.current = setInterval(() => {
      setAnimStep(i); i++;
      if (i >= parsed.tables.length + 1) clearInterval(timerRef.current);
    }, 550);
    return () => clearInterval(timerRef.current);
  }, [parsed]);

  if (!parsed || !parsed.tables.length) return null;
  const { tables } = parsed;

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <span style={S.title}>🌊 Data Flow</span>
        <span style={S.sub}>How tables combine through your query</span>
      </div>
      <div style={S.flow}>
        {tables.map((tbl, i) => {
          const color = tableColor(tbl, i);
          const def = schema?.[tbl.toLowerCase()];
          const vis = animStep >= i;
          return (
            <React.Fragment key={tbl}>
              <div style={{...S.node, borderColor:color, opacity:vis?1:0, transform:vis?'scale(1)':'scale(0.85)', transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:vis?`0 0 20px ${color}25`:'none'}}>
                <div style={{...S.nodeHead, background:`${color}18`, borderBottomColor:`${color}35`}}>
                  <span style={{color,fontSize:11,fontWeight:700,fontFamily:'var(--mono)'}}>{i===0?'📂':'📋'} {tbl}</span>
                  <span style={{fontSize:10,color,fontFamily:'var(--mono)'}}>{def?.rows?.length||5} rows</span>
                </div>
                <div style={S.nodeCols}>
                  {(def?.columns||['id','name','created_at']).slice(0,3).map(c=>(
                    <div key={c} style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
                      <span style={{color:`${color}70`,fontSize:9}}>›</span>
                      <span style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{c}</span>
                    </div>
                  ))}
                  <span style={{fontSize:9,color:'var(--text3)',fontStyle:'italic'}}>...</span>
                </div>
              </div>
              {i < tables.length - 1 && (
                <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0,opacity:animStep>=i+1?1:0.08,transition:'opacity 0.3s'}}>
                  <div style={{height:2,width:18,background:color,borderRadius:1}}/>
                  <div style={{border:`1px solid ${color}`,borderRadius:4,fontSize:9,fontWeight:700,fontFamily:'var(--mono)',padding:'2px 7px',color,whiteSpace:'nowrap',background:`${color}10`}}>
                    {parsed.joins[i] ? `${parsed.joins[i].type} JOIN` : 'JOIN'}
                  </div>
                  <div style={{height:2,width:18,background:tableColor(tables[i+1],i+1),borderRadius:1}}/>
                </div>
              )}
            </React.Fragment>
          );
        })}
        {animStep >= tables.length && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 14px',border:'1px dashed var(--border2)',borderRadius:8,animation:'fadeIn 0.5s ease',minWidth:80}}>
            <span style={{fontSize:20,marginBottom:4}}>📊</span>
            <span style={{fontSize:11,fontWeight:700,color:'var(--text)',fontFamily:'var(--mono)'}}>Result</span>
            <span style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:2}}>{parsed.hasLimit?`≤${parsed.limit} rows`:'n rows'}</span>
          </div>
        )}
      </div>

      {/* Sample row trace using inferred data */}
      {schema && Object.keys(schema).length > 0 && (
        <div style={S.trace}>
          <div style={S.traceTitle}>📌 Sample Row Trace (auto-generated for your tables)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {tables.map((tbl,i) => {
              const def = schema?.[tbl.toLowerCase()];
              const row = def?.rows?.[0];
              const color = tableColor(tbl, i);
              return (
                <div key={tbl} style={{border:`1px solid ${color}40`,borderRadius:6,overflow:'hidden',minWidth:160,maxWidth:220}}>
                  <div style={{padding:'4px 8px',fontSize:10,fontFamily:'var(--mono)',fontWeight:600,background:`${color}15`,color}}>
                    {i===0?'📂':'📋'} {tbl}
                  </div>
                  {row && (
                    <div style={{padding:'6px 8px',display:'flex',flexWrap:'wrap',gap:'4px 10px'}}>
                      {Object.entries(row).slice(0,3).map(([k,v])=>(
                        <span key={k} style={{display:'flex',gap:3,alignItems:'center'}}>
                          <span style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)'}}>{k}:</span>
                          <span style={{fontSize:9,color:'var(--text2)',fontFamily:'var(--mono)',fontWeight:600}}>{String(v).slice(0,12)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'},
  head:{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg2)'},
  title:{fontSize:13,fontWeight:700,color:'var(--text)',fontFamily:'var(--mono)'},
  sub:{fontSize:11,color:'var(--text3)'},
  flow:{padding:16,display:'flex',alignItems:'center',flexWrap:'wrap',gap:8,minHeight:100,overflowX:'auto'},
  node:{border:'1px solid',borderRadius:8,overflow:'hidden',minWidth:120,maxWidth:160},
  nodeHead:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderBottom:'1px solid'},
  nodeCols:{padding:'6px 8px'},
  trace:{padding:'12px 16px',borderTop:'1px solid var(--border)',background:'var(--bg2)'},
  traceTitle:{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8},
};