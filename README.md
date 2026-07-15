# 🔭 QueryLens v2 — Universal SQL Execution Visualizer

Paste **any** SQL query. QueryLens automatically infers your schema, generates realistic sample data, and visualizes exactly how your database would execute it.

**No hardcoded database. No setup required beyond npm install.**

## ✨ What's New in v2

- **Universal schema inference** — works with any tables, any columns, any domain
- **Interactive SVG flowchart** — animated pipeline with flowing data particles; click any step for a detail panel
- **80+ column data generators** — realistic sample data for users, products, orders, payments, posts, employees, and more
- **Smarter SQL parser** — handles DISTINCT, subqueries, FULL/CROSS joins, TOP N, all aggregate functions

## 🚀 Setup

```bash
cd querylens
npm install
npm start      # → http://localhost:3000
```

### Enable AI Explanations (optional)

1. Get a key from https://console.anthropic.com
2. Open `src/hooks/useClaudeExplain.js`
3. Uncomment the 3 header lines and add your key

Or use a `.env` file:
```
REACT_APP_ANTHROPIC_API_KEY=sk-ant-...
```

## 🧪 Try These Queries

**Any domain works — employees:**
```sql
SELECT d.name as department, AVG(e.salary) as avg_salary, COUNT(e.id) as headcount
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.is_active = true
GROUP BY d.id, d.name
HAVING COUNT(e.id) > 2
ORDER BY avg_salary DESC;
```

**Blog platform:**
```sql
SELECT a.title, u.name as author, COUNT(c.id) as comments, AVG(r.rating) as avg_rating
FROM articles a
JOIN users u ON a.author_id = u.id
LEFT JOIN comments c ON a.id = c.article_id
LEFT JOIN ratings r ON a.id = r.article_id
WHERE a.published = true
GROUP BY a.id, a.title, u.name
ORDER BY comments DESC
LIMIT 10;
```

**E-commerce (classic):**
```sql
SELECT u.name, SUM(o.total) as lifetime_value
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'delivered'
GROUP BY u.id, u.name
ORDER BY lifetime_value DESC
LIMIT 5;
```

## 📁 Structure

```
src/
├── App.js                          # Main shell
├── components/
│   ├── ExecutionFlowchart.js       # ★ Interactive SVG pipeline with particles
│   ├── DataFlowVisual.js           # Animated table→join→result diagram
│   ├── SchemaPanel.js              # Auto-inferred schema browser
│   ├── QueryEditor.js              # SQL editor with line numbers
│   ├── QueryComparison.js          # Side-by-side diff
│   └── AIExplanation.js            # Claude explanation panel
├── utils/
│   ├── schemaInferrer.js           # ★ Universal schema inference + data generator
│   └── sqlParser.js                # SQL clause parser + complexity scorer
└── hooks/
    └── useClaudeExplain.js         # Claude API integration
```
