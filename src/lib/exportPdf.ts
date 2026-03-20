import jsPDF from "jspdf";

interface ExportItem {
  title: string;
  content: string;
  subtitle?: string;
}

export function exportToPdf(items: ExportItem[], docTitle: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const usable = pageW - margin * 2;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(docTitle, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Exportado em ${new Date().toLocaleDateString("pt-BR")} — MedStudy AI`, margin, y);
  doc.setTextColor(0);
  y += 10;

  items.forEach((item, idx) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Item title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(`${idx + 1}. ${item.title}`, usable);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 5 + 2;

    if (item.subtitle) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text(item.subtitle, margin, y);
      doc.setTextColor(0);
      y += 5;
    }

    // Item content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const contentLines = doc.splitTextToSize(item.content, usable);
    contentLines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 4.5;
    });

    y += 6;
  });

  doc.save(`${docTitle.replace(/\s+/g, "_")}.pdf`);
}
