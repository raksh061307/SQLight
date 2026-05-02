import React, { useRef } from 'react';

const EXAMPLES = [
  { label:'Basic JOIN', query:`SELECT u.name, u.email, COUNT(o.id) as order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.is_active = true\nGROUP BY u.id, u.name, u.email\nORDER BY order_count DESC\nLIMIT 10;` },
  { label:'Revenue report', query:`SELECT p.category, SUM(o.total) as revenue, AVG(o.total) as avg_order\nFROM products p\nINNER JOIN order_items oi ON p.id = oi.product_id\nINNER JOIN orders o ON oi.order_id = o.id\nWHERE o.status = 'completed'\nGROUP BY p.category\nHAVING SUM(o.total) > 1000\nORDER BY revenue DESC;` },
  { label:'Top customers', query:`SELECT c.name, c.email, SUM(o.amount) as lifetime_value\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nJOIN payments p ON o.id = p.order_id\nWHERE p.status = 'paid'\nGROUP BY c.id, c.name, c.email\nORDER BY lifetime_value DESC\nLIMIT 5;` },
];

export default function QueryEditor({ value, onChange, label='Query', placeholder, index }) {
  const ref = useRef();
  const lines = value.split('\n').length;

  const onKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = e.target.selectionStart, en = e.target.selectionEnd;
      const nv = value.substring(0,s) + '  ' + value.substring(en);
      onChange(nv);
      setTimeout(() => { ref.current.selectionStart = ref.current.selectionEnd = s+2; }, 0);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.top}>
        <div style={S.left}>
          <span style={{...S.badge, background:index===1?'rgba(108,99,255,0.2)':'rgba(255,101,132,0.2)', color:index===1?'#6c63ff':'#ff6584'}}>{label}</span>
          <span style={S.lang}>SQL</span>
        </div>
        <div style={S.examples}>
          {EXAMPLES.map((ex,i) => (
            <button key={i} style={S.exBtn} onClick={()=>onChange(ex.query)}>{ex.label}</button>
          ))}
        </div>
      </div>
      <div style={S.editor}>
        <div style={S.lineNums}>
          {Array.from({length:Math.max(lines,1)},(_,i)=>(
            <span key={i} style={S.lineNum}>{i+1}</span>
          ))}
        </div>
        <textarea ref={ref} value={value} onChange={e=>onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder||'-- Paste or type any SQL query here\n-- Schema is inferred automatically\nSELECT ...'}
          style={S.ta} spellCheck={false} rows={Math.max(lines+1,6)}/>
      </div>
      <div style={S.footer}>
        <span style={S.footHint}>Tab = indent</span>
        <span style={S.footMeta}>{value.length} chars · {lines} lines</span>
      </div>
    </div>
  );
}

const S = {
  wrap:{background:'#0d0d14',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',fontFamily:'var(--mono)'},
  top:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg2)',borderBottom:'1px solid var(--border)',flexWrap:'wrap',gap:8},
  left:{display:'flex',alignItems:'center',gap:8},
  badge:{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:6,fontFamily:'var(--mono)'},
  lang:{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:1},
  examples:{display:'flex',gap:6,flexWrap:'wrap'},
  exBtn:{fontSize:10,padding:'3px 8px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:5,color:'var(--text2)',cursor:'pointer',fontFamily:'var(--sans)',transition:'all 0.15s'},
  editor:{display:'flex',minHeight:130},
  lineNums:{display:'flex',flexDirection:'column',padding:'12px 8px',background:'#0a0a10',borderRight:'1px solid var(--border)',minWidth:32,alignItems:'flex-end'},
  lineNum:{fontSize:11,color:'var(--text3)',lineHeight:'21px',userSelect:'none'},
  ta:{flex:1,background:'transparent',border:'none',outline:'none',color:'#c9d1d9',fontFamily:'var(--mono)',fontSize:13,lineHeight:'21px',padding:'12px 14px',resize:'vertical',width:'100%',caretColor:'#6c63ff'},
  footer:{display:'flex',justifyContent:'space-between',padding:'5px 12px',background:'var(--bg2)',borderTop:'1px solid var(--border)'},
  footHint:{fontSize:10,color:'var(--text3)'},
  footMeta:{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'},
};