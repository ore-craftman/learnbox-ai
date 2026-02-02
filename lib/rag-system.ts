import { ChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';


const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4-turbo',
});

// Map class level to age-appropriate teaching parameters
function getAgeGroupFromClass(classId: string): {
  level: string;
  ageRange: string;
  description: string;
  languageGuidance: string;
  exampleGuidance: string;
} {
  if (classId.startsWith('Primary')) {
    const grade = classId.split(' ')[1];
    const gradeNum = parseInt(grade);
    if (gradeNum <= 3) {
      return {
        level: 'early-primary',
        ageRange: '6-9 years',
        description: 'young child who needs very simple language, short sentences, and lots of examples',
        languageGuidance: 'very simple words and short sentences',
        exampleGuidance: 'from everyday life that a young child can relate to'
      };
    }
    return {
      level: 'upper-primary',
      ageRange: '9-12 years',
      description: 'pre-teen who can understand more complex ideas but still needs clear explanations',
      languageGuidance: 'clear language with examples',
      exampleGuidance: 'from daily experiences and school activities'
    };
  } else if (classId.startsWith('JSS')) {
    return {
      level: 'junior-secondary',
      ageRange: '12-15 years',
      description: 'teenager who can handle abstract concepts and more formal language',
      languageGuidance: 'proper terminology with clear definitions',
      exampleGuidance: 'relevant to Nigerian students and real-world applications'
    };
  } else if (classId.startsWith('SS')) {
    return {
      level: 'senior-secondary',
      ageRange: '15-18 years',
      description: 'young adult preparing for exams who needs detailed, comprehensive explanations',
      languageGuidance: 'academic language with detailed explanations',
      exampleGuidance: 'with real-world applications and exam-focused context'
    };
  }
  return {
    level: 'primary',
    ageRange: '6-12 years',
    description: 'student needing clear, simple explanations',
    languageGuidance: 'simple, clear language',
    exampleGuidance: 'from everyday life'
  };
}

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

// Generate RAG response with age-appropriate explanations
export async function generateRagResponse(
  query: string,
  context: string,
  subject: string,
  classId: string
): Promise<string> {
  const ageInfo = getAgeGroupFromClass(classId);

  const systemPrompt = `You are a warm, encouraging AI tutor helping a ${ageInfo.description} learn ${subject}.

STUDENT CONTEXT:
- Class Level: ${classId}
- Age Range: ${ageInfo.ageRange}
- Subject: ${subject}

YOUR TEACHING MATERIALS:
${context}

YOUR TEACHING APPROACH:
1. EXPLAIN concepts from the materials - don't just quote them directly
2. Use ${ageInfo.languageGuidance} to make ideas clear
3. Break complex ideas into easy-to-follow steps
4. Use examples and analogies ${ageInfo.exampleGuidance}
5. Be encouraging and patient - celebrate curiosity!
6. Make learning fun and relatable for the student's age level
7. If the materials don't cover the topic, respond: "This topic isn't in your current learning materials. Please ask your teacher about this."

Remember: Your goal is to help the student UNDERSTAND the concepts deeply, not just memorize answers. Teach in a way that makes them excited to learn more!`;

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
