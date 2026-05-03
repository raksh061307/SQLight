import { useState, useCallback } from 'react';
import Groq from 'groq-sdk';

const API_KEY = process.env.REACT_APP_GROQ_API_KEY;

// Initialize Groq with a fallback to prevent total app crashes
const groq = new Groq({
  apiKey: API_KEY || 'missing_key', 
  dangerouslyAllowBrowser: true 
});

export function useGroqExplain() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const explainQuery = useCallback(async (sql, mode = 'single', schemaContext = null) => {
    // If no key configured, silently skip (UI shows a warning)
    if (!API_KEY || API_KEY === 'your_groq_api_key_here' || API_KEY === 'missing_key') {
      setError('NO_KEY');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      // Build schema description from inferred schema
      const schemaDesc = schemaContext
        ? Object.entries(schemaContext).map(([tbl, def]) =>
            `${tbl}(${def.columns.join(', ')})`).join(', ')
        : 'unknown schema';

      const systemPrompt = `You are an expert SQL educator explaining queries to developers. The user is working with these tables (inferred from their query):

Schema: ${schemaDesc}

The sample data for each table was auto-generated to match realistic values for those column names.

Explain in clear, friendly language. Use plain English. Be concise and practical. When referencing data, use realistic examples based on the column names.`;

      let userPrompt;
      if (mode === 'single') {
        userPrompt = `Explain this SQL query in plain English. Cover: what question it answers, what each clause does, and what the output would look like with sample data. Keep it under 220 words.\n\nSQL:\n${sql}`;
      } else {
        const [q1, q2] = sql;
        userPrompt = `Compare these two SQL queries:\n1. What each does differently\n2. Which is more efficient and why\n3. When you'd use each\nKeep it under 260 words.\n\nQuery 1:\n${q1}\n\nQuery 2:\n${q2}`;
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (err) {
      setError('Add your Groq API key to your .env file to enable AI explanations.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { explainQuery, loading, error };
}