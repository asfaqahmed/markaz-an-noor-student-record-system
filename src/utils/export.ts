import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (data: any[], title: string, filename: string) => {
  if (data.length === 0) return;

  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 20, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);

  // Prepare data for table
  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(header => item[header] || ''));

  // Add table
  doc.autoTable({
    startY: 40,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [4, 120, 87], // Islamic emerald color
      textColor: [255, 255, 255],
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 40, right: 20, bottom: 20, left: 20 }
  });

  // Save the PDF
  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const formatGradeForExport = (grade: string) => {
  const gradeDescriptions = {
    'A': 'A (Did properly)',
    'B': 'B (Attended)',
    'C': 'C (Late)',
    'D': 'D (Unattended)'
  };
  return gradeDescriptions[grade as keyof typeof gradeDescriptions] || grade;
};

export const formatDateForExport = (dateString: string) => {
  return format(new Date(dateString), 'MMM dd, yyyy');
};

export const prepareParticipationDataForExport = (records: any[]) => {
  return records.map(record => ({
    'Date': formatDateForExport(record.date),
    'Student': record.student?.user?.name || 'Unknown',
    'Class': record.student?.class || 'Unknown',
    'Activity Code': record.activity?.code || 'Unknown',
    'Activity': record.activity?.description || 'Unknown',
    'Grade': formatGradeForExport(record.grade),
    'Remarks': record.remarks || 'None',
    'Teacher': record.teacher?.user?.name || 'Unknown'
  }));
};

export const prepareAlertsDataForExport = (alerts: any[]) => {
  return alerts.map(alert => ({
    'Date': formatDateForExport(alert.created_at),
    'Student': alert.student?.user?.name || 'Unknown',
    'Class': alert.student?.class || 'Unknown',
    'Priority': alert.priority?.toUpperCase() || 'MEDIUM',
    'Status': alert.status?.toUpperCase() || 'OPEN',
    'Comment': alert.comment || 'None',
    'Teacher': alert.teacher?.user?.name || 'Unknown'
  }));
};

export const prepareLeavesDataForExport = (leaves: any[]) => {
  return leaves.map(leave => ({
    'Date': formatDateForExport(leave.date),
    'Student': leave.student?.user?.name || 'Unknown',
    'Class': leave.student?.class || 'Unknown',
    'Reason': leave.reason || 'Not specified',
    'Reported On': formatDateForExport(leave.created_at)
  }));
};