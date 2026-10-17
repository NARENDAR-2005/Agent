import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { ParsedResumeData } from './types';

export function generateATSSafeDOCX(resume: ParsedResumeData): Document {
  const candidateName =
    resume.candidateName && resume.candidateName !== 'Candidate' && resume.candidateName !== 'Not found'
      ? resume.candidateName.toUpperCase()
      : '[YOUR FULL NAME]';

  const validEmail =
    resume.email && resume.email !== 'Not found' && resume.email !== 'Not detected'
      ? resume.email
      : '[your.email@domain.com]';
  const validPhone =
    resume.phone && resume.phone !== 'Not found' && resume.phone !== 'Not detected'
      ? resume.phone
      : '[+91 XXXXX XXXXX]';
  const validLinkedIn =
    resume.links.linkedin && resume.links.linkedin !== 'Not found'
      ? resume.links.linkedin.replace(/^https?:\/\/(?:www\.)?/i, '')
      : 'linkedin.com/in/[your-username]';
  const validGitHub =
    resume.links.github && resume.links.github !== 'Not found'
      ? resume.links.github.replace(/^https?:\/\/(?:www\.)?/i, '')
      : 'github.com/[your-username]';

  const contactLine = [validEmail, validPhone, validLinkedIn, validGitHub]
    .filter(Boolean)
    .join('  |  ');

  const degreeText =
    resume.education.length > 0 && resume.education[0].degree
      ? resume.education[0].degree
      : '[Your Degree & Major]';
  const topSkills = resume.skills.length > 0 ? resume.skills.slice(0, 6).join(', ') : '[your core technical skills]';
  const firstProjectTitle =
    resume.projects.length > 0 && resume.projects[0].title
      ? resume.projects[0].title
      : '[your key project name]';

  const summaryParagraphText = `${degreeText} graduate with hands-on experience in ${topSkills}, demonstrated through building ${firstProjectTitle}. Seeking an entry-level [target role] role.`;

  const createSectionHeader = (title: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: {
        bottom: {
          color: '141414',
          space: 4,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font: 'Arial',
          size: 22,
          color: '141414',
        }),
      ],
    });
  };

  const createBullet = (text: string, boldPrefix?: string) => {
    const children: TextRun[] = [];
    if (boldPrefix) {
      children.push(
        new TextRun({
          text: boldPrefix + ' ',
          bold: true,
          font: 'Arial',
          size: 20,
          color: '141414',
        })
      );
    }
    children.push(
      new TextRun({
        text: text,
        font: 'Arial',
        size: 20,
        color: '141414',
      })
    );

    return new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 80 },
      children,
    });
  };

  const projectParagraphs: Paragraph[] = [];
  if (resume.projects.length > 0) {
    resume.projects.forEach(proj => {
      const techStr = proj.techStack.length > 0 ? proj.techStack.join(', ') : '[tech stack used]';
      projectParagraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: `${proj.title} | ${techStr}`,
              bold: true,
              font: 'Arial',
              size: 20,
            }),
          ],
        })
      );
      if (proj.description.length > 0) {
        proj.description.forEach(desc => {
          projectParagraphs.push(createBullet(desc));
        });
      }
      projectParagraphs.push(
        createBullet(
          `Built ${proj.title} using ${techStr}, achieving [X% accuracy / improvement] across [number of users or records].`
        )
      );
    });
  } else {
    projectParagraphs.push(
      createBullet(
        `Built [project name] using ${topSkills}, achieving [X% result] across [number of users or records].`
      )
    );
  }

  const experienceParagraphs: Paragraph[] = [];
  if (resume.experience.length > 0) {
    resume.experience.forEach(exp => {
      experienceParagraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: `${exp.role} | ${exp.company} (${exp.duration})`,
              bold: true,
              font: 'Arial',
              size: 20,
            }),
          ],
        })
      );
      (exp.description || []).forEach(b => experienceParagraphs.push(createBullet(b)));
    });
  }

  const educationParagraphs: Paragraph[] = [];
  if (resume.education.length > 0) {
    resume.education.forEach(edu => {
      educationParagraphs.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `${edu.degree} — ${edu.institution}`,
              bold: true,
              font: 'Arial',
              size: 20,
            }),
            new TextRun({
              text: `  (${edu.year || '[Graduation Year]'}${edu.score ? ' | Score: ' + edu.score : ''})`,
              font: 'Arial',
              size: 20,
              color: '555555',
            }),
          ],
        })
      );
    });
  } else {
    educationParagraphs.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: '[Your Degree & Major] — [Your University / College] | [Graduation Year] | CGPA: [X.X/10]',
            font: 'Arial',
            size: 20,
          }),
        ],
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: candidateName,
                bold: true,
                font: 'Arial',
                size: 32,
                color: '141414',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: contactLine,
                font: 'Arial',
                size: 18,
                color: '333333',
              }),
            ],
          }),
          createSectionHeader('Professional Summary'),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: summaryParagraphText,
                font: 'Arial',
                size: 20,
                color: '141414',
              }),
            ],
          }),
          createSectionHeader('Technical Skills'),
          createBullet(
            resume.skills.length > 0 ? resume.skills.join(', ') : '[Add your programming languages, frameworks, and tools]',
            'Skills Found:'
          ),
          createSectionHeader('Projects'),
          ...projectParagraphs,
          ...(experienceParagraphs.length > 0
            ? [createSectionHeader('Experience'), ...experienceParagraphs]
            : []),
          createSectionHeader('Education'),
          ...educationParagraphs,
        ],
      },
    ],
  });
}
