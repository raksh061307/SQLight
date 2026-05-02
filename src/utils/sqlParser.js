// SQL Query Parser — works with ANY query on ANY tables
// Returns structured execution stages + metadata

export function parseQuery(sql) {
  const stages = [];

  // ── extract clauses ────────────────────────────────────────────────────────
  // FROM + base table
  const fromM = sql.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?/i);
  const baseTable = fromM?.[1] || '?';
  const baseAlias = fromM?.[2] || null;

  // All JOINs
  const joinRe = /((?:LEFT|RIGHT|FULL|CROSS|INNER)\s+)?(?:OUTER\s+)?JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?\s+ON\s+([\w.]+\s*=\s*[\w.]+)/gi;
  const joins = [];
  let jm;
  while ((jm = joinRe.exec(sql)) !== null) {
    joins.push({
      type: (jm[1]||'INNER').trim().replace(/\s+OUTER/,'').toUpperCase(),
      table: jm[2],
      alias: jm[3]||null,
      condition: jm[4],
    });
  }

  // WHERE
  const whereM = sql.match(/WHERE\s+([\s\S]+?)(?=\s+GROUP\s+BY|\s+HAVING|\s+ORDER\s+BY|\s+LIMIT|;|$)/i);
  const whereClause = whereM?.[1]?.trim().replace(/\s+/g,' ') || null;

  // GROUP BY
  const groupM = sql.match(/GROUP\s+BY\s+([\s\S]+?)(?=\s+HAVING|\s+ORDER\s+BY|\s+LIMIT|;|$)/i);
  const groupBy = groupM?.[1]?.trim().replace(/\s+/g,' ') || null;

  // HAVING
  const havingM = sql.match(/HAVING\s+([\s\S]+?)(?=\s+ORDER\s+BY|\s+LIMIT|;|$)/i);
  const having = havingM?.[1]?.trim().replace(/\s+/g,' ') || null;

  // SELECT cols
  const selM = sql.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
  const selectCols = selM?.[1]?.trim().replace(/\s+/g,' ') || '*';

  // ORDER BY
  const orderM = sql.match(/ORDER\s+BY\s+([\s\S]+?)(?=\s+LIMIT|;|$)/i);
  const orderBy = orderM?.[1]?.trim().replace(/\s+/g,' ') || null;

  // LIMIT / TOP
  const limitM = sql.match(/LIMIT\s+(\d+)/i) || sql.match(/TOP\s+(\d+)/i);
  const limit = limitM ? parseInt(limitM[1]) : null;

  // DISTINCT
  const isDistinct = /SELECT\s+DISTINCT/i.test(sql);

  // Aggregates used
  const aggFns = [];
  ['COUNT','SUM','AVG','MAX','MIN','GROUP_CONCAT','STRING_AGG','ARRAY_AGG'].forEach(fn => {
    if (new RegExp(`\\b${fn}\\s*\\(`, 'i').test(sql)) aggFns.push(fn);
  });

  // Subqueries
  const subqueryCount = (sql.match(/\(\s*SELECT/gi)||[]).length;

  // ── build stages ───────────────────────────────────────────────────────────
  stages.push({
    id:'parse', icon:'🔍', label:'SQL Parsing',
    color:'#a78bfa',
    description:'The SQL engine tokenizes and parses your query into an internal Abstract Syntax Tree (AST), validating syntax and resolving identifiers.',
    detail:`Clauses detected: ${[fromM?'FROM':null, joins.length?'JOIN':null, whereClause?'WHERE':null, groupBy?'GROUP BY':null, having?'HAVING':null, 'SELECT', orderBy?'ORDER BY':null, limit!=null?'LIMIT':null, isDistinct?'DISTINCT':null].filter(Boolean).join(' → ')}`,
    affectedTable: null, rowEffect: null,
  });

  stages.push({
    id:'from', icon:'📂', label:`FROM — Scan "${baseTable}"`,
    color:'#f7971e',
    description:`The database opens and scans the base table "${baseTable}" into a working dataset. This is where query execution physically begins — not at SELECT.`,
    detail:`Table: ${baseTable}${baseAlias?` (alias: ${baseAlias})`:''}`,
    affectedTable: baseTable, rowEffect:'all',
  });

  joins.forEach((j,i) => {
    const typeDesc = {
      'LEFT':'Keeps ALL rows from the left table. Unmatched right rows become NULL.',
      'RIGHT':'Keeps ALL rows from the right table. Unmatched left rows become NULL.',
      'INNER':'Only returns rows that have a match in BOTH tables.',
      'FULL':'Returns all rows from both tables; unmatched sides fill with NULL.',
      'CROSS':'Produces the Cartesian product — every row × every row.',
    }[j.type] || 'Combines matching rows from both tables.';
    stages.push({
      id:`join_${i}`, icon: j.type==='LEFT'?'⬅️':j.type==='RIGHT'?'➡️':'🔗',
      label:`${j.type} JOIN — "${j.table}"`,
      color:'#ff6584',
      description:`${typeDesc} For large tables, ensure the join columns are indexed.`,
      detail:`ON ${j.condition}`,
      affectedTable: j.table, rowEffect:'join',
    });
  });

  if (whereClause) {
    stages.push({
      id:'where', icon:'🔎', label:'WHERE — Filter Rows',
      color:'#43e97b',
      description:'Evaluates the condition row-by-row and discards rows that fail. Applied BEFORE aggregation — much cheaper than HAVING for row-level filters.',
      detail:`Condition: ${whereClause}`,
      affectedTable: null, rowEffect:'reduce',
    });
  }

  if (groupBy) {
    stages.push({
      id:'groupby', icon:'🗂️', label:'GROUP BY — Aggregate',
      color:'#c084fc',
      description:`Collapses matching rows into groups. Aggregate functions (${aggFns.length ? aggFns.join(', ') : 'e.g. COUNT, SUM, AVG'}) are then calculated per group.`,
      detail:`Group keys: ${groupBy}`,
      affectedTable: null, rowEffect:'group',
    });
  }

  if (having) {
    stages.push({
      id:'having', icon:'✂️', label:'HAVING — Filter Groups',
      color:'#fda085',
      description:'Filters GROUPS (not rows). Applied after GROUP BY. Use this when your filter involves an aggregate like COUNT(*) > 5.',
      detail:`Condition: ${having}`,
      affectedTable: null, rowEffect:'reduce',
    });
  }

  if (isDistinct) {
    stages.push({
      id:'distinct', icon:'✨', label:'DISTINCT — Deduplicate',
      color:'#84fab0',
      description:'Removes duplicate rows from the result set. Requires an implicit sort or hash operation — can be expensive on large datasets.',
      detail:'Duplicate rows removed',
      affectedTable: null, rowEffect:'reduce',
    });
  }

  stages.push({
    id:'select', icon:'🎯', label:'SELECT — Project Columns',
    color:'#6c63ff',
    description:`Evaluates expressions and picks the final output columns. Aggregate functions are resolved here${isDistinct?' after deduplication':''}. Column aliases (AS) take effect.`,
    detail:`Output: ${selectCols}`,
    affectedTable: null, rowEffect:'project',
  });

  if (subqueryCount > 0) {
    stages.push({
      id:'subq', icon:'🔁', label:`Subquery Execution ×${subqueryCount}`,
      color:'#f093fb',
      description:`This query contains ${subqueryCount} subquery${subqueryCount>1?'s':''}. Each is executed as a nested query. Correlated subqueries (that reference the outer query) run once per outer row — watch for N+1 issues.`,
      detail:`${subqueryCount} nested SELECT${subqueryCount>1?'s':''}`,
      affectedTable: null, rowEffect: null,
    });
  }

  if (orderBy) {
    stages.push({
      id:'orderby', icon:'↕️', label:'ORDER BY — Sort',
      color:'#38bdf8',
      description:'Sorts the entire result set. Without an index on the sort column this triggers an in-memory (or disk) sort of all rows — one of the most expensive steps.',
      detail:`Sort: ${orderBy}`,
      affectedTable: null, rowEffect: null,
    });
  }

  if (limit != null) {
    stages.push({
      id:'limit', icon:'✂️', label:`LIMIT ${limit} — Truncate Output`,
      color:'#f472b6',
      description:`Returns only the first ${limit} rows. Combined with ORDER BY this enables efficient pagination. Always add LIMIT in production to prevent runaway queries.`,
      detail:`Max rows: ${limit}`,
      affectedTable: null, rowEffect:'limit', limitVal: limit,
    });
  }

  // ── complexity scoring ────────────────────────────────────────────────────
  let score = 1;
  score += joins.length * 2;
  if (groupBy) score += 1;
  if (having) score += 1;
  if (orderBy) score += 1;
  if (subqueryCount) score += subqueryCount * 2;
  if (aggFns.length) score += 1;
  if (!limit && !groupBy) score += 1;
  const complexity = score <= 3 ? 'Simple' : score <= 7 ? 'Moderate' : 'Complex';

  // ── tips ──────────────────────────────────────────────────────────────────
  const tips = [];
  if (joins.length >= 2) tips.push({type:'warn', text:`${joins.length} JOINs — verify FK indexes exist on all join columns (${joins.map(j=>j.condition).join(', ')}).`});
  if (!limit && !groupBy) tips.push({type:'warn', text:'No LIMIT — could return millions of rows in production. Add LIMIT for safety.'});
  if (having && !groupBy) tips.push({type:'error', text:'HAVING without GROUP BY is unusual — did you mean WHERE?'});
  if (selectCols.includes('*')) tips.push({type:'info', text:'SELECT * fetches all columns — specify only needed columns to reduce I/O and network transfer.'});
  if (subqueryCount > 0) tips.push({type:'warn', text:`Subquery detected — if it's correlated it runs once per outer row (N+1). Consider a JOIN or CTE instead.`});
  if (orderBy && !limit) tips.push({type:'info', text:'ORDER BY without LIMIT sorts the entire result — consider adding LIMIT if you only need top N rows.'});
  if (aggFns.includes('COUNT') && selectCols.includes('DISTINCT')) tips.push({type:'info', text:'COUNT(DISTINCT ...) can be slow on large tables — consider approximation functions if exact precision isn\'t needed.'});
  if (joins.length > 0) tips.push({type:'info', text:'Use table aliases (short letters like u, o, p) to keep JOIN queries readable.'});

  // ── all tables referenced ─────────────────────────────────────────────────
  const tables = [baseTable, ...joins.map(j=>j.table)];

  return {
    stages, tables, joins, baseTable, selectCols,
    whereClause, groupBy, having, orderBy, limit,
    isDistinct, aggFns, subqueryCount,
    hasWhere:!!whereClause, hasGroup:!!groupBy,
    hasHaving:!!having, hasOrder:!!orderBy, hasLimit:limit!=null,
    complexity, complexityScore:score, tips,
  };
}

