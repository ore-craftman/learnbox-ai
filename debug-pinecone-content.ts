
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
dotenv.config();

async function debugPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || 'learnbox-ai';

  if (!apiKey) {
    console.error('PINECONE_API_KEY is missing');
    return;
  }

  const pinecone = new Pinecone({ apiKey });

  try {
    console.log(`Checking index "${indexName}"...`);
    const index = pinecone.Index(indexName);

    // 1. Describe Index Stats
    const stats = await index.describeIndexStats();
    console.log('Index Stats:', JSON.stringify(stats, null, 2));

    if (stats.totalRecordCount === 0) {
      console.log('Index is empty. No documents have been indexed.');
      return;
    }

    // 2. Perform a dummy query to see metadata
    // We create a dummy vector of 1536 dimensions (for text-embedding-3-small)
    const dummyVector = Array(1536).fill(0.01);

    const queryResponse = await index.query({
      vector: dummyVector,
      topK: 10,
      includeMetadata: true
    });

    console.log('Sample Matches:', JSON.stringify(queryResponse.matches.map(m => ({
      id: m.id,
      score: m.score,
      metadata: {
        title: m.metadata?.title,
        classId: m.metadata?.classId,
        subject: m.metadata?.subject
      }
    })), null, 2));

  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugPinecone();
