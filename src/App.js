import React, { useState, useCallback } from 'react';
import QueryEditor from './components/QueryEditor';
import ExecutionFlowchart from './components/ExecutionFlowchart';
import SchemaPanel from './components/SchemaPanel';
import AIExplanation from './components/AIExplanation';
import DataFlowVisual from './components/DataFlowVisual';
import QueryComparison from './components/QueryComparison';
import { parseQuery } from './utils/sqlParser';
import { inferSchemaFromSQL, generateSampleData } from './utils/schemaInferrer';
import { useGroqExplain } from './hooks/useGroqExplain';
import './styles/animations.css';

export default function App() {
  const [mode, setMode]       = useState('single');
  const [query1, setQuery1]   = useState('');
  const [query2, setQuery2]   = useState('');
  const [parsed1, setParsed1] = useState(null);
  const [parsed2, setParsed2] = useState(null);
  const [schema,  setSchema]  = useState({});
  const [aiText,  setAiText]  = useState('');
  const [done,    setDone]    = useState(false);
  const { explainQuery, loading: aiLoading, error: aiError } = useGroqExplain();

  const handleAnalyze = useCallback(async () => {
    if (!query1.trim()) return;

    // Parse SQL → extract tables/columns
    const p1 = parseQuery(query1);
    setParsed1(p1);
    setDone(true);
    setAiText('');

    // Infer schema from the actual query and generate sample data
    const inferred = inferSchemaFromSQL(query1 + (query2 ? ' ' + query2 : ''));
    const populated = generateSampleData(inferred, 5);
    setSchema(populated);

    if (mode === 'compare' && query2.trim()) {
      const p2 = parseQuery(query2);
      setParsed2(p2);
      const text = await explainQuery([query1, query2], 'compare', populated);
      if (text) setAiText(text);
    } else {
      setParsed2(null);
      const text = await explainQuery(query1, 'single', populated);
      if (text) setAiText(text);
    }
  }, [query1, query2, mode, explainQuery]);

  const allTables = [...(parsed1?.tables||[]), ...(parsed2?.tables||[])];

  const S = {
    app:{minHeight:'100vh',position:'relative'},
    bg:{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,
      background:'radial-gradient(ellipse 700px 500px at 5% 15%,rgba(108,99,255,0.07) 0%,transparent 60%),radial-gradient(ellipse 500px 400px at 95% 80%,rgba(255,101,132,0.05) 0%,transparent 60%)'},
    header:{position:'sticky',top:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'10px 24px',background:'rgba(10,10,15,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'},
    logo:{display:'flex',alignItems:'center',gap:10},
    logoIcon:{fontSize:24},
    logoGroup:{display:'flex',flexDirection:'column'},
    logoText:{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',
      background:'linear-gradient(120deg,#6c63ff,#c084fc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1.2},
    logoSub:{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',letterSpacing:0.5},
    toggle:{display:'flex',gap:3,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:3},
    modeBtn:{padding:'6px 16px',borderRadius:6,border:'none',background:'transparent',color:'var(--text3)',cursor:'pointer',fontSize:12,fontFamily:'var(--sans)',transition:'all 0.15s'},
    active1:{background:'rgba(108,99,255,0.2)',color:'#6c63ff',fontWeight:600},
    active2:{background:'rgba(255,101,132,0.2)',color:'#ff6584',fontWeight:600},
    layout:{display:'grid',gridTemplateColumns:'260px 1fr',gap:16,padding:'16px 24px',position:'relative',zIndex:1,maxWidth:1600,margin:'0 auto'},
    sidebar:{position:'sticky',top:64,height:'fit-content'},
    main:{display:'flex',flexDirection:'column',gap:12,minWidth:0},
    analyzeRow:{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'},
    analyzeBtn:{padding:'10px 28px',background:'linear-gradient(135deg,#6c63ff,#a78bfa)',border:'none',borderRadius:8,
      color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'var(--sans)',
      boxShadow:'0 4px 18px rgba(108,99,255,0.35)',flexShrink:0},
    hint:{fontSize:12,color:'var(--text3)',fontStyle:'italic'},
    results:{display:'flex',flexDirection:'column',gap:12},
    qTag1:{display:'inline-block',marginBottom:6,fontSize:11,fontWeight:700,padding:'3px 10px',background:'rgba(108,99,255,0.15)',color:'#6c63ff',borderRadius:6,fontFamily:'var(--mono)'},
    qTag2:{display:'inline-block',marginBottom:6,fontSize:11,fontWeight:700,padding:'3px 10px',background:'rgba(255,101,132,0.15)',color:'#ff6584',borderRadius:6,fontFamily:'var(--mono)'},
    empty:{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 24px',gap:20,border:'1px dashed var(--border2)',borderRadius:14,textAlign:'center'},
    emptyIcon:{fontSize:52},
    emptyTitle:{fontSize:22,fontWeight:800,color:'var(--text)',fontFamily:'var(--mono)'},
    emptyDesc:{fontSize:14,color:'var(--text3)',maxWidth:520,lineHeight:1.8},
    featGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10,width:'100%',marginTop:8},
    featCard:{display:'flex',gap:12,alignItems:'flex-start',padding:'12px 14px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,textAlign:'left'},
    featIcon:{fontSize:20,flexShrink:0},
    featTitle:{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:3},
    featDesc:{fontSize:11,color:'var(--text3)',lineHeight:1.6},
    resetNote:{fontSize:11,color:'var(--text3)',padding:'6px 12px',background:'rgba(247,151,30,0.08)',border:'1px solid rgba(247,151,30,0.2)',borderRadius:6},
  };

  const features = [
    ['🔀','Interactive Flowchart','Animated SVG pipeline — click any step for details + flowing data particles'],
    ['🌊','Data Flow Diagram','Animated table nodes showing how joins combine your data'],
    ['✨','Universal Schema','Infers schema from ANY query automatically — no hardcoded tables'],
    ['💡','AI Explanation','Plain-English explanation of what your query does, powered by Groq'],
    ['⚖️','Query Comparison','Diff two queries with performance analysis and winner verdict'],
    ['🔍','Performance Tips','Index hints, N+1 warnings, missing LIMIT alerts for any query'],
  ];

  return (
    <div style={S.app}>
      <div style={S.bg}/>
      <header style={S.header}>
        <div style={S.logo}>
          <span style={S.logoIcon}>🔭</span>
          <div style={S.logoGroup}>
            <span style={S.logoText}>QueryLens</span>
            <span style={S.logoSub}>SQL Execution Visualizer — Universal</span>
          </div>
        </div>
        <div style={S.toggle}>
          <button style={{...S.modeBtn,...(mode==='single'?S.active1:{})}} onClick={()=>{setMode('single');setDone(false);setParsed1(null);setParsed2(null);setAiText('');setSchema({});}}>⚡ Single</button>
          <button style={{...S.modeBtn,...(mode==='compare'?S.active2:{})}} onClick={()=>{setMode('compare');setDone(false);setParsed1(null);setParsed2(null);setAiText('');setSchema({});}}>⚖️ Compare</button>
        </div>
      </header>

      <div style={S.layout}>
        <aside style={S.sidebar}>
          <SchemaPanel schema={schema} highlightedTables={allTables} isInferred={done}/>
        </aside>

        <main style={S.main}>
          <div style={{display:'grid',gridTemplateColumns:mode==='compare'?'1fr 1fr':'1fr',gap:12}}>
            <QueryEditor value={query1} onChange={setQuery1} label={mode==='compare'?'Query 1':'SQL Query'} index={1}/>
            {mode==='compare'&&<QueryEditor value={query2} onChange={setQuery2} label="Query 2" index={2}/>}
          </div>

          <div style={S.analyzeRow}>
            <button
              style={{...S.analyzeBtn, opacity:query1.trim()?1:0.5, cursor:query1.trim()?'pointer':'not-allowed'}}
              onClick={handleAnalyze} disabled={!query1.trim()||aiLoading}>
              {aiLoading
                ? <span style={{display:'flex',alignItems:'center',gap:8}}><span className="spinner"/>Analyzing...</span>
                : `⚡ Analyze ${mode==='compare'?'Both Queries':'Query'}`}
            </button>
            {done && <span style={S.resetNote}>✨ Schema auto-inferred from your query</span>}
            {!done && <span style={S.hint}>Paste any SQL query — schema is inferred automatically</span>}
          </div>

          {done && parsed1 && (
            <div style={S.results} className="fade-in">
              <DataFlowVisual parsed={parsed1} schema={schema}/>

              <div style={{display:'grid',gridTemplateColumns:mode==='compare'&&parsed2?'1fr 1fr':'1fr',gap:12}}>
                <div>{mode==='compare'&&parsed2&&<div style={S.qTag1}>Query 1</div>}<ExecutionFlowchart parsed={parsed1}/></div>
                {mode==='compare'&&parsed2&&<div><div style={S.qTag2}>Query 2</div><ExecutionFlowchart parsed={parsed2}/></div>}
              </div>

              {mode==='compare'&&parsed2&&<QueryComparison parsed1={parsed1} parsed2={parsed2}/>}
              <AIExplanation text={aiText} loading={aiLoading} error={aiError}/>
            </div>
          )}

          {!done&&(
            <div style={S.empty}>
              <div style={S.emptyIcon}>🔭</div>
              <div style={S.emptyTitle}>Works on any SQL query</div>
              <div style={S.emptyDesc}>
                No hardcoded database needed. Paste any query — QueryLens automatically infers your schema,
                generates realistic sample data, and visualizes how your database would execute it.
              </div>
              <div style={S.featGrid}>
                {features.map(([icon,title,desc])=>(
                  <div key={title} style={S.featCard}>
                    <span style={S.featIcon}>{icon}</span>
                    <div><div style={S.featTitle}>{title}</div><div style={S.featDesc}>{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}