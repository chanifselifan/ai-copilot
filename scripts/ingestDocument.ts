import { Client } from 'pg';
import axios from 'axios';
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

function chunkText(text: string, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let i=0;
  while (i < text.length) {
    const start = Math.max(0, i - overlap);
    chunks.push(text.slice(start, Math.min(i + chunkSize, text.length)));
    i += (chunkSize - overlap);
  }
  return chunks;
}

async function embedAndStore(documentId, text) {
  const chunks = chunkText(text);
  for (const c of chunks) {
    // call OpenAI embedding
    const e = await axios.post('https://api.openai.com/v1/embeddings', {
      model: 'text-embedding-3-small',
      input: c
    }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }});
    const vector = e.data.data[0].embedding; // array of numbers

    // insert via pgvector: use parameterized query casting to vector
    await client.query('INSERT INTO "DocumentChunk"(id, "documentId", content, embedding) VALUES (gen_random_uuid(), $1, $2, $3::vector)', [documentId, c, `[${vector.join(',')}]`]);
  }
}
