import { ChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';


const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4-turbo',
});

// Split text into chunks for better retrieval
export async function chunkDocument(text: string, chunkSize: number = 1000) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(text);
  return chunks;
}

// Calculate similarity between two texts (simple approach)
export function calculateSimilarity(query: string, document: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const docWords = document.toLowerCase().split(/\s+/);

  let matches = 0;
  for (const word of queryWords) {
    if (docWords.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }

  return matches / Math.max(queryWords.length, 1);
}

// Retrieve relevant context from documents
export function retrieveRelevantContext(
  query: string,
  documents: Array<{ title: string; content: string }>,
  topK: number = 3
): Array<{ title: string; content: string; score: number }> {
  const scored = documents.map((doc) => ({
    ...doc,
    score: calculateSimilarity(query, doc.content),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(doc => doc.score > 0.1);
}

// Generate RAG response with curriculum guardrails
export async function generateRagResponse(
  query: string,
  context: string,
  subject: string,
  ageGroup: string = 'primary'
): Promise<string> {
  const systemPrompt = `You are a helpful, patient AI tutor for ${ageGroup} school students learning ${subject}.

CRITICAL RULE - You MUST ONLY answer using the provided learning materials. If the answer is not in the materials, you MUST respond with:
"This topic is not covered in your current learning materials. Please ask your teacher about this topic."

Learning Materials:
${context}

Guidelines:
- Give clear, age-appropriate explanations
- Break complex concepts into simple steps
- Use examples from the materials
- Be encouraging and supportive
- Keep responses concise and focused
- Use simple language for primary students, appropriate language for secondary
- Never make up information or use external knowledge`;

  try {
    const response = await model.invoke([
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      {
        role: 'user' as const,
        content: query,
      },
    ]);

    const content = typeof response === 'string' ? response : (response.content as string) || '';

    return content;
  } catch (error) {
    console.error('Error generating RAG response:', error);
    throw error;
  }
}

// Validate if response uses only provided materials
export function validateResponseUsesContext(response: string, context: string): boolean {
  // Simple check: response should reference concepts from context
  const contextKeywords = context.split(/\s+/).filter(w => w.length > 4);
  const responseWords = response.toLowerCase().split(/\s+/);

  let matches = 0;
  for (const keyword of contextKeywords.slice(0, 20)) {
    if (responseWords.some(w => w.includes(keyword.toLowerCase()))) {
      matches++;
    }
  }

  // If not using context adequately, it likely didn't find the answer
  return matches > 0 || response.includes('not covered');
}
