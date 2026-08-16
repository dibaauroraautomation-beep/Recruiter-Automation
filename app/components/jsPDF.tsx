import { jsPDF } from 'jspdf';

export function generateCoverLetterPDF() {
  // 1. Grab the actual text from the editable textarea
  const textarea = document.getElementById("AI-generated-text-area-editable") as HTMLTextAreaElement | null;
  const content = textarea ? textarea.value : "";

  if (!content) {
    alert("No content available to export!");
    return;
  }

  const doc = new jsPDF();

  // 2. Configure font styles
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);

  // 3. Use splitTextToSize to automatically wrap long paragraphs cleanly
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  
  const textLines = doc.splitTextToSize(content, maxLineWidth);

  // 4. Draw the wrapped text onto the PDF
  doc.text(textLines, margin, 30);

  // 5. Save the file
  doc.save('Cover_Letter.pdf');
}