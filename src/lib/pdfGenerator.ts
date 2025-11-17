import jsPDF from "jspdf";
import { Activity } from "@/pages/Schedule";
import { format, differenceInDays, min, max } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generatePDF = (activities: Activity[]) => {
  // A3 landscape dimensions in mm
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Logo area (simplified - text for now)
  pdf.setFillColor(33, 87, 138); // Vestas blue
  pdf.rect(margin, margin, 50, 15, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("VESTAS", margin + 5, margin + 10);

  // Title
  pdf.setTextColor(33, 87, 138);
  pdf.setFontSize(20);
  pdf.text("CRONOGRAMA DE SERVIÇO", pageWidth / 2, margin + 10, {
    align: "center",
  });

  // Date
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(10);
  pdf.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
    pageWidth - margin,
    margin + 10,
    { align: "right" }
  );

  // Table starting position
  let yPos = margin + 25;

  // Table headers
  const colWidths = {
    serial: 35,
    functional: 60,
    activity: 80,
    start: 30,
    end: 30,
    duration: 25,
    gantt: contentWidth - 260,
  };

  // Header background
  pdf.setFillColor(33, 87, 138);
  pdf.rect(margin, yPos, contentWidth, 10, "F");

  // Header text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  
  let xPos = margin + 2;
  pdf.text("Serial Number", xPos, yPos + 7);
  xPos += colWidths.serial;
  pdf.text("Functional Desc.", xPos, yPos + 7);
  xPos += colWidths.functional;
  pdf.text("Descrição da Atividade", xPos, yPos + 7);
  xPos += colWidths.activity;
  pdf.text("Início", xPos, yPos + 7);
  xPos += colWidths.start;
  pdf.text("Término", xPos, yPos + 7);
  xPos += colWidths.end;
  pdf.text("Duração", xPos, yPos + 7);
  xPos += colWidths.duration;
  pdf.text("Gantt", xPos, yPos + 7);

  yPos += 10;

  // Calculate date range for Gantt chart
  const allDates = activities.flatMap(a => [a.startDate, a.endDate]);
  const projectStart = min(allDates);
  const projectEnd = max(allDates);
  const totalDays = differenceInDays(projectEnd, projectStart) + 1;

  // Table rows
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 60, 60);
  
  activities.forEach((activity, index) => {
    const rowHeight = 15;
    
    // Alternate row colors
    if (index % 2 === 0) {
      pdf.setFillColor(245, 247, 250);
      pdf.rect(margin, yPos, contentWidth, rowHeight, "F");
    }

    // Draw borders
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, yPos, contentWidth, rowHeight);

    // Row text
    pdf.setFontSize(8);
    xPos = margin + 2;
    
    // Serial Number
    pdf.text(activity.serialNumber, xPos, yPos + 10, {
      maxWidth: colWidths.serial - 4,
    });
    xPos += colWidths.serial;
    
    // Functional Description
    pdf.text(activity.functionalDescription, xPos, yPos + 10, {
      maxWidth: colWidths.functional - 4,
    });
    xPos += colWidths.functional;
    
    // Activity Description
    const lines = pdf.splitTextToSize(
      activity.activityDescription,
      colWidths.activity - 4
    );
    pdf.text(lines[0], xPos, yPos + 10);
    xPos += colWidths.activity;
    
    // Start Date
    pdf.text(format(activity.startDate, "dd/MM/yyyy"), xPos, yPos + 10);
    xPos += colWidths.start;
    
    // End Date
    pdf.text(format(activity.endDate, "dd/MM/yyyy"), xPos, yPos + 10);
    xPos += colWidths.end;
    
    // Duration
    pdf.text(`${activity.duration}d`, xPos, yPos + 10);
    xPos += colWidths.duration;

    // Gantt bar
    const ganttX = xPos;
    const ganttWidth = colWidths.gantt - 4;
    const ganttY = yPos + 3;
    const ganttHeight = rowHeight - 6;

    // Calculate bar position and width
    const daysFromStart = differenceInDays(activity.startDate, projectStart);
    const activityDays = differenceInDays(activity.endDate, activity.startDate) + 1;
    
    const barX = ganttX + (daysFromStart / totalDays) * ganttWidth;
    const barWidth = (activityDays / totalDays) * ganttWidth;

    // Draw Gantt bar
    pdf.setFillColor(52, 168, 211); // Wind blue
    pdf.roundedRect(barX, ganttY, barWidth, ganttHeight, 2, 2, "F");

    yPos += rowHeight;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    "Vestas Wind Systems A/S - Planejamento",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Save PDF
  const fileName = `Cronograma_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
  pdf.save(fileName);
};
