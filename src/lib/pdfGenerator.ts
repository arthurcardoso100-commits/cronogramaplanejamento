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

  // Add Vestas logo with correct aspect ratio (3.33:1)
  const logoWidth = 40;
  const logoHeight = 18;
  pdf.addImage(vestasLogo, "PNG", margin, margin, logoWidth, logoHeight);

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

  // Page number in top right
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(10);
  pdf.text(
    `Page 1`,
    pageWidth - margin,
    margin + 10,
    { align: "right" }
  );

  // Table starting position
  let yPos = margin + 25;

  // Calculate date range for Gantt chart and calendar
  // Add 2 days buffer before and after
  const allDates = activities.flatMap(a => [a.startDate, a.endDate]);
  const minDate = min(allDates);
  const maxDate = max(allDates);
  
  const projectStart = new Date(minDate);
  projectStart.setDate(projectStart.getDate() - 2);
  
  const projectEnd = new Date(maxDate);
  projectEnd.setDate(projectEnd.getDate() + 2);
  
  const totalDays = differenceInDays(projectEnd, projectStart) + 1;

  // Table headers
  const colWidths = {
    seq: 15,
    functional: 70,
    serial: 30,
    start: 28,
    end: 28,
    duration: 22,
    predecessor: 25,
    gantt: contentWidth - 218,
  };

  // Header background with modern gradient effect
  pdf.setFillColor(33, 87, 138);
  pdf.rect(margin, yPos, contentWidth, 12, "F");

  // Header text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  
  let xPos = margin + 2;
  pdf.text("ID", xPos, yPos + 8);
  xPos += colWidths.seq;
  pdf.text("Description of functional location", xPos, yPos + 8);
  xPos += colWidths.functional;
  pdf.text("Serial Number", xPos, yPos + 8);
  xPos += colWidths.serial;
  pdf.text("Start", xPos, yPos + 8);
  xPos += colWidths.start;
  pdf.text("End", xPos, yPos + 8);
  xPos += colWidths.end;
  pdf.text("Duration", xPos, yPos + 8);
  xPos += colWidths.duration;
  pdf.text("Pred.", xPos, yPos + 8);
  xPos += colWidths.predecessor;
  
  // Draw calendar header for Gantt column
  const ganttX = xPos;
  const ganttWidth = colWidths.gantt - 4;
  
  // Calculate weeks to show
  const totalWeeks = Math.ceil(totalDays / 7);
  const weekWidth = ganttWidth / totalWeeks;
  
  // Draw month/year labels
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  
  let currentMonth = -1;
  let monthStartX = ganttX;
  
  for (let i = 0; i < totalWeeks; i++) {
    const weekDate = new Date(projectStart);
    weekDate.setDate(weekDate.getDate() + (i * 7));
    const weekX = ganttX + (i * weekWidth);
    
    // Check if month changed
    if (weekDate.getMonth() !== currentMonth) {
      // Draw previous month label if exists
      if (currentMonth !== -1) {
        const monthWidth = weekX - monthStartX;
        const prevMonth = new Date(weekDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const monthLabel = format(prevMonth, "MMM/yyyy");
        pdf.text(monthLabel, monthStartX + monthWidth / 2, yPos + 4, { align: "center" });
      }
      currentMonth = weekDate.getMonth();
      monthStartX = weekX;
    }
  }
  
  // Draw last month label
  const lastWeekDate = new Date(projectStart);
  lastWeekDate.setDate(lastWeekDate.getDate() + (totalWeeks * 7));
  const monthLabel = format(lastWeekDate, "MMM/yyyy");
  pdf.text(monthLabel, monthStartX + (ganttX + ganttWidth - monthStartX) / 2, yPos + 4, { align: "center" });
  
  // Draw separator line between months and weeks
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.3);
  pdf.line(ganttX, yPos + 6, ganttX + ganttWidth, yPos + 6);
  
  // Draw week numbers
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  
  for (let i = 0; i < totalWeeks; i++) {
    const weekDate = new Date(projectStart);
    weekDate.setDate(weekDate.getDate() + (i * 7));
    const weekX = ganttX + (i * weekWidth);
    const weekNum = i + 1;
    
    // Draw vertical separator
    if (i > 0) {
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.1);
      pdf.line(weekX, yPos + 6, weekX, yPos + 12);
    }
    
    pdf.text(`Week ${weekNum.toString().padStart(2, '0')}`, weekX + weekWidth / 2, yPos + 10, { align: "center" });
  }

  yPos += 12;

  // Table rows
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 60, 60);
  
  // Create a map of activities by their seq number for predecessor lookup
  const activityMap = new Map<string, { index: number; activity: Activity }>();
  activities.forEach((activity, index) => {
    activityMap.set(activity.activityDescription, { index, activity });
  });
  
  activities.forEach((activity, index) => {
    const rowHeight = 14;
    
    // Alternate row colors with modern styling
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPos, contentWidth, rowHeight, "F");
    }

    // Draw subtle borders
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
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
    pdf.text(format(activity.startDate, "dd/MM/yyyy"), xPos, yPos + 9);
    xPos += colWidths.start;
    
    // End Date
    pdf.text(format(activity.endDate, "dd/MM/yyyy"), xPos, yPos + 9);
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
    const ganttY = yPos + 3;
    const ganttHeight = rowHeight - 6;

    // Calculate bar position and width
    const daysFromStart = differenceInDays(activity.startDate, projectStart);
    const activityDays = differenceInDays(activity.endDate, activity.startDate) + 1;
    
    const barX = ganttX + (daysFromStart / totalDays) * ganttWidth;
    const barWidth = (activityDays / totalDays) * ganttWidth;

    // Draw minimalist Gantt bar
    pdf.setFillColor(59, 130, 246); // Modern blue
    pdf.roundedRect(barX, ganttY, barWidth, ganttHeight, 2, 2, "F");
    
    // Add end date label at the end of the bar
    pdf.setFontSize(6);
    pdf.setTextColor(60, 60, 60);
    const endDateLabel = format(activity.endDate, "dd/MM/yyyy");
    pdf.text(endDateLabel, barX + barWidth + 2, ganttY + ganttHeight / 2 + 1);

    // Draw predecessor arrow if exists
    if (activity.predecessor && activity.predecessor !== "-") {
      const predecessorData = activityMap.get(activity.predecessor);
      if (predecessorData) {
        const predActivity = predecessorData.activity;
        const predIndex = predecessorData.index;
        
        // Calculate predecessor bar end position
        const predDaysFromStart = differenceInDays(predActivity.startDate, projectStart);
        const predActivityDays = differenceInDays(predActivity.endDate, predActivity.startDate) + 1;
        const predBarX = ganttX + (predDaysFromStart / totalDays) * ganttWidth;
        const predBarWidth = (predActivityDays / totalDays) * ganttWidth;
        const predBarEndX = predBarX + predBarWidth;
        const predBarY = margin + 37 + (predIndex * rowHeight) + ganttY - yPos + ganttHeight / 2;
        
        // Current activity bar start position
        const currentBarY = ganttY + ganttHeight / 2;
        
        // Draw arrow (MS Project style: from end of predecessor bar to start of current bar)
        pdf.setDrawColor(75, 85, 99);
        pdf.setLineWidth(0.4);
        
        // Arrow exits before the end date label and enters before the bar
        // Horizontal line from predecessor bar end
        const horizontalMidX = predBarEndX + 1;
        pdf.line(predBarEndX, predBarY, horizontalMidX, predBarY);
        
        // Vertical line
        pdf.line(horizontalMidX, predBarY, horizontalMidX, currentBarY);
        
        // Horizontal line to current activity start (entering before the bar)
        const arrowTargetX = barX - 2;
        pdf.line(horizontalMidX, currentBarY, arrowTargetX, currentBarY);
        
        // Draw arrow head pointing to the start of the successor bar
        pdf.line(arrowTargetX, currentBarY, arrowTargetX - 2, currentBarY - 1.5);
        pdf.line(arrowTargetX, currentBarY, arrowTargetX - 2, currentBarY + 1.5);
      }
    }

    yPos += rowHeight;
  });

  // Footer with generation timestamp in center
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Save PDF with custom filename
  const dateStr = format(new Date(), "yyyyMMdd");
  const fileName = `Cronograma ${activityName} - ${windfarmName}_${dateStr}.pdf`;
  pdf.save(fileName);
};
