// Force rebuild
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createResource } from '@/lib/db-utils';
import mammoth from 'mammoth';


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const term = formData.get('term') as string;
    const title = formData.get('title') as string;

    if (!file || !classId || !subject || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get file type
    const fileType = file.type.includes('pdf')
      ? 'pdf'
      : file.type.includes('word')
        ? 'docx'
        : file.type.includes('presentation')
          ? 'ppt'
          : 'text';

    // Read file content and extract text based on type
    const buffer = await file.arrayBuffer();
    const bufferData = Buffer.from(buffer);
    let text = '';

    try {
      if (fileType === 'pdf') {
        // Dynamic import to handle different environments/versions
        const pdfModule = await import('pdf-parse');

        // In ESM build, the main function is named PDFParse but it is a CLASS
        // @ts-ignore
        const PDFParseClass = pdfModule.PDFParse || pdfModule.default || pdfModule;

        // @ts-ignore
        const instance = new PDFParseClass({ data: bufferData });
        const data = await instance.getText();
        text = data.text;
      } else if (fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer: bufferData });
        text = result.value;
      } else {
        // Fallback for text files or unsupported formats
        text = bufferData.toString('utf-8');
      }

      // Cleanup text (remove excessive newlines/spaces)
      text = text.replace(/\s+/g, ' ').trim();

      if (text.length < 50) {
        throw new Error('Extracted text is too short or empty');
      }

    } catch (parseError) {
      console.error('Text extraction error:', parseError);
      return NextResponse.json(
        { error: 'Failed to extract text from file. Please ensure the file is valid and contains readable text.' },
        { status: 400 }
      );
    }

    // Create resource in database
    const resourceId = await createResource({
      title,
      subject,
      classId,
      schoolId: 'default-school',
      term: term || '1',
      content: text,
      originalFileName: file.name,
      fileType: fileType as 'pdf' | 'docx' | 'ppt' | 'text',
      uploadedBy: user.userId,
    });

    // Validating and Indexing content to Vector DB
    try {
       // eslint-disable-next-line @typescript-eslint/no-require-imports
       const { indexDocument } = require('@/lib/vector-store');
       await indexDocument(text, {
         resourceId: resourceId.toString(),
         source: 'teacher-upload',
         title,
         classId,
         subject,
         term: term || '1',
       });
    } catch (vectorError) {
      console.error('Vector indexing failed (background):', vectorError);
      // We don't fail the request, but we log the error.
      // In production, might want to use a queue.
    }

    return NextResponse.json({
      message: 'File uploaded and indexed successfully',
      resourceId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
