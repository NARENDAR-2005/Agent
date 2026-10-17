import { NextRequest, NextResponse } from 'next/server';
import { parseResumeBuffer } from '@/lib/resume-parser';
import { calculateDeterministicATSScore, generateResumeAnnotations } from '@/lib/scoring';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max execution time for Vercel functions

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('pastedText') as string | null;

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Please upload a PDF or DOCX file, or paste your resume text.' },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    let filename = 'pasted_resume.txt';

    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (extension === 'doc') {
        return NextResponse.json(
          { success: false, error: 'Legacy .doc format is not supported. Please save as .docx or PDF.' },
          { status: 400 }
        );
      }
      const allowed = ['pdf', 'docx', 'txt', 'md'];
      if (!allowed.includes(extension)) {
        return NextResponse.json(
          { success: false, error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.' },
          { status: 400 }
        );
      }

      // Empty file check
      if (file.size === 0) {
        return NextResponse.json(
          { success: false, error: 'The uploaded file is empty. Please upload a valid resume.' },
          { status: 400 }
        );
      }

      // 4MB size limit check (Vercel serverless body size limit is ~4.5 MB)
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds 4 MB. Please upload a smaller resume document.' },
          { status: 400 }
        );
      }
      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = Buffer.from(pastedText || '', 'utf-8');
    }

    // Parse resume in-memory — NEVER stored to disk or database
    const resumeData = await parseResumeBuffer(buffer, filename);

    // Empty or unreadable text check
    if (!resumeData.rawText || resumeData.rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "We couldn't read any text from this file. It may be corrupted or password-protected. Try pasting the text instead." },
        { status: 400 }
      );
    }

    // Compute deterministic ATS score
    const scoreBreakdown = calculateDeterministicATSScore(resumeData);

    // Generate actionable editorial annotations
    const annotations = generateResumeAnnotations(resumeData);

    return NextResponse.json({
      success: true,
      filename,
      message: 'Your resume is never saved.',
      resumeData,
      scoreBreakdown,
      annotations,
    });
  } catch (error) {
    console.error('API /api/parse-resume error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse resume document.',
      },
      { status: 500 }
    );
  }
}
