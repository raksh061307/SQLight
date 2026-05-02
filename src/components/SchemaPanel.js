import React, { useState } from 'react';

const PALETTE = ['#6c63ff','#f7971e','#ff6584','#43e97b','#c084fc','#38bdf8','#fda085','#84fab0'];
function tableColor(name, index) {
  const n = name.toLowerCase();
  if (n.includes('user')||n.includes('member')||n.includes('customer')||n.includes('person')) return '#6c63ff';
  if (n.includes('product')||n.includes('item')||n.includes('good')) return '#f7971e';
  if (n.includes('order')||n.includes('purchase')||n.includes('transaction')) return '#ff6584';
  if (n.includes('review')||n.includes('comment')||n.includes('feedback')) return '#43e97b';
  if (n.includes('payment')||n.includes('invoice')) return '#fda085';
  if (n.includes('post')||n.includes('article')||n.includes('blog')) return '#38bdf8';
  return PALETTE[index % PALETTE.length];
}

export default function SchemaPanel({ schema, highlightedTables = [], isInferred = false }) {
  const [expanded, setExpanded] = useState({});
  const tableNames = Object.keys(schema || {});

  if (!schema || tableNames.length === 0) {
    return (
      <div style={S.panel}>
        <div style={S.header}>
          <span style={S.headerIcon}>🗄️</span>
          <span style={S.headerTitle}>Schema</span>
        </div>
        <div style={S.empty}>Enter a SQL query to see the inferred schema here.</div>
      </div>
    );
  }

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <span style={S.headerIcon}>🗄️</span>
        <span style={S.headerTitle}>Schema</span>
        <span style={{...S.badge, background: isInferred?'rgba(247,151,30,0.15)':'rgba(108,99,255,0.15)', color: isInferred?'#f7971e':'#6c63ff'}}>
          {isInferred ? '✨ auto-inferred' : `${tableNames.length} tables`}
        </span>
      </div>
      <div style={S.tables}>
        {tableNames.map((name, idx) => {
          const def = schema[name];
          const color = tableColor(name, idx);
          const highlighted = highlightedTables.map(t=>t.toLowerCase()).includes(name.toLowerCase());
          const open = expanded[name] ?? highlighted;

          return (
            <div key={name} style={{...S.table, borderColor: highlighted ? color : 'var(--border)', boxShadow: highlighted ? `0 0 0 1px ${color}30, 0 0 10px ${color}15` : 'none'}}>
              <button style={{...S.tableHeader, background: highlighted?`${color}10`:'transparent'}}
                onClick={() => setExpanded(e => ({...e, [name]: !open}))}>
                <span style={{...S.tableIcon, background:`${color}20`, color}}>{highlighted?'⚡':'📋'}</span>
                <span style={S.tableName}>{name}</span>
                <span style={S.rowMeta}>{def.rows?.length||0} rows</span>
                <span style={{color:'var(--text3)',fontSize:10}}>{open?'▲':'▼'}</span>
              </button>

              {open && (
                <div style={S.tableBody}>
                  <div style={S.colList}>
                    {def.columns.map((col, ci) => (
                      <div key={col} style={S.colRow}>
                        <span style={S.colDot(color, col)} />
                        <span style={S.colName}>{col}</span>
                        <span style={{...S.colType, color: col==='id'?'#f7971e':col.endsWith('_id')?'#ff6584':'var(--text3)'}}>
                          {col==='id'?'PK':col.endsWith('_id')?'FK':inferType(col)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {def.rows?.length > 0 && (
                    <>
                      <div style={S.sampleLabel}>Sample data</div>
                      <div style={S.sampleTable}>
                        <div style={S.sampleHeader}>
                          {def.columns.slice(0,3).map(c => <span key={c} style={S.sCell}>{c}</span>)}
                        </div>
                        {def.rows.slice(0,3).map((row, ri) => (
                          <div key={ri} style={S.sampleRow}>
                            {def.columns.slice(0,3).map((col, ci) => (
                              <span key={ci} style={S.sCell}>
                                {String(row[col] ?? '').slice(0,12)}{String(row[col]??'').length>12?'…':''}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function inferType(col) {
  const c = col.toLowerCase();
  if (c.includes('date')||c.includes('time')||c.includes('_at')) return 'DATE';
  if (c.includes('price')||c.includes('amount')||c.includes('total')||c.includes('cost')||c.includes('salary')) return 'DECIMAL';
  if (c.includes('count')||c.includes('qty')||c.includes('quantity')||c.includes('stock')||c.includes('age')) return 'INT';
  if (c.includes('is_')||c.includes('has_')||c.includes('active')||c.includes('enabled')) return 'BOOL';
  if (c.includes('email')||c.includes('url')) return 'VARCHAR';
  if (c.includes('description')||c.includes('content')||c.includes('comment')||c.includes('notes')) return 'TEXT';
  if (c.includes('rating')||c.includes('score')||c.includes('avg')) return 'FLOAT';
  return 'VARCHAR';
}

const S = {
  panel:{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',height:'fit-content'},
  header:{display:'flex',alignItems:'center',gap:8,padding:'12px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg2)'},
  headerIcon:{fontSize:14},
  headerTitle:{fontSize:12,fontWeight:600,color:'var(--text)',flex:1,fontFamily:'var(--mono)'},
  badge:{fontSize:10,padding:'2px 8px',borderRadius:10,fontFamily:'var(--mono)'},
  empty:{padding:'20px 14px',fontSize:12,color:'var(--text3)',lineHeight:1.6,textAlign:'center'},
  tables:{padding:8,display:'flex',flexDirection:'column',gap:6},
  table:{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',transition:'all 0.2s'},
  tableHeader:{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 10px',cursor:'pointer',border:'none',background:'transparent',transition:'background 0.2s'},
  tableIcon:{width:22,height:22,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11},
  tableName:{fontSize:12,fontWeight:600,color:'var(--text)',flex:1,fontFamily:'var(--mono)',textAlign:'left'},
  rowMeta:{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'},
  tableBody:{padding:'0 10px 10px',borderTop:'1px solid var(--border)'},
  colList:{display:'flex',flexDirection:'column',gap:3,paddingTop:8},
  colRow:{display:'flex',alignItems:'center',gap:6},
  colDot:(color, col) => ({width:6,height:6,borderRadius:'50%',background:col==='id'?'#f7971e':col.endsWith('_id')?'#ff6584':color,opacity:0.6,flexShrink:0}),
  colName:{fontSize:11,color:'var(--text2)',fontFamily:'var(--mono)',flex:1},
  colType:{fontSize:9,fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:0.5},
  sampleLabel:{fontSize:10,color:'var(--text3)',margin:'8px 0 4px',textTransform:'uppercase',letterSpacing:1},
  sampleTable:{border:'1px solid var(--border)',borderRadius:6,overflow:'hidden',fontSize:10},
  sampleHeader:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',background:'var(--bg3)',borderBottom:'1px solid var(--border)'},
  sampleRow:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',borderBottom:'1px solid var(--border)'},
  sCell:{padding:'4px 6px',fontFamily:'var(--mono)',color:'var(--text2)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'},
};