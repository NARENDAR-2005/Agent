import { NextRequest, NextResponse } from 'next/server';
import { Packer } from 'docx';
import { generateATSSafeDOCX } from '@/lib/docx-generator';
import { ParsedResumeData } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const resumeData: ParsedResumeData = await request.json();

    const doc = generateATSSafeDOCX(resumeData);
    const buffer = await Packer.toBuffer(doc);

    const filename = `${(resumeData.candidateName || 'Candidate').replace(/\s+/g, '_')}_Improved_ATS_Resume.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('API /api/download-docx error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate ATS-safe DOCX.' },
      { status: 500 }
    );
  }
}
