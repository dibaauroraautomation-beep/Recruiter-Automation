import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export function generateCoverLetterDocx() {
 // 1. Grab the text from the editable textarea (Cast as HTMLTextAreaElement)
  const textarea = document.getElementById("AI-generated-text-area-editable") as HTMLTextAreaElement | null;
  
  const content = textarea ? textarea.value : "";

  if (!content) {
    alert("No content available to export!");
    return;
  }

  // 2. Split the content by newlines so it preserves paragraphs perfectly
  const lines = content.split('\n');

  // Convert text lines into docx Paragraph elements
  const docxChildren = lines.map(line => {
    return new Paragraph({
      spacing: { after: 120 }, // Adds a neat spacing between paragraphs
      children: [
        new TextRun({
          text: line,
          font: "Arial",
          size: 24, // 24 half-points = 12pt font
        }),
      ],
    });
  });

  // 3. Build the native document structure
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title Header
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "Cover Letter",
              bold: true,
              size: 36, // 18pt font
              font: "Arial",
              color: "1F497D",
            }),
          ],
        }),
        // Spread the user's content paragraphs out below the title
        ...docxChildren
      ],
    }],
  });

  // 4. Compile structural objects into binary arrays and save file
  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "Cover_Letter.docx");
  });
}