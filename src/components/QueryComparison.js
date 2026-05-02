import React from 'react';
import { diffQueries } from '../utils/sqlParser';

export default function QueryComparison({ parsed1, parsed2 }) {
  if (!parsed1||!parsed2) return null;
  const diffs = diffQueries(parsed1, parsed2);
  const metrics = [
    {label:'Execution Steps', q1:parsed1.stages.length, q2:parsed2.stages.length, lower:true},
    {label:'JOIN Count', q1:parsed1.joins.length, q2:parsed2.joins.length, lower:true},
    {label:'Complexity Score', q1:parsed1.complexityScore, q2:parsed2.complexityScore, lower:true},
    {label:'Has LIMIT', q1:parsed1.hasLimit?'✓':'✗', q2:parsed2.hasLimit?'✓':'✗'},
    {label:'Has WHERE', q1:parsed1.hasWhere?'✓':'✗', q2:parsed2.hasWhere?'✓':'✗'},
    {label:'Has HAVING', q1:parsed1.hasHaving?'✓':'✗', q2:parsed2.hasHaving?'✓':'✗'},
  ];
  return (
    <div style={S.wrap}>
      <div style={S.head}><span style={S.title}>⚖️ Query Comparison</span></div>
      <div style={S.body}>
        <div style={S.table}>
          <div style={S.tHead}><span style={S.mLabel}>Metric</span><span style={{...S.qH,color:'#6c63ff'}}>Query 1</span><span style={{...S.qH,color:'#ff6584'}}>Query 2</span></div>
          {metrics.map((m,i)=>{
            let c1='var(--text2)',c2='var(--text2)';
            if(typeof m.q1==='number'&&typeof m.q2==='number'&&m.q1!==m.q2){
              c1=m.lower?(m.q1<m.q2?'#43e97b':'#ff6584'):(m.q1>m.q2?'#43e97b':'#ff6584');
              c2=m.lower?(m.q2<m.q1?'#43e97b':'#ff6584'):(m.q2>m.q1?'#43e97b':'#ff6584');
            }
            return <div key={i} style={{...S.tRow,background:i%2===0?'var(--bg3)':'transparent'}}><span style={S.mLabel}>{m.label}</span><span style={{...S.mVal,color:c1}}>{String(m.q1)}</span><span style={{...S.mVal,color:c2}}>{String(m.q2)}</span></div>;
          })}
        </div>
        <div>
          <div style={S.diffTitle}>Analysis</div>
          {diffs.map((d,i)=>{
            const c=d.type==='q1_better'?'#43e97b':d.type==='q2_better'?'#84fab0':d.type==='q1_heavier'?'#ff6584':d.type==='q2_heavier'?'#fda085':d.type==='equal'?'#6c63ff':'var(--text2)';
            const lbl=d.type==='q1_better'?'Q1 WINS':d.type==='q2_better'?'Q2 WINS':d.type==='equal'?'EQUAL':'NOTICE';
            return <div key={i} style={{...S.diff,borderLeftColor:c,marginBottom:6}}><span style={{fontSize:10,color:c,fontWeight:700,fontFamily:'var(--mono)'}}>{lbl}</span><span style={{fontSize:12,color:'var(--text2)'}}>{d.text}</span></div>;
          })}
        </div>
        <div style={S.stages}>
          <div style={S.stCol}>
            <div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:'#6c63ff',marginBottom:4}}>Query 1 Steps</div>
            {parsed1.stages.map((s,i)=><div key={i} style={{...S.stItem,borderLeftColor:s.color}}>{s.icon} {s.label}</div>)}
          </div>
          <div style={{width:1,background:'var(--border)',borderRadius:1}}/>
          <div style={S.stCol}>
            <div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:'#ff6584',marginBottom:4}}>Query 2 Steps</div>
            {parsed2.stages.map((s,i)=><div key={i} style={{...S.stItem,borderLeftColor:s.color}}>{s.icon} {s.label}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'},
  head:{padding:'12px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg2)'},
  title:{fontSize:13,fontWeight:700,color:'var(--text)',fontFamily:'var(--mono)'},
  body:{padding:16,display:'flex',flexDirection:'column',gap:16},
  table:{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'},
  tHead:{display:'grid',gridTemplateColumns:'1fr 80px 80px',padding:'8px 12px',background:'var(--bg3)',borderBottom:'1px solid var(--border)'},
  tRow:{display:'grid',gridTemplateColumns:'1fr 80px 80px',padding:'7px 12px'},
  mLabel:{fontSize:11,color:'var(--text2)'},
  qH:{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',textAlign:'center'},
  mVal:{fontSize:12,fontFamily:'var(--mono)',fontWeight:600,textAlign:'center'},
  diffTitle:{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:1,marginBottom:8},
  diff:{display:'flex',flexDirection:'column',gap:2,padding:'8px 10px',borderLeft:'2px solid',background:'var(--bg3)',borderRadius:'0 6px 6px 0'},
  stages:{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:12,border:'1px solid var(--border)',borderRadius:8,padding:12},
  stCol:{display:'flex',flexDirection:'column',gap:4},
  stItem:{fontSize:11,color:'var(--text2)',padding:'4px 8px',borderLeft:'2px solid',background:'var(--bg3)',borderRadius:'0 4px 4px 0'},
};