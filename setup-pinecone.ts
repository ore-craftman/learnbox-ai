
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
dotenv.config();

async function setupPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || 'learnbox-ai';

  if (!apiKey) {
    console.error('PINECONE_API_KEY is missing in .env');
    process.exit(1);
  }

  console.log(`Connecting to Pinecone...`);
  const pinecone = new Pinecone({ apiKey });

  try {
    const indicesList = await pinecone.listIndexes();
    const existingIndex = indicesList.indexes?.find(i => i.name === indexName);

    if (existingIndex) {
      console.log(`Index "${indexName}" already exists.`);
      console.log('Status:', existingIndex.status);
    } else {
      console.log(`Index "${indexName}" does not exist. Creating...`);
      // Create index with dimensions for text-embedding-3-small (1536)
      // Check if serverless spec is required/supported by the tier, assuming standard serverless here
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log(`Index "${indexName}" created successfully!`);
      console.log('Please wait a moment for initialization before uploading documents.');
    }
  } catch (error) {
    console.error('Error managing Pinecone index:', error);
  }
}

setupPinecone();
