import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getResourcesByClassAndSubject, createChatMessage } from '@/lib/db-utils';
import { retrieveRelevantContext, generateRagResponse } from '@/lib/rag-system';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, classId, subject, sessionId } = body;

    if (!message || !classId || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get learning resources for this class and subject using Vector Search
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { searchSimilarDocuments } = require('@/lib/vector-store');
    const relevantDocs = await searchSimilarDocuments(message, {
      classId,
      subject,
    }, 5);

    if (relevantDocs.length === 0) {
      return NextResponse.json({
        response: 'This topic is not covered in your current learning materials. Please ask your teacher to upload relevant materials.',
        sourceResources: [],
      });
    }

    // Combine relevant resources for context
    const resourceContext = relevantDocs
      .map((r: any) => `[${r.metadata.title}]\n${r.content}`)
      .join('\n\n');

    // Generate RAG response
    const aiMessage = await generateRagResponse(
      message,
      resourceContext,
      subject,
      'primary' // Could be dynamic based on class level
    );

    // Save chat message to database
    // We get unique resourceIds from the vector results
    const uniqueResourceIds = [...new Set(relevantDocs.map((r: any) => r.metadata.resourceId))].filter(Boolean);

    await createChatMessage({
      sessionId: sessionId || `session-${Date.now()}`,
      userId: user.userId,
      classId,
      subject,
      userMessage: message,
      aiResponse: aiMessage,
      sourceResources: uniqueResourceIds,
      isVoiceInput: false,
      isVoiceOutput: false,
    });

    // Deduplicate sources for the frontend response
    const uniqueSourcesFn = (docs: any[]) => {
      const seen = new Set();
      return docs.filter(doc => {
        const id = doc.metadata.resourceId;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    };

    return NextResponse.json({
      response: aiMessage,
      sourceResources: uniqueSourcesFn(relevantDocs).map((r: any) => ({
        id: r.metadata.resourceId,
        title: r.metadata.title,
      })),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
