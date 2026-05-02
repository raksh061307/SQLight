// Infer schema from ANY SQL query and generate realistic sample data on the fly.
// No hardcoded tables needed.

// ── Heuristic data generators keyed by column-name patterns ─────────────────
const GENERATORS = {
  // IDs
  id:         (i) => i + 1,
  _id:        (i) => i + 1,
  uuid:       (i) => `id-${String(i+1).padStart(4,'0')}`,

  // People / names
  name:       (i) => ['Alice Chen','Bob Smith','Priya Sharma','Carlos Ruiz','Yuki Tanaka','Dana White','Eva Müller','Liam Park'][i%8],
  first_name: (i) => ['Alice','Bob','Priya','Carlos','Yuki','Dana','Eva','Liam'][i%8],
  last_name:  (i) => ['Chen','Smith','Sharma','Ruiz','Tanaka','White','Müller','Park'][i%8],
  username:   (i) => ['alice_c','bob_s','priya_s','carlos_r','yuki_t','dana_w','eva_m','liam_p'][i%8],
  email:      (i) => ['alice@mail.com','bob@mail.com','priya@mail.com','carlos@mail.com','yuki@mail.com','dana@mail.com','eva@mail.com','liam@mail.com'][i%8],
  phone:      (i) => `+1-555-${String(1000+i*111).slice(0,4)}`,

  // Geography
  city:       (i) => ['New York','London','Mumbai','Tokyo','Berlin','Sydney','Paris','Toronto'][i%8],
  country:    (i) => ['US','UK','IN','JP','DE','AU','FR','CA'][i%8],
  state:      (i) => ['CA','NY','TX','FL','WA','IL','OH','GA'][i%8],
  address:    (i) => [`${(i+1)*10} Main St`,`${(i+1)*5} Oak Ave`,`${(i+1)*7} Park Rd`][i%3],
  zip:        (i) => String(10001 + i * 1111),

  // Products / items
  title:      (i) => ['Pro Laptop 15"','Wireless Mouse','Desk Lamp LED','Coffee Mug XL','Notebook A5','Standing Desk','Keyboard MX','USB-C Hub'][i%8],
  product_name:(i)=> ['Laptop Pro','Wireless Mouse','Desk Lamp','Coffee Mug','Notebook','Standing Desk','Keyboard','USB Hub'][i%8],
  description:(i) => ['High performance model.','Compact and portable.','Energy efficient.','Ergonomic design.','Premium quality.'][i%5],
  category:   (i) => ['Electronics','Furniture','Kitchen','Stationery','Clothing','Sports','Books','Toys'][i%8],
  sku:        (i) => `SKU-${String(1000+i).padStart(5,'0')}`,
  brand:      (i) => ['Apple','Samsung','Sony','LG','Dell','HP','Logitech','Anker'][i%8],
  tag:        (i) => ['new','sale','featured','popular','trending','limited'][i%6],

  // Finance
  price:      (i) => +(Math.random()*500+5).toFixed(2),
  amount:     (i) => +(Math.random()*2000+10).toFixed(2),
  total:      (i) => +(Math.random()*1500+20).toFixed(2),
  salary:     (i) => [55000,72000,88000,95000,110000,125000,140000,160000][i%8],
  budget:     (i) => [10000,25000,50000,75000,100000][i%5],
  revenue:    (i) => +(Math.random()*100000+5000).toFixed(2),
  cost:       (i) => +(Math.random()*500+10).toFixed(2),
  balance:    (i) => +(Math.random()*10000).toFixed(2),
  discount:   (i) => [0,5,10,15,20,25][i%6],

  // Status / type
  status:     (i) => ['active','pending','completed','cancelled','shipped','delivered'][i%6],
  type:       (i) => ['standard','premium','basic','enterprise','trial'][i%5],
  role:       (i) => ['admin','user','manager','editor','viewer'][i%5],
  priority:   (i) => ['low','medium','high','critical'][i%4],
  level:      (i) => ['beginner','intermediate','advanced','expert'][i%4],

  // Scores / counts
  rating:     (i) => +(3 + Math.random()*2).toFixed(1),
  score:      (i) => Math.floor(Math.random()*100),
  count:      (i) => Math.floor(Math.random()*500+1),
  quantity:   (i) => Math.floor(Math.random()*20+1),
  stock:      (i) => Math.floor(Math.random()*500+10),
  views:      (i) => Math.floor(Math.random()*10000),
  clicks:     (i) => Math.floor(Math.random()*5000),
  age:        (i) => 20 + (i * 7) % 50,
  year:       (i) => 2018 + (i%7),

  // Dates / times
  created_at: (i) => `2024-0${(i%9)+1}-${String((i*7%28)+1).padStart(2,'0')}`,
  updated_at: (i) => `2024-0${(i%9)+1}-${String((i*11%28)+1).padStart(2,'0')}`,
  date:       (i) => `2024-0${(i%9)+1}-${String((i*7%28)+1).padStart(2,'0')}`,
  order_date: (i) => `2024-0${(i%9)+1}-${String((i*5%28)+1).padStart(2,'0')}`,
  birth_date: (i) => `${1970+(i*7%35)}-0${(i%9)+1}-${String((i*3%28)+1).padStart(2,'0')}`,
  start_date: (i) => `2024-0${(i%6)+1}-01`,
  end_date:   (i) => `2024-0${(i%6)+7}-30`,

  // Flags
  is_active:  (i) => i%3!==2,
  is_premium: (i) => i%3===0,
  is_verified:(i) => i%2===0,
  active:     (i) => i%3!==2,
  enabled:    (i) => i%4!==3,
  published:  (i) => i%3!==2,

  // Misc
  url:        (i) => `https://example.com/item/${i+1}`,
  image_url:  (i) => `https://picsum.photos/seed/${i+1}/200`,
  notes:      (i) => ['No issues.','Needs review.','Approved.','Flagged.','On hold.'][i%5],
  comment:    (i) => ['Great product!','Very helpful.','As expected.','Highly recommend.','Could be better.'][i%5],
  message:    (i) => ['Hello!','Thank you.','Please assist.','Done!','In progress.'][i%5],
  language:   (i) => ['English','Spanish','French','German','Japanese','Hindi'][i%6],
  currency:   (i) => ['USD','EUR','GBP','JPY','INR','AUD'][i%6],
  department: (i) => ['Engineering','Marketing','Sales','HR','Finance','Design'][i%6],
  company:    (i) => ['Acme Corp','TechStart','GlobalFirm','NextGen','BuildCo'][i%5],
  region:     (i) => ['North','South','East','West','Central'][i%5],
  platform:   (i) => ['web','mobile','desktop','api'][i%4],
  source:     (i) => ['organic','paid','referral','direct','social'][i%5],
};