export function diffQueries(q1, q2) {
  const diffs = [];
  if (q1.joins.length !== q2.joins.length) {
    const heavier = q1.joins.length > q2.joins.length ? 1 : 2;
    diffs.push({type:`q${heavier}_heavier`, text:`Query ${heavier} has ${Math.abs(q1.joins.length-q2.joins.length)} more JOIN(s) — likely slower.`});
  }
  if (q1.hasLimit && !q2.hasLimit) diffs.push({type:'q1_better', text:'Query 1 uses LIMIT — safer for large tables.'});
  if (!q1.hasLimit && q2.hasLimit) diffs.push({type:'q2_better', text:'Query 2 uses LIMIT — safer for large tables.'});
  if (q1.hasHaving && !q2.hasHaving) diffs.push({type:'info', text:'Query 1 uses HAVING — check if WHERE could replace it for better performance.'});
  if (q1.subqueryCount !== q2.subqueryCount) {
    const heavier = q1.subqueryCount > q2.subqueryCount ? 1 : 2;
    diffs.push({type:`q${heavier}_heavier`, text:`Query ${heavier} has more subqueries — potential N+1 risk.`});
  }
  if (q1.complexityScore !== q2.complexityScore) {
    const winner = q1.complexityScore < q2.complexityScore ? 1 : 2;
    diffs.push({type:`q${winner}_better`, text:`Query ${winner} is less complex (score ${Math.min(q1.complexityScore,q2.complexityScore)} vs ${Math.max(q1.complexityScore,q2.complexityScore)}).`});
  }
  if (diffs.length === 0) diffs.push({type:'equal', text:'Both queries have similar complexity and structure.'});
  return diffs;
}