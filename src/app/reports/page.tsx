'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download,
  Calendar,
  Users,
  BookOpen,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Filter,
  Clock,
  Trash2,
  Save,
  X,
  Edit,
  Plus,
  Settings,
  Eye,
  Mail,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { exportToCSV, exportToPDF, prepareParticipationDataForExport, prepareAlertsDataForExport, prepareLeavesDataForExport } from '@/utils/export';
import Layout from '@/components/Layout';
import RouteGuard from '@/components/RouteGuard';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ReportData {
  participationRecords: any[];
  alerts: any[];
  leaves: any[];
  students: any[];
  activities: any[];
  teachers: any[];
}

interface ReportConfig {
  id?: string;
  name: string;
  type: 'student' | 'participation' | 'alerts' | 'teacher' | 'class' | 'custom';
  filters: any;
  dateRange: {
    from: string;
    to: string;
  };
  schedule: 'once' | 'daily' | 'weekly' | 'monthly';
  exportFormat: 'pdf' | 'csv' | 'excel';
  createdAt?: string;
}

interface SavedReport {
  id: string;
  configId: string;
  name: string;
  type: string;
  generatedAt: string;
  data: any;
  exportFormat: string;
}

function ReportsPageContent() {
  const { isAdmin } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({
    participationRecords: [],
    alerts: [],
    leaves: [],
    students: [],
    activities: [],
    teachers: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedClass, setSelectedClass] = useState('');
  const [reportType, setReportType] = useState('participation');
  const [reportSubType, setReportSubType] = useState('monthly'); // 'monthly' or 'individual'
  const [selectedStudent, setSelectedStudent] = useState('');
  
  // Report Management State
  const [showReportModal, setShowReportModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReportConfig | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportConfigs, setReportConfigs] = useState<ReportConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<ReportConfig>({
    name: '',
    type: 'student',
    filters: {},
    dateRange: { from: '', to: '' },
    schedule: 'once',
    exportFormat: 'pdf'
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchReportData();
    loadSavedConfigs();
  }, [selectedPeriod]);

  // Load saved report configurations from localStorage
  const loadSavedConfigs = () => {
    try {
      const saved = localStorage.getItem('reportConfigs');
      if (saved) {
        setReportConfigs(JSON.parse(saved));
      }
      const savedReportsData = localStorage.getItem('savedReports');
      if (savedReportsData) {
        setSavedReports(JSON.parse(savedReportsData));
      }
    } catch (error) {
      console.error('Error loading saved configs:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const now = new Date();
      let dateFrom: string;
      
      switch (selectedPeriod) {
        case 'day':
          dateFrom = format(now, 'yyyy-MM-dd');
          break;
        case 'week':
          dateFrom = format(subWeeks(now, 1), 'yyyy-MM-dd');
          break;
        case 'month':
          dateFrom = format(subMonths(now, 1), 'yyyy-MM-dd');
          break;
        case 'quarter':
          dateFrom = format(subMonths(now, 3), 'yyyy-MM-dd');
          break;
        case 'year':
          dateFrom = format(subMonths(now, 12), 'yyyy-MM-dd');
          break;
        default:
          dateFrom = format(subWeeks(now, 1), 'yyyy-MM-dd');
      }

      // Fetch all data in parallel
      const [
        participationResult,
        alertsResult,
        leavesResult,
        studentsResult,
        activitiesResult,
        teachersResult
      ] = await Promise.all([
        db.getParticipationRecords({ dateFrom, dateTo: format(now, 'yyyy-MM-dd') }),
        db.getAlerts(),
        db.getLeaves(),
        db.getStudents(),
        db.getActivities(),
        db.getTeachers()
      ]);

      // Filter out records with null/undefined critical data
      const validParticipationRecords = (participationResult.data || []).filter(record => 
        record && record.student && record.teacher && record.activity
      );
      
      const validAlerts = (alertsResult.data || []).filter(alert => 
        alert && alert.student && alert.teacher
      );

      setReportData({
        participationRecords: validParticipationRecords,
        alerts: validAlerts,
        leaves: leavesResult.data?.filter(leave => leave && new Date(leave.date) >= new Date(dateFrom)) || [],
        students: studentsResult.data || [],
        activities: activitiesResult.data || [],
        teachers: teachersResult.data || []
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set empty data on error to prevent crashes
      setReportData({
        participationRecords: [],
        alerts: [],
        leaves: [],
        students: [],
        activities: [],
        teachers: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Report Management Functions
  const openConfigModal = (config?: ReportConfig) => {
    if (config) {
      setCurrentConfig(config);
      setEditingConfig(config);
    } else {
      setCurrentConfig({
        name: '',
        type: 'student',
        filters: {},
        dateRange: { from: '', to: '' },
        schedule: 'once',
        exportFormat: 'pdf'
      });
      setEditingConfig(null);
    }
    setShowConfigModal(true);
  };

  const closeConfigModal = () => {
    setShowConfigModal(false);
    setCurrentConfig({
      name: '',
      type: 'student',
      filters: {},
      dateRange: { from: '', to: '' },
      schedule: 'once',
      exportFormat: 'pdf'
    });
    setEditingConfig(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newConfig = {
        ...currentConfig,
        id: editingConfig?.id || Date.now().toString(),
        createdAt: editingConfig?.createdAt || new Date().toISOString()
      };

      let updatedConfigs;
      if (editingConfig) {
        updatedConfigs = reportConfigs.map(config => 
          config.id === editingConfig.id ? newConfig : config
        );
      } else {
        updatedConfigs = [...reportConfigs, newConfig];
      }

      setReportConfigs(updatedConfigs);
      localStorage.setItem('reportConfigs', JSON.stringify(updatedConfigs));
      closeConfigModal();
      
      alert(editingConfig ? 'Report configuration updated successfully!' : 'Report configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving report configuration. Please try again.');
    }
  };

  const handleDeleteConfig = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the report configuration "${name}"?`)) {
      const updatedConfigs = reportConfigs.filter(config => config.id !== id);
      setReportConfigs(updatedConfigs);
      localStorage.setItem('reportConfigs', JSON.stringify(updatedConfigs));
      
      // Also remove any saved reports with this config
      const updatedSavedReports = savedReports.filter(report => report.configId !== id);
      setSavedReports(updatedSavedReports);
      localStorage.setItem('savedReports', JSON.stringify(updatedSavedReports));
      
      alert('Report configuration deleted successfully!');
    }
  };

  const generateReport = async (config: ReportConfig) => {
    try {
      let data: any[] = [];
      let title = '';
      let insights: string[] = [];

      // Apply filters based on config
      const filteredData = applyFilters(config);

      switch (config.type) {
        case 'student':
          data = prepareStudentReport(filteredData, config);
          title = `Student Performance Report - ${config.name}`;
          insights = generateStudentInsights(filteredData);
          break;
        case 'participation':
          data = prepareParticipationDataForExport(filteredData.participationRecords);
          title = `Participation Report - ${config.name}`;
          insights = generateParticipationInsights(filteredData);
          break;
        case 'alerts':
          data = prepareAlertsDataForExport(filteredData.alerts);
          title = `Alerts Report - ${config.name}`;
          insights = generateAlertsInsights(filteredData);
          break;
        case 'teacher':
          data = prepareTeacherReport(filteredData, config);
          title = `Teacher Activity Report - ${config.name}`;
          insights = generateTeacherInsights(filteredData);
          break;
        case 'class':
          data = prepareClassReport(filteredData, config);
          title = `Class Performance Report - ${config.name}`;
          insights = generateClassInsights(filteredData);
          break;
      }

      const reportData = {
        title,
        data,
        insights,
        generatedAt: new Date().toISOString(),
        config
      };

      setPreviewData(reportData);
      setShowPreviewModal(true);

      // Save generated report
      const savedReport: SavedReport = {
        id: Date.now().toString(),
        configId: config.id || '',
        name: config.name,
        type: config.type,
        generatedAt: new Date().toISOString(),
        data: reportData,
        exportFormat: config.exportFormat
      };

      const updatedSavedReports = [...savedReports, savedReport];
      setSavedReports(updatedSavedReports);
      localStorage.setItem('savedReports', JSON.stringify(updatedSavedReports));

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  const exportReport = (exportFormat: 'pdf' | 'csv' | 'excel') => {
    if (!previewData) return;

    try {
      const filename = `${previewData.config.name.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}`;
      
      switch (exportFormat) {
        case 'csv':
          exportToCSV(previewData.data, filename);
          break;
        case 'pdf':
          exportToPDF(previewData.data, previewData.title, filename);
          break;
        case 'excel':
          // For now, export as CSV (Excel export would require additional library)
          exportToCSV(previewData.data, filename);
          break;
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  const scheduleReport = (config: ReportConfig) => {
    // For now, just show a message. In a real implementation, this would set up server-side scheduling
    alert(`Report "${config.name}" has been scheduled for ${config.schedule} generation. You will receive notifications when new reports are available.`);
  };

  const handleGenerateReport = async (type: 'csv' | 'pdf') => {
    try {
      let data: any[] = [];
      let filename = '';
      let title = '';

      // Handle different report types and subtypes
      switch (reportType) {
        case 'participation':
          if (reportSubType === 'monthly') {
            data = prepareMonthlyParticipationReport();
            filename = 'monthly_participation_report';
            title = 'Monthly Participation Summary Report';
          } else {
            if (!selectedStudent) {
              alert('Please select a student for individual report.');
              return;
            }
            data = prepareIndividualParticipationReport(selectedStudent);
            filename = `individual_participation_report_${selectedStudent}`;
            title = 'Individual Student Participation Report';
          }
          break;
        case 'alerts':
          if (reportSubType === 'monthly') {
            data = prepareMonthlyAlertsReport();
            filename = 'monthly_alerts_report';
            title = 'Monthly Student Alerts Report';
          } else {
            if (!selectedStudent) {
              alert('Please select a student for individual report.');
              return;
            }
            data = prepareIndividualAlertsReport(selectedStudent);
            filename = `individual_alerts_report_${selectedStudent}`;
            title = 'Individual Student Alerts Report';
          }
          break;
        case 'leaves':
          data = prepareLeavesDataForExport(reportData.leaves);
          filename = 'leaves_report';
          title = 'Student Leaves Report';
          break;
        default:
          alert('Please select a valid report type.');
          return;
      }

      if (data.length === 0) {
        alert('No data available for the selected report.');
        return;
      }

      if (type === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToPDF(data, title, filename);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  const getFilteredData = () => {
    let data = reportData.participationRecords;
    
    if (selectedClass) {
      data = data.filter(record => record.student?.class === selectedClass);
    }
    
    return data;
  };

  // Helper functions for report generation
  const applyFilters = (config: ReportConfig) => {
    let filteredData = { ...reportData };

    // Apply date range filters
    if (config.dateRange.from) {
      const fromDate = new Date(config.dateRange.from);
      filteredData.participationRecords = filteredData.participationRecords.filter(record => 
        new Date(record.date) >= fromDate
      );
      filteredData.alerts = filteredData.alerts.filter(alert => 
        new Date(alert.created_at) >= fromDate
      );
      filteredData.leaves = filteredData.leaves.filter(leave => 
        new Date(leave.date) >= fromDate
      );
    }

    if (config.dateRange.to) {
      const toDate = new Date(config.dateRange.to);
      filteredData.participationRecords = filteredData.participationRecords.filter(record => 
        new Date(record.date) <= toDate
      );
      filteredData.alerts = filteredData.alerts.filter(alert => 
        new Date(alert.created_at) <= toDate
      );
      filteredData.leaves = filteredData.leaves.filter(leave => 
        new Date(leave.date) <= toDate
      );
    }

    // Apply other filters based on config.filters
    if (config.filters.class) {
      filteredData.students = filteredData.students.filter(student => 
        student.class === config.filters.class
      );
      filteredData.participationRecords = filteredData.participationRecords.filter(record => 
        record.student?.class === config.filters.class
      );
    }

    if (config.filters.grade) {
      filteredData.participationRecords = filteredData.participationRecords.filter(record => 
        record.grade === config.filters.grade
      );
    }

    if (config.filters.alertStatus) {
      filteredData.alerts = filteredData.alerts.filter(alert => 
        alert.status === config.filters.alertStatus
      );
    }

    return filteredData;
  };

  const prepareStudentReport = (data: any, config: ReportConfig) => {
    return data.students.map((student: any) => {
      const studentRecords = data.participationRecords.filter((r: any) => r.student_id === student.id);
      const studentAlerts = data.alerts.filter((a: any) => a.student_id === student.id);
      const studentLeaves = data.leaves.filter((l: any) => l.student_id === student.id);
      
      const gradeDistribution = {
        A: studentRecords.filter((r: any) => r.grade === 'A').length,
        B: studentRecords.filter((r: any) => r.grade === 'B').length,
        C: studentRecords.filter((r: any) => r.grade === 'C').length,
        D: studentRecords.filter((r: any) => r.grade === 'D').length,
      };
      
      const totalPoints = gradeDistribution.A * 4 + gradeDistribution.B * 3 + gradeDistribution.C * 2 + gradeDistribution.D * 1;
      const averageGrade = studentRecords.length > 0 ? (totalPoints / studentRecords.length).toFixed(2) : '0.00';
      
      return {
        'Student Name': student.user?.name || 'N/A',
        'Class': student.class,
        'Total Records': studentRecords.length,
        'Grade A': gradeDistribution.A,
        'Grade B': gradeDistribution.B,
        'Grade C': gradeDistribution.C,
        'Grade D': gradeDistribution.D,
        'Average Grade': averageGrade,
        'Total Alerts': studentAlerts.length,
        'Total Leaves': studentLeaves.length,
        'Attendance Rate': studentRecords.length > 0 ? 
          (((gradeDistribution.A + gradeDistribution.B + gradeDistribution.C) / studentRecords.length) * 100).toFixed(1) + '%' : '0%'
      };
    });
  };

  const prepareTeacherReport = (data: any, config: ReportConfig) => {
    return data.teachers.map((teacher: any) => {
      const teacherRecords = data.participationRecords.filter((r: any) => r.teacher_id === teacher.id);
      const teacherAlerts = data.alerts.filter((a: any) => a.teacher_id === teacher.id);
      
      const uniqueStudents = Array.from(new Set(teacherRecords.map((r: any) => r.student_id)));
      const uniqueActivities = Array.from(new Set(teacherRecords.map((r: any) => r.activity_id)));
      
      return {
        'Teacher Name': teacher.user?.name || 'N/A',
        'Assigned Class': teacher.assigned_class,
        'Total Records Created': teacherRecords.length,
        'Students Assessed': uniqueStudents.length,
        'Activities Covered': uniqueActivities.length,
        'Alerts Created': teacherAlerts.length,
        'Average Records Per Day': teacherRecords.length > 0 ? 
          (teacherRecords.length / Math.max(1, Math.ceil((new Date().getTime() - new Date(config.dateRange.from || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1) : '0'
      };
    });
  };

  const prepareClassReport = (data: any, config: ReportConfig) => {
    const classSummary = {};
    
    data.students.forEach((student: any) => {
      if (!classSummary[student.class]) {
        classSummary[student.class] = {
          students: [],
          records: [],
          alerts: [],
          leaves: []
        };
      }
      
      classSummary[student.class].students.push(student);
      classSummary[student.class].records.push(...data.participationRecords.filter((r: any) => r.student_id === student.id));
      classSummary[student.class].alerts.push(...data.alerts.filter((a: any) => a.student_id === student.id));
      classSummary[student.class].leaves.push(...data.leaves.filter((l: any) => l.student_id === student.id));
    });
    
    return Object.entries(classSummary).map(([className, classData]: [string, any]) => {
      const totalRecords = classData.records.length;
      const gradeDistribution = {
        A: classData.records.filter((r: any) => r.grade === 'A').length,
        B: classData.records.filter((r: any) => r.grade === 'B').length,
        C: classData.records.filter((r: any) => r.grade === 'C').length,
        D: classData.records.filter((r: any) => r.grade === 'D').length,
      };
      
      const averageGrade = totalRecords > 0 ? 
        ((gradeDistribution.A * 4 + gradeDistribution.B * 3 + gradeDistribution.C * 2 + gradeDistribution.D * 1) / totalRecords).toFixed(2) : '0.00';
      
      return {
        'Class': className,
        'Total Students': classData.students.length,
        'Total Records': totalRecords,
        'Grade A': gradeDistribution.A,
        'Grade B': gradeDistribution.B,
        'Grade C': gradeDistribution.C,
        'Grade D': gradeDistribution.D,
        'Class Average': averageGrade,
        'Total Alerts': classData.alerts.length,
        'Total Leaves': classData.leaves.length,
        'Class Attendance Rate': totalRecords > 0 ? 
          (((gradeDistribution.A + gradeDistribution.B + gradeDistribution.C) / totalRecords) * 100).toFixed(1) + '%' : '0%'
      };
    });
  };

  const generateStudentInsights = (data: any): string[] => {
    const insights = [];
    const totalStudents = data.students.length;
    const totalRecords = data.participationRecords.length;
    
    if (totalStudents > 0) {
      const avgRecordsPerStudent = (totalRecords / totalStudents).toFixed(1);
      insights.push(`Average ${avgRecordsPerStudent} participation records per student`);
    }
    
    const gradeAs = data.participationRecords.filter((r: any) => r.grade === 'A').length;
    if (totalRecords > 0) {
      const excellentPerformance = ((gradeAs / totalRecords) * 100).toFixed(1);
      insights.push(`${excellentPerformance}% of records show excellent performance (Grade A)`);
    }
    
    const highAlertStudents = data.students.filter((s: any) => 
      data.alerts.filter((a: any) => a.student_id === s.id).length > 3
    ).length;
    
    if (highAlertStudents > 0) {
      insights.push(`${highAlertStudents} students require immediate attention (3+ alerts)`);
    }
    
    return insights;
  };

  const generateParticipationInsights = (data: any): string[] => {
    const insights = [];
    const totalRecords = data.participationRecords.length;
    
    if (totalRecords > 0) {
      const gradeDistribution = {
        A: data.participationRecords.filter((r: any) => r.grade === 'A').length,
        B: data.participationRecords.filter((r: any) => r.grade === 'B').length,
        C: data.participationRecords.filter((r: any) => r.grade === 'C').length,
        D: data.participationRecords.filter((r: any) => r.grade === 'D').length,
      };
      
      const strongPerformance = (((gradeDistribution.A + gradeDistribution.B) / totalRecords) * 100).toFixed(1);
      insights.push(`${strongPerformance}% of participations show strong performance (Grade A/B)`);
      
      if (gradeDistribution.D > 0) {
        const needsImprovement = ((gradeDistribution.D / totalRecords) * 100).toFixed(1);
        insights.push(`${needsImprovement}% of participations need immediate improvement (Grade D)`);
      }
    }
    
    const uniqueActivities = Array.from(new Set(data.participationRecords.map((r: any) => r.activity_id)));
    insights.push(`${uniqueActivities.length} different activities covered in this period`);
    
    return insights;
  };

  const generateAlertsInsights = (data: any): string[] => {
    const insights = [];
    const totalAlerts = data.alerts.length;
    
    if (totalAlerts > 0) {
      const openAlerts = data.alerts.filter((a: any) => a.status === 'open').length;
      const resolvedAlerts = data.alerts.filter((a: any) => a.status === 'resolved').length;
      
      insights.push(`${openAlerts} alerts are currently open and require attention`);
      
      if (resolvedAlerts > 0) {
        const resolutionRate = ((resolvedAlerts / totalAlerts) * 100).toFixed(1);
        insights.push(`${resolutionRate}% alert resolution rate`);
      }
      
      const urgentAlerts = data.alerts.filter((a: any) => a.priority === 'urgent').length;
      if (urgentAlerts > 0) {
        insights.push(`${urgentAlerts} urgent alerts require immediate action`);
      }
    } else {
      insights.push('No alerts found in the selected period - excellent!');
    }
    
    return insights;
  };

  const generateTeacherInsights = (data: any): string[] => {
    const insights = [];
    const totalTeachers = data.teachers.length;
    
    if (totalTeachers > 0) {
      const activeTeachers = data.teachers.filter((t: any) => 
        data.participationRecords.some((r: any) => r.teacher_id === t.id)
      ).length;
      
      insights.push(`${activeTeachers} out of ${totalTeachers} teachers actively recording participation`);
      
      const avgRecordsPerTeacher = data.teachers.map((t: any) => 
        data.participationRecords.filter((r: any) => r.teacher_id === t.id).length
      ).reduce((a: number, b: number) => a + b, 0) / totalTeachers;
      
      insights.push(`Average ${avgRecordsPerTeacher.toFixed(1)} records per teacher`);
    }
    
    return insights;
  };

  const generateClassInsights = (data: any): string[] => {
    const insights = [];
    const classes = Array.from(new Set(data.students.map((s: any) => s.class)));
    
    if (classes.length > 0) {
      insights.push(`Analysis covers ${classes.length} different classes`);
      
      // Find best performing class
      const classPerformance = classes.map(className => {
        const classRecords = data.participationRecords.filter((r: any) => r.student?.class === className);
        const gradeAs = classRecords.filter((r: any) => r.grade === 'A').length;
        const avgGrade = classRecords.length > 0 ? gradeAs / classRecords.length : 0;
        return { class: className, avgGrade, totalRecords: classRecords.length };
      }).sort((a, b) => b.avgGrade - a.avgGrade);
      
      if (classPerformance.length > 0 && classPerformance[0].totalRecords > 0) {
        insights.push(`${classPerformance[0].class} shows the highest performance rate`);
      }
    }
    
    return insights;
  };

  const prepareMonthlyParticipationReport = () => {
    try {
      // Group by month and class
      const monthlyData: { [key: string]: any } = {};
      
      reportData.participationRecords.forEach(record => {
        if (!record || !record.date) return;
        
        const month = format(new Date(record.date), 'yyyy-MM');
        const className = record.student?.class || 'Unknown';
        const key = `${month}-${className}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = {
            month,
            class: className,
            totalRecords: 0,
            gradeA: 0,
            gradeB: 0,
            gradeC: 0,
            gradeD: 0,
            uniqueStudents: new Set(),
            activities: new Set()
          };
        }
        
        monthlyData[key].totalRecords++;
        monthlyData[key][`grade${record.grade}`]++;
        if (record.student_id) monthlyData[key].uniqueStudents.add(record.student_id);
        if (record.activity_id) monthlyData[key].activities.add(record.activity_id);
      });
      
      return Object.values(monthlyData).map((data: any) => {
        const totalPoints = data.gradeA * 4 + data.gradeB * 3 + data.gradeC * 2 + data.gradeD * 1;
        const avgGrade = data.totalRecords > 0 ? (totalPoints / data.totalRecords).toFixed(2) : '0.00';
        const attendanceRate = data.totalRecords > 0 ? 
          (((data.gradeA + data.gradeB + data.gradeC) / data.totalRecords) * 100).toFixed(1) : '0';
        
        return {
          'Month': data.month,
          'Class': data.class,
          'Total Records': data.totalRecords,
          'Grade A': data.gradeA,
          'Grade B': data.gradeB,
          'Grade C': data.gradeC,
          'Grade D': data.gradeD,
          'Average Grade': avgGrade,
          'Students Participated': data.uniqueStudents.size,
          'Activities Covered': data.activities.size,
          'Attendance Rate (%)': attendanceRate
        };
      });
    } catch (error) {
      console.error('Error preparing monthly participation report:', error);
      return [];
    }
  };

  const prepareIndividualParticipationReport = (studentId: string) => {
    try {
      const student = reportData.students.find(s => s && s.id === studentId);
      if (!student) return [];
      
      const studentRecords = reportData.participationRecords.filter(r => r && r.student_id === studentId);
      
      return studentRecords.map(record => {
        if (!record) return null;
        
        const activity = reportData.activities.find(a => a && a.id === record.activity_id);
        const teacher = reportData.teachers.find(t => t && t.id === record.teacher_id);
        
        return {
          'Student Name': student.user?.name || 'Unknown',
          'Class': student.class || 'Unknown',
          'Date': record.date ? format(new Date(record.date), 'yyyy-MM-dd') : 'Unknown',
          'Activity Code': activity?.code || 'Unknown',
          'Activity Description': activity?.description || 'Unknown',
          'Grade': record.grade || 'N/A',
          'Teacher': teacher?.user?.name || 'Unknown',
          'Remarks': record.remarks || 'N/A'
        };
      }).filter(record => record !== null);
    } catch (error) {
      console.error('Error preparing individual participation report:', error);
      return [];
    }
  };

  const prepareMonthlyAlertsReport = () => {
    try {
      // Group by month and priority
      const monthlyData: { [key: string]: any } = {};
      
      reportData.alerts.forEach(alert => {
        if (!alert || !alert.created_at) return;
        
        const month = format(new Date(alert.created_at), 'yyyy-MM');
        const className = alert.student?.class || 'Unknown';
        const key = `${month}-${className}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = {
            month,
            class: className,
            totalAlerts: 0,
            urgent: 0,
            high: 0,
            medium: 0,
            low: 0,
            open: 0,
            reviewing: 0,
            resolved: 0,
            uniqueStudents: new Set(),
            teachers: new Set()
          };
        }
        
        monthlyData[key].totalAlerts++;
        if (alert.priority) monthlyData[key][alert.priority]++;
        if (alert.status) monthlyData[key][alert.status]++;
        if (alert.student_id) monthlyData[key].uniqueStudents.add(alert.student_id);
        if (alert.teacher_id) monthlyData[key].teachers.add(alert.teacher_id);
      });
      
      return Object.values(monthlyData).map((data: any) => {
        const resolutionRate = data.totalAlerts > 0 ? 
          ((data.resolved / data.totalAlerts) * 100).toFixed(1) : '0';
        
        return {
          'Month': data.month,
          'Class': data.class,
          'Total Alerts': data.totalAlerts,
          'Urgent': data.urgent,
          'High': data.high,
          'Medium': data.medium,
          'Low': data.low,
          'Open': data.open,
          'Reviewing': data.reviewing,
          'Resolved': data.resolved,
          'Students with Alerts': data.uniqueStudents.size,
          'Teachers Reporting': data.teachers.size,
          'Resolution Rate (%)': resolutionRate
        };
      });
    } catch (error) {
      console.error('Error preparing monthly alerts report:', error);
      return [];
    }
  };

  const prepareIndividualAlertsReport = (studentId: string) => {
    try {
      const student = reportData.students.find(s => s && s.id === studentId);
      if (!student) return [];
      
      const studentAlerts = reportData.alerts.filter(a => a && a.student_id === studentId);
      
      return studentAlerts.map(alert => {
        if (!alert) return null;
        
        const teacher = reportData.teachers.find(t => t && t.id === alert.teacher_id);
        
        return {
          'Student Name': student.user?.name || 'Unknown',
          'Class': student.class || 'Unknown',
          'Date Created': alert.created_at ? format(new Date(alert.created_at), 'yyyy-MM-dd HH:mm') : 'Unknown',
          'Priority': alert.priority ? alert.priority.toUpperCase() : 'N/A',
          'Status': alert.status ? alert.status.toUpperCase() : 'N/A',
          'Comment': alert.comment || 'N/A',
          'Teacher': teacher?.user?.name || 'Unknown',
          'Resolved Date': alert.resolved_at ? format(new Date(alert.resolved_at), 'yyyy-MM-dd HH:mm') : 'N/A'
        };
      }).filter(alert => alert !== null);
    } catch (error) {
      console.error('Error preparing individual alerts report:', error);
      return [];
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const calculateStats = () => {
    try {
      const filteredRecords = getFilteredData();
      const uniqueStudents = Array.from(new Set(filteredRecords.filter(r => r && r.student_id).map(r => r.student_id)));
      const uniqueActivities = Array.from(new Set(filteredRecords.filter(r => r && r.activity_id).map(r => r.activity_id)));
      
      const gradeDistribution = {
        A: filteredRecords.filter(r => r && r.grade === 'A').length,
        B: filteredRecords.filter(r => r && r.grade === 'B').length,
        C: filteredRecords.filter(r => r && r.grade === 'C').length,
        D: filteredRecords.filter(r => r && r.grade === 'D').length,
      };

      const attendanceRate = filteredRecords.length > 0 
        ? Math.round(((gradeDistribution.A + gradeDistribution.B + gradeDistribution.C) / filteredRecords.length) * 100)
        : 0;

      const averageGrade = filteredRecords.length > 0
        ? (gradeDistribution.A * 4 + gradeDistribution.B * 3 + gradeDistribution.C * 2 + gradeDistribution.D * 1) / filteredRecords.length
        : 0;

      return {
        totalRecords: filteredRecords.length,
        uniqueStudents: uniqueStudents.length,
        uniqueActivities: uniqueActivities.length,
        gradeDistribution,
        attendanceRate,
        averageGrade: averageGrade.toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalRecords: 0,
        uniqueStudents: 0,
        uniqueActivities: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0 },
        attendanceRate: 0,
        averageGrade: '0.00'
      };
    }
  };

  const uniqueClasses = Array.from(new Set(reportData.students.filter(s => s && s.class).map(s => s.class))).sort();
  const stats = calculateStats();

  // Initialize expanded sections on first load
  React.useEffect(() => {
    setExpandedSections({
      templates: true,
      savedConfigs: true,
      recentReports: false,
      quickExport: false
    });
  }, []);

  if (!isAdmin) {
    return (
      <RouteGuard>
        <Layout>
          <div className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">Only administrators can access reports.</p>
            </div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  if (loading) {
    return (
      <RouteGuard>
        <Layout>
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <Layout>
        <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports and analyze student data</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleGenerateReport('csv')}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleGenerateReport('pdf')}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setSelectedStudent(''); // Reset student selection when changing type
              }}
              className="form-select"
            >
              <option value="participation">Participation Records</option>
              <option value="alerts">Student Alerts</option>
              <option value="leaves">Leave Records</option>
            </select>
          </div>
          
          {(reportType === 'participation' || reportType === 'alerts') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Format</label>
              <select
                value={reportSubType}
                onChange={(e) => {
                  setReportSubType(e.target.value);
                  setSelectedStudent(''); // Reset student selection when changing format
                }}
                className="form-select"
              >
                <option value="monthly">Monthly Summary</option>
                <option value="individual">Individual Student</option>
              </select>
            </div>
          )}
          
          {reportSubType === 'individual' && (reportType === 'participation' || reportType === 'alerts') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="form-select"
              >
                <option value="">Choose a student</option>
                {reportData.students
                  .filter(student => student && student.id && (!selectedClass || student.class === selectedClass))
                  .map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.user?.name || 'Unknown Student'} ({student.class || 'Unknown Class'})
                    </option>
                  ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select"
            >
              <option value="day">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Filter</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-select"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
            </div>
            <FileText className="h-8 w-8 text-islamic-emerald" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageGrade}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution Analysis</h2>
        <div className="space-y-4">
          {Object.entries(stats.gradeDistribution).map(([grade, count]) => {
            const percentage = stats.totalRecords > 0 ? Math.round((count / stats.totalRecords) * 100) : 0;
            const getGradeColor = (g: string) => {
              switch (g) {
                case 'A': return 'bg-green-500';
                case 'B': return 'bg-blue-500';
                case 'C': return 'bg-yellow-500';
                case 'D': return 'bg-red-500';
                default: return 'bg-gray-500';
              }
            };
            
            return (
              <div key={grade} className="flex items-center space-x-3">
                <div className="w-16">
                  <span className="text-sm font-medium text-gray-700">Grade {grade}</span>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${getGradeColor(grade)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Coverage</h2>
          <div className="space-y-3">
            {reportData.activities
              .filter(activity => activity && activity.id)
              .slice(0, 5)
              .map((activity) => {
                const activityRecords = reportData.participationRecords.filter(r => r && r.activity_id === activity.id);
                const coverage = reportData.students.length > 0 
                  ? Math.round((activityRecords.length / reportData.students.length) * 100)
                  : 0;
                
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.code || 'Unknown Activity'}</p>
                      <p className="text-xs text-gray-500">
                        {activity.description ? activity.description.split(' - ')[0] : 'No Description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{activityRecords.length} records</p>
                      <p className="text-xs text-gray-500">{coverage}% coverage</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Open Alerts</span>
              </div>
              <span className="text-sm font-bold text-red-600">
                {reportData.alerts.filter(a => a.status === 'open').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Under Review</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">
                {reportData.alerts.filter(a => a.status === 'reviewing').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Resolved</span>
              </div>
              <span className="text-sm font-bold text-green-600">
                {reportData.alerts.filter(a => a.status === 'resolved').length}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Leave Requests</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {reportData.leaves.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Export Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Monthly Participation</h3>
            <p className="text-sm text-gray-600 mb-3">
              Monthly summary of participation by class and grades.
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => { 
                  setReportType('participation'); 
                  setReportSubType('monthly'); 
                  handleGenerateReport('csv'); 
                }}
                className="btn-secondary text-xs"
              >
                CSV
              </button>
              <button 
                onClick={() => { 
                  setReportType('participation'); 
                  setReportSubType('monthly'); 
                  handleGenerateReport('pdf'); 
                }}
                className="btn-secondary text-xs"
              >
                PDF
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Individual Participation</h3>
            <p className="text-sm text-gray-600 mb-3">
              Detailed records for a specific student.
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => { 
                  setReportType('participation'); 
                  setReportSubType('individual'); 
                }}
                className="btn-secondary text-xs"
                disabled={!selectedStudent}
              >
                {selectedStudent ? 'Generate' : 'Select Student'}
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Monthly Alerts</h3>
            <p className="text-sm text-gray-600 mb-3">
              Monthly summary of alerts by priority and status.
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => { 
                  setReportType('alerts'); 
                  setReportSubType('monthly'); 
                  handleGenerateReport('csv'); 
                }}
                className="btn-secondary text-xs"
              >
                CSV
              </button>
              <button 
                onClick={() => { 
                  setReportType('alerts'); 
                  setReportSubType('monthly'); 
                  handleGenerateReport('pdf'); 
                }}
                className="btn-secondary text-xs"
              >
                PDF
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Individual Alerts</h3>
            <p className="text-sm text-gray-600 mb-3">
              All alerts for a specific student with details.
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => { 
                  setReportType('alerts'); 
                  setReportSubType('individual'); 
                }}
                className="btn-secondary text-xs"
                disabled={!selectedStudent}
              >
                {selectedStudent ? 'Generate' : 'Select Student'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Current Report Settings</h3>
          </div>
          <div className="text-sm text-blue-800">
            <span className="font-medium">Type:</span> {reportType === 'participation' ? 'Participation Records' : reportType === 'alerts' ? 'Student Alerts' : 'Leave Records'} |{' '}
            {(reportType === 'participation' || reportType === 'alerts') && (
              <>
                <span className="font-medium">Format:</span> {reportSubType === 'monthly' ? 'Monthly Summary' : 'Individual Student'} |{' '}
              </>
            )}
            <span className="font-medium">Period:</span> {selectedPeriod === 'day' ? 'Today' : selectedPeriod === 'week' ? 'Last Week' : selectedPeriod === 'month' ? 'Last Month' : selectedPeriod === 'quarter' ? 'Last Quarter' : 'Last Year'} |{' '}
            <span className="font-medium">Class:</span> {selectedClass || 'All Classes'}
            {selectedStudent && reportSubType === 'individual' && (
              <> | <span className="font-medium">Student:</span> {reportData.students.find(s => s && s.id === selectedStudent)?.user?.name || 'Unknown'}</>
            )}
          </div>
        </div>
      </div>
        </div>
      </Layout>
    </RouteGuard>
  );
}

export default function ReportsPage() {
  return (
    <ErrorBoundary>
      <ReportsPageContent />
    </ErrorBoundary>
  );
}