// Pick generator for a column name (fuzzy match)
function getGenerator(colName) {
  const lower = colName.toLowerCase();
  // Exact match
  if (GENERATORS[lower]) return GENERATORS[lower];
  // Suffix match (user_id → id)
  if (lower.endsWith('_id')) return (i) => i + 1;
  // Partial match
  for (const [key, fn] of Object.entries(GENERATORS)) {
    if (lower.includes(key)) return fn;
  }
  // Default: generic string
  return (i) => `${colName}_${i+1}`;
}

// ── Parse SQL to extract all table+column references ────────────────────────
export function inferSchemaFromSQL(sql) {
  const tables = {};

  // Extract all table names (FROM and JOINs)
  const fromRe = /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let m;
  while ((m = fromRe.exec(sql)) !== null) {
    const t = m[1].toLowerCase();
    if (!['select','where','on','and','or','not','null','is','as','by','having','order','group','limit'].includes(t)) {
      if (!tables[t]) tables[t] = { columns: new Set(), alias: null };
    }
  }

  // Extract aliases  e.g.  users u  /  users AS u
  const aliasRe = /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+AS\s+|\s+)([a-zA-Z_][a-zA-Z0-9_]*)\b/gi;
  const aliasMap = {}; // alias -> tableName
  while ((m = aliasRe.exec(sql)) !== null) {
    const tbl = m[1].toLowerCase();
    const alias = m[2].toLowerCase();
    if (tables[tbl] && !['on','where','set','left','right','inner','outer','cross','join','group','order','having','limit','where'].includes(alias)) {
      aliasMap[alias] = tbl;
      tables[tbl].alias = alias;
    }
  }

  // Helper: resolve alias or table name
  const resolve = (prefix) => {
    const p = prefix?.toLowerCase();
    return aliasMap[p] || (tables[p] ? p : null);
  };

  // Collect columns from SELECT, WHERE, ON, GROUP BY, ORDER BY
  // Pattern: [alias.]column
  const colRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  while ((m = colRe.exec(sql)) !== null) {
    const tbl = resolve(m[1]);
    const col = m[2].toLowerCase();
    if (tbl && tables[tbl] && !['id','as'].includes(col)) {
      tables[tbl].columns.add(col);
    }
  }

  // Also pick up bare column names from SELECT (no alias prefix) — best-effort to first table
  const tableNames = Object.keys(tables);
  if (tableNames.length > 0) {
    const selectMatch = sql.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
    if (selectMatch) {
      const cols = selectMatch[1].split(',');
      cols.forEach(col => {
        const bare = col.trim().replace(/.*\s+AS\s+\w+/i,'').trim();
        // Only if no dot (already handled above)
        if (!bare.includes('.') && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(bare) && bare !== '*') {
          tables[tableNames[0]].columns.add(bare.toLowerCase());
        }
      });
    }
  }

  // Ensure every table has at least an `id` column + discovered columns
  for (const tbl of tableNames) {
    const cols = tables[tbl].columns;
    if (!cols.has('id')) cols.add('id');
    // Add FK columns: if another table is joined ON x.col = y.col, the col appears
    // already via colRe above. Ensure at least 3 columns for visual richness
    if (cols.size < 3) {
      // guess sensible columns from table name
      const guesses = getDefaultColumnsForTable(tbl);
      guesses.forEach(c => cols.add(c));
    }
  }

  // Convert Sets to arrays, put id first
  const result = {};
  for (const [tbl, info] of Object.entries(tables)) {
    let cols = Array.from(info.columns);
    cols = ['id', ...cols.filter(c => c !== 'id')];
    result[tbl] = { columns: cols, alias: info.alias, rows: [] };
  }

  return result;
}

function getDefaultColumnsForTable(tableName) {
  const t = tableName.toLowerCase();
  if (t.includes('user') || t.includes('member') || t.includes('person') || t.includes('customer') || t.includes('employee'))
    return ['name','email','created_at'];
  if (t.includes('product') || t.includes('item') || t.includes('good'))
    return ['title','price','category'];
  if (t.includes('order') || t.includes('purchase') || t.includes('transaction'))
    return ['amount','status','order_date'];
  if (t.includes('review') || t.includes('comment') || t.includes('feedback'))
    return ['rating','comment','created_at'];
  if (t.includes('post') || t.includes('article') || t.includes('blog'))
    return ['title','status','created_at'];
  if (t.includes('category') || t.includes('tag') || t.includes('label'))
    return ['name','description','created_at'];
  if (t.includes('payment') || t.includes('invoice') || t.includes('bill'))
    return ['amount','status','date'];
  if (t.includes('log') || t.includes('event') || t.includes('audit'))
    return ['type','message','created_at'];
  if (t.includes('role') || t.includes('permission') || t.includes('group'))
    return ['name','description','active'];
  if (t.includes('department') || t.includes('team') || t.includes('division'))
    return ['name','department','budget'];
  // generic
  return ['name','status','created_at'];
}

// ── Generate N sample rows for an inferred schema ───────────────────────────
export function generateSampleData(schema, rowsPerTable = 5) {
  const result = {};
  for (const [tbl, info] of Object.entries(schema)) {
    result[tbl] = {
      ...info,
      rows: Array.from({ length: rowsPerTable }, (_, i) => {
        const row = {};
        info.columns.forEach(col => {
          row[col] = getGenerator(col)(i);
        });
        return row;
      }),
    };
  }
  return result;
}