import jsPDF from "jspdf";
import { Activity } from "@/pages/Schedule";
import { format, differenceInDays, min, max, getWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import vestasLogo from "@/assets/vestas-logo.png";

const drawHeader = (pdf: jsPDF, pageWidth: number, margin: number, activityName: string, windfarmName: string, pageNum: number) => {
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
    `Page ${pageNum}`,
    pageWidth - margin,
    margin + 10,
    { align: "right" }
  );
};

const drawCalendarHeader = (pdf: jsPDF, yPos: number, ganttX: number, ganttWidth: number, projectStart: Date, totalWeeks: number, tableHeight: number) => {
  const weekWidth = ganttWidth / totalWeeks;
  
  // Draw month/year labels
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  
  // Build month segments based on actual week dates
  const monthSegments: { month: number, year: number, startX: number, endX: number }[] = [];
  let currentMonth = -1;
  let currentYear = -1;
  let segmentStartX = ganttX;
  
  for (let i = 0; i < totalWeeks; i++) {
    const weekDate = new Date(projectStart);
    weekDate.setDate(weekDate.getDate() + (i * 7));
    const weekX = ganttX + (i * weekWidth);
    const weekMonth = weekDate.getMonth();
    const weekYear = weekDate.getFullYear();
    
    // Check if month or year changed
    if (weekMonth !== currentMonth || weekYear !== currentYear) {
      // Save previous segment if exists
      if (currentMonth !== -1) {
        monthSegments.push({
          month: currentMonth,
          year: currentYear,
          startX: segmentStartX,
          endX: weekX
        });
      }
      currentMonth = weekMonth;
      currentYear = weekYear;
      segmentStartX = weekX;
    }
  }
  
  // Add last segment
  monthSegments.push({
    month: currentMonth,
    year: currentYear,
    startX: segmentStartX,
    endX: ganttX + ganttWidth
  });
  
  // Draw month labels
  const monthBoundaries: number[] = [];
  monthSegments.forEach((segment, index) => {
    const segmentWidth = segment.endX - segment.startX;
    const centerX = segment.startX + segmentWidth / 2;
    
    const monthDate = new Date(segment.year, segment.month, 1);
    const monthLabel = format(monthDate, "MMM/yyyy");
    pdf.text(monthLabel, centerX, yPos + 4, { align: "center" });
    
    // Add boundary except for the first segment
    if (index > 0) {
      monthBoundaries.push(segment.startX);
    }
  });
  
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
    const weekNum = getWeek(weekDate);
    
    // Draw vertical separator
    if (i > 0) {
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.1);
      pdf.line(weekX, yPos + 6, weekX, yPos + 16);
    }
    
    // Draw week label with "Week" on top and number below
    pdf.text("Week", weekX + weekWidth / 2, yPos + 9, { align: "center" });
    pdf.text(weekNum.toString().padStart(2, '0'), weekX + weekWidth / 2, yPos + 13, { align: "center" });
  }
  
  // Draw subtle minimalist month dividers through the entire table
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.15);
  monthBoundaries.forEach(boundaryX => {
    pdf.line(boundaryX, yPos, boundaryX, yPos + 16 + tableHeight);
  });
  
  return monthBoundaries;
};

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
  const maxActivitiesPerPage = 50;
  const headerHeight = 25;
  const calendarHeight = 16;
  const availableHeight = pageHeight - (2 * margin) - headerHeight - calendarHeight;
  
  // Calculate number of pages
  const totalPages = Math.ceil(activities.length / maxActivitiesPerPage);
  
  // Process each page
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }
    
    const pageNum = pageIndex + 1;
    const startIdx = pageIndex * maxActivitiesPerPage;
    const endIdx = Math.min(startIdx + maxActivitiesPerPage, activities.length);
    const pageActivities = activities.slice(startIdx, endIdx);
    const activitiesCount = pageActivities.length;
    
    // Calculate dynamic row height to fit activities in available space
    const rowHeight = availableHeight / maxActivitiesPerPage;
    
    // Draw header
    drawHeader(pdf, pageWidth, margin, activityName, windfarmName, pageNum);
    
    // Table starting position
    let yPos = margin + headerHeight;
    
    // Calculate date range for this page's activities
    const pageDates = pageActivities.flatMap(a => [a.startDate, a.endDate]);
    const minDate = min(pageDates);
    const maxDate = max(pageDates);
    
    const projectStart = new Date(minDate);
    projectStart.setDate(projectStart.getDate() - 2);
    
    const projectEnd = new Date(maxDate);
    projectEnd.setDate(projectEnd.getDate() + 10);
    
    const totalDays = differenceInDays(projectEnd, projectStart) + 1;

    // Check if any activity has team information
    const hasTeamInfo = pageActivities.some(a => a.team && a.team.trim() !== "");

    // Table headers - adjust column widths based on whether team column is shown
    const colWidths = hasTeamInfo ? {
      seq: 15,
      functional: 70,
      serial: 30,
      team: 20,
      start: 28,
      end: 28,
      duration: 22,
      gantt: contentWidth - 213,
    } : {
      seq: 15,
      functional: 70,
      serial: 30,
      start: 28,
      end: 28,
      duration: 22,
      gantt: contentWidth - 193,
    };

    // Header background with modern gradient effect
    pdf.setFillColor(33, 87, 138);
    pdf.rect(margin, yPos, contentWidth, 16, "F");

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
    
    // Only show Team column if any activity has team info
    if (hasTeamInfo) {
      pdf.text("Team", xPos, yPos + 8);
      xPos += colWidths.team;
    }
    
    pdf.text("Start", xPos, yPos + 8);
    xPos += colWidths.start;
    pdf.text("End", xPos, yPos + 8);
    xPos += colWidths.end;
    pdf.text("Duration (days)", xPos, yPos + 8);
    xPos += colWidths.duration;
    
    // Draw calendar header for Gantt column
    const ganttX = xPos;
    const ganttWidth = colWidths.gantt - 4;
    
    // Calculate weeks to show
    const totalWeeks = Math.ceil(totalDays / 7);
    
    // Calculate table height
    const tableHeight = rowHeight * activitiesCount;
    
    // Draw calendar header and get month boundaries
    const monthBoundaries = drawCalendarHeader(pdf, yPos, ganttX, ganttWidth, projectStart, totalWeeks, tableHeight);

    yPos += 16;

    // Table rows
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    
    pageActivities.forEach((activity, index) => {
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
      
      // Seq - centered vertically
      const textY = yPos + rowHeight / 2 + 1;
      pdf.text(activity.id, xPos, textY, {
        maxWidth: colWidths.seq - 4,
      });
      xPos += colWidths.seq;
      
      // Functional Description
      pdf.text(activity.functionalDescription, xPos, textY, {
        maxWidth: colWidths.functional - 4,
      });
      xPos += colWidths.functional;
      
      // Serial Number
      pdf.text(activity.serialNumber, xPos, textY, {
        maxWidth: colWidths.serial - 4,
      });
      xPos += colWidths.serial;
      
      // Team - only show if any activity has team info
      if (hasTeamInfo) {
        pdf.text(activity.team || "-", xPos, textY, {
          maxWidth: colWidths.team - 4,
        });
        xPos += colWidths.team;
      }
      
      // Start Date with day abbreviation
      const startDayAbbr = format(activity.startDate, "EEE", { locale: enUS });
      pdf.text(`${startDayAbbr} ${format(activity.startDate, "dd/MM/yyyy")}`, xPos, textY);
      xPos += colWidths.start;
      
      // End Date with day abbreviation
      const endDayAbbr = format(activity.endDate, "EEE", { locale: enUS });
      pdf.text(`${endDayAbbr} ${format(activity.endDate, "dd/MM/yyyy")}`, xPos, textY);
      xPos += colWidths.end;
      
      // Duration
      pdf.text(`${activity.duration}d`, xPos, textY);
      xPos += colWidths.duration;

      // Gantt bar
      const ganttBarX = xPos;
      const ganttBarWidth = colWidths.gantt - 4;
      const ganttY = yPos + 3;
      const ganttHeight = rowHeight - 6;

      // Calculate bar position and width
      const daysFromStart = differenceInDays(activity.startDate, projectStart);
      const activityDays = differenceInDays(activity.endDate, activity.startDate) + 1;
      
      const barX = ganttBarX + (daysFromStart / totalDays) * ganttBarWidth;
      const barWidth = (activityDays / totalDays) * ganttBarWidth;

      // Draw minimalist Gantt bar
      pdf.setFillColor(59, 130, 246);
      pdf.roundedRect(barX, ganttY, barWidth, ganttHeight, 2, 2, "F");
      
      // Add end date label at the end of the bar (only if it fits inside the table)
      pdf.setFontSize(6);
      pdf.setTextColor(60, 60, 60);
      const endDateLabel = format(activity.endDate, "dd/MM/yyyy");
      const endDateWidth = pdf.getTextWidth(endDateLabel);
      const labelX = barX + barWidth + 2;
      
      // Only draw label if it fits within the Gantt column
      if (labelX + endDateWidth <= ganttBarX + ganttBarWidth) {
        pdf.text(endDateLabel, labelX, ganttY + ganttHeight / 2 + 1);
      }

      yPos += rowHeight;
    });
  }

  // Save PDF with custom filename
  const dateStr = format(new Date(), "yyyyMMdd");
  const fileName = `Cronograma ${activityName} - ${windfarmName}_${dateStr}.pdf`;
  pdf.save(fileName);
};
