import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pcIndex = pinecone.Index(process.env.PINECONE_INDEX || 'learnbox-ai');

// Initialize Embeddings model
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small', // Efficient and cheap model
});

export interface DocumentMetadata {
  resourceId: string;
  source: string; // 'teacher-upload'
  title: string;
  classId: string;
  subject: string;
  term: string;
  chunkIndex: number;
}

export type ScoredDocument = {
  id: string;
  score: number;
  metadata: DocumentMetadata;
  content: string; // The text content of the chunk
};

/**
 * Index a document by splitting it into chunks and storing in Pinecone
 */
export async function indexDocument(
  text: string,
  metadata: Omit<DocumentMetadata, 'chunkIndex'>
) {
  try {
    // 1. Split text into chunks (naive overlap splitting)
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    // 2. Generate embeddings for all chunks
    const vectors = await embeddings.embedDocuments(chunks);

    // 3. Prepare Pinecone records
    const records = chunks.map((chunk, i) => ({
      id: `${metadata.resourceId}-chunk-${i}`,
      values: vectors[i],
      metadata: {
        ...metadata,
        chunkIndex: i,
        text: chunk, // Store text in metadata so we can retrieve it
      },
    }));

    // 4. Batch upsert to Pinecone (limit 100 per batch recommended)
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await pcIndex.upsert(batch);
    }

    console.log(`Indexed ${chunks.length} chunks for resource ${metadata.resourceId}`);
    return chunks.length;
  } catch (error) {
    console.error('Vector Indexing Error:', error);
    throw error;
  }
}

/**
 * Search for similar documents in Pinecone
 */
export async function searchSimilarDocuments(
  query: string,
  filter: { classId: string; subject: string },
  topK: number = 5
): Promise<ScoredDocument[]> {
  try {
    // 1. Embed query
    const queryEmbedding = await embeddings.embedQuery(query);

    // 2. Query Pinecone
    const results = await pcIndex.query({
      vector: queryEmbedding,
      topK,
      filter: {
        classId: filter.classId,
        subject: filter.subject,
      },
      includeMetadata: true,
    });

    // 3. Format results
    return results.matches.map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as unknown as DocumentMetadata,
      content: (match.metadata as any).text as string,
    }));
  } catch (error) {
    console.error('Vector Search Error:', error);
    return [];
  }
}

/**
 * Delete vectors for a resource
 */
export async function deleteResourceVectors(resourceId: string) {
  try {
    // This is tricky with chunk IDs.
    // Pinecone delete by metadata filter is only supported in Serverless Pods if configured.
    // For now, assume metadata deletion is available or manual ID prefix deletion needed.
    // Safe route: delete by metadata filter
    await pcIndex.deleteMany({
      resourceId: { $eq: resourceId }
    });
  } catch (error) {
    console.error('Vector Deletion Error:', error);
  }
}
