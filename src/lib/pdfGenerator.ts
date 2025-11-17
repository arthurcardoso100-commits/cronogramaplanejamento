import jsPDF from "jspdf";
import { Activity } from "@/pages/Schedule";
import { format, differenceInDays, min, max } from "date-fns";
import { ptBR } from "date-fns/locale";
import vestasLogo from "@/assets/vestas-logo.png";

export const generatePDF = (activities: Activity[], activityName: string, windfarmName: string) => {
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

  // Add Vestas logo
  pdf.addImage(vestasLogo, "PNG", margin, margin, 50, 12);

  // Title
  pdf.setTextColor(33, 87, 138);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(
    `Cronograma ${activityName} - ${windfarmName}`,
    pageWidth / 2,
    margin + 10,
    { align: "center" }
  );

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
    seq: 15,
    functional: 70,
    serial: 30,
    start: 25,
    end: 25,
    duration: 20,
    predecessor: 25,
    gantt: contentWidth - 210,
  };

  // Header background
  pdf.setFillColor(33, 87, 138);
  pdf.rect(margin, yPos, contentWidth, 10, "F");

  // Header text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  
  let xPos = margin + 2;
  pdf.text("Seq", xPos, yPos + 7);
  xPos += colWidths.seq;
  pdf.text("Description of functional location", xPos, yPos + 7);
  xPos += colWidths.functional;
  pdf.text("Serial Number", xPos, yPos + 7);
  xPos += colWidths.serial;
  pdf.text("Início", xPos, yPos + 7);
  xPos += colWidths.start;
  pdf.text("Fim", xPos, yPos + 7);
  xPos += colWidths.end;
  pdf.text("Dur.", xPos, yPos + 7);
  xPos += colWidths.duration;
  pdf.text("Pred.", xPos, yPos + 7);
  xPos += colWidths.predecessor;
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
  
  // Create a map of activities by their seq number for predecessor lookup
  const activityMap = new Map<string, { index: number; activity: Activity }>();
  activities.forEach((activity, index) => {
    activityMap.set(activity.activityDescription, { index, activity });
  });
  
  activities.forEach((activity, index) => {
    const rowHeight = 12;
    
    // Alternate row colors
    if (index % 2 === 0) {
      pdf.setFillColor(245, 247, 250);
      pdf.rect(margin, yPos, contentWidth, rowHeight, "F");
    }

    // Draw borders
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, yPos, contentWidth, rowHeight);

    // Row text
    pdf.setFontSize(7);
    xPos = margin + 2;
    
    // Seq
    pdf.text(activity.activityDescription, xPos, yPos + 8, {
      maxWidth: colWidths.seq - 4,
    });
    xPos += colWidths.seq;
    
    // Functional Description
    pdf.text(activity.functionalDescription, xPos, yPos + 8, {
      maxWidth: colWidths.functional - 4,
    });
    xPos += colWidths.functional;
    
    // Serial Number
    pdf.text(activity.serialNumber, xPos, yPos + 8, {
      maxWidth: colWidths.serial - 4,
    });
    xPos += colWidths.serial;
    
    // Start Date
    pdf.text(format(activity.startDate, "dd/MM/yy"), xPos, yPos + 8);
    xPos += colWidths.start;
    
    // End Date
    pdf.text(format(activity.endDate, "dd/MM/yy"), xPos, yPos + 8);
    xPos += colWidths.end;
    
    // Duration
    pdf.text(`${activity.duration}d`, xPos, yPos + 8);
    xPos += colWidths.duration;

    // Predecessor
    pdf.text(activity.predecessor || "-", xPos, yPos + 8, {
      maxWidth: colWidths.predecessor - 4,
    });
    xPos += colWidths.predecessor;

    // Gantt bar
    const ganttX = xPos;
    const ganttWidth = colWidths.gantt - 4;
    const ganttY = yPos + 2;
    const ganttHeight = rowHeight - 4;

    // Calculate bar position and width
    const daysFromStart = differenceInDays(activity.startDate, projectStart);
    const activityDays = differenceInDays(activity.endDate, activity.startDate) + 1;
    
    const barX = ganttX + (daysFromStart / totalDays) * ganttWidth;
    const barWidth = (activityDays / totalDays) * ganttWidth;

    // Draw Gantt bar
    pdf.setFillColor(52, 168, 211);
    pdf.roundedRect(barX, ganttY, barWidth, ganttHeight, 1, 1, "F");

    // Draw predecessor arrow if exists
    if (activity.predecessor && activity.predecessor !== "-") {
      const predecessorData = activityMap.get(activity.predecessor);
      if (predecessorData) {
        const predActivity = predecessorData.activity;
        const predIndex = predecessorData.index;
        
        // Calculate predecessor bar end position
        const predDaysFromStart = differenceInDays(predActivity.endDate, projectStart);
        const predBarEndX = ganttX + (predDaysFromStart / totalDays) * ganttWidth;
        const predBarY = margin + 35 + (predIndex * rowHeight) + rowHeight / 2;
        
        // Current activity bar start position
        const currentBarY = ganttY + ganttHeight / 2;
        
        // Draw arrow (MS Project style: horizontal then vertical then horizontal)
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.3);
        
        // Horizontal line from predecessor end
        const horizontalMidX = predBarEndX + 3;
        pdf.line(predBarEndX, predBarY, horizontalMidX, predBarY);
        
        // Vertical line
        pdf.line(horizontalMidX, predBarY, horizontalMidX, currentBarY);
        
        // Horizontal line to current activity
        pdf.line(horizontalMidX, currentBarY, barX, currentBarY);
        
        // Draw arrow head
        pdf.line(barX, currentBarY, barX - 1.5, currentBarY - 1);
        pdf.line(barX, currentBarY, barX - 1.5, currentBarY + 1);
      }
    }

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

  // Save PDF with custom filename
  const dateStr = format(new Date(), "yyyyMMdd");
  const fileName = `Cronograma ${activityName} - ${windfarmName}_${dateStr}.pdf`;
  pdf.save(fileName);
};
