import React from 'react';

export default function AIExplanation({ text, loading, error }) {
  if (!loading && !text && !error) return null;
  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.label}>
          <span style={S.dot}/>
          <span style={S.title}>Groq AI Explanation</span>
        </div>
        {loading&&<div style={S.dots}>{[0,1,2].map(i=><div key={i} style={{...S.dotAnim,animationDelay:`${i*0.2}s`}}/>)}</div>}
      </div>
      <div style={S.body}>
        {loading&&<div style={S.loading}>{[100,85,70].map((w,i)=><div key={i} style={{...S.skel,width:`${w}%`}}/>)}</div>}
        {error&&<div style={S.err}><span>⚠️</span><span>{error}</span></div>}
        {!loading&&text&&(
          <div style={S.text}>
            {text.split('\n').map((p,i)=>p.trim()?<p key={i} style={S.para}>{p}</p>:<br key={i}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  wrap:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'},
  head:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg2)'},
  label:{display:'flex',alignItems:'center',gap:8},
  dot:{width:8,height:8,borderRadius:'50%',background:'#6c63ff',boxShadow:'0 0 8px #6c63ff',display:'inline-block'},
  title:{fontSize:12,fontWeight:600,color:'var(--text)',fontFamily:'var(--mono)'},
  dots:{display:'flex',gap:4},
  dotAnim:{width:6,height:6,borderRadius:'50%',background:'#6c63ff',animation:'bounce 0.8s infinite alternate'},
  body:{padding:14},
  loading:{display:'flex',flexDirection:'column',gap:8},
  skel:{height:12,borderRadius:6,background:'linear-gradient(90deg,var(--bg3) 25%,var(--border) 50%,var(--bg3) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite'},
  err:{display:'flex',gap:8,color:'#ff6584',fontSize:13,lineHeight:1.5},
  text:{display:'flex',flexDirection:'column',gap:2},
  para:{fontSize:13,color:'var(--text2)',lineHeight:1.7},
};