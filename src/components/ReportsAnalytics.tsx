import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, FileText, BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ReportsAnalyticsProps {
  userRole: 'resident' | 'panchayat_officer' | 'maintenance_technician' | 'water_flow_controller';
  userId?: string;
}

interface AnalyticsData {
  totalComplaints: number;
  pendingComplaints: number;
  completedComplaints: number;
  approvedComplaints: number;
  rejectedComplaints: number;
  averageResolutionTime: number;
  complaintsByMonth: { month: string; count: number }[];
  complaintsByStatus: { status: string; count: number }[];
}

const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ userRole, userId }) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/analytics?startDate=${startDate}&endDate=${endDate}&role=${userRole}${userId ? `&userId=${userId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      if (!analytics) return;

      const roleTitle = {
        resident: 'Resident',
        panchayat_officer: 'Panchayat Officer',
        maintenance_technician: 'Maintenance Technician',
        water_flow_controller: 'Water Flow Controller'
      }[userRole];

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>BlueGrid Analytics Report</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                background: white;
                color: #1f2937;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #1e40af;
                padding-bottom: 20px;
              }
              .header h1 {
                color: #1e40af;
                font-size: 28px;
                margin-bottom: 10px;
              }
              .header p {
                color: #6b7280;
                font-size: 14px;
              }
              .date-range {
                background: #dbeafe;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 30px;
                text-align: center;
              }
              .date-range strong {
                color: #1e40af;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
              }
              .stat-card {
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
              }
              .stat-card h3 {
                color: #6b7280;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 10px;
              }
              .stat-card .value {
                color: #1e40af;
                font-size: 32px;
                font-weight: bold;
              }
              .section {
                margin-bottom: 30px;
              }
              .section h2 {
                color: #1f2937;
                font-size: 18px;
                margin-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
              }
              th {
                background: #f3f4f6;
                color: #1f2937;
                font-weight: 600;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>BlueGrid Analytics Report</h1>
              <p>${roleTitle} Dashboard</p>
            </div>

            <div class="date-range">
              <strong>Report Period:</strong> ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <h3>Total Complaints</h3>
                <div class="value">${analytics.totalComplaints}</div>
              </div>
              <div class="stat-card">
                <h3>Pending</h3>
                <div class="value">${analytics.pendingComplaints}</div>
              </div>
              <div class="stat-card">
                <h3>Completed</h3>
                <div class="value">${analytics.completedComplaints}</div>
              </div>
              <div class="stat-card">
                <h3>Approved</h3>
                <div class="value">${analytics.approvedComplaints}</div>
              </div>
              <div class="stat-card">
                <h3>Rejected</h3>
                <div class="value">${analytics.rejectedComplaints}</div>
              </div>
              <div class="stat-card">
                <h3>Avg. Resolution Time</h3>
                <div class="value">${analytics.averageResolutionTime}h</div>
              </div>
            </div>

            <div class="section">
              <h2>Complaints by Status</h2>
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.complaintsByStatus.map(item => `
                    <tr>
                      <td style="text-transform: capitalize;">${item.status}</td>
                      <td>${item.count}</td>
                      <td>${((item.count / analytics.totalComplaints) * 100).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Monthly Trend</h2>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Complaints</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.complaintsByMonth.map(item => `
                    <tr>
                      <td>${item.month}</td>
                      <td>${item.count}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>BlueGrid Water Management System</p>
            </div>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BlueGrid_Report_${startDate}_to_${endDate}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report downloaded",
        description: "Open the HTML file and use your browser's 'Save as PDF' option",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Download failed",
        description: "Unable to generate report",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date Range
          </CardTitle>
          <CardDescription>Choose the period for your analytics report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={downloadPDF} 
                disabled={isDownloading || !analytics}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Generating...' : 'Download PDF Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="card-total-complaints">
              <div className="card-label">Total Complaints</div>
              <div className="card-number">{analytics.totalComplaints}</div>
            </div>

            <div className="card-pending">
              <div className="card-label">Pending</div>
              <div className="card-number">{analytics.pendingComplaints}</div>
            </div>

            <div className="card-completed">
              <div className="card-label">Completed</div>
              <div className="card-number">{analytics.completedComplaints}</div>
            </div>

            <div className="card-approved">
              <div className="card-label">Approved</div>
              <div className="card-number">{analytics.approvedComplaints}</div>
            </div>

            <div className="card-rejected">
              <div className="card-label">Rejected</div>
              <div className="card-number">{analytics.rejectedComplaints}</div>
            </div>

            <div className="card-avg-resolution">
              <div className="card-label">Avg. Resolution</div>
              <div className="card-number">{analytics.averageResolutionTime}h</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Complaints by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pie Chart SVG */}
                <div className="flex flex-col items-center mb-6">
                  <svg width="240" height="240" viewBox="0 0 240 240" className="mb-4">
                    {(() => {
                      const colors = ['#3b82f6', '#f97316', '#10b981', '#059669', '#ef4444'];
                      let currentAngle = 0;
                      const radius = 100;
                      const centerX = 120;
                      const centerY = 120;

                      return analytics.complaintsByStatus.map((item, index) => {
                        const percentage = (item.count / analytics.totalComplaints) * 100;
                        const angle = (percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        
                        // Convert angles to radians
                        const startRad = (startAngle - 90) * (Math.PI / 180);
                        const endRad = (endAngle - 90) * (Math.PI / 180);
                        
                        // Calculate arc path
                        const x1 = centerX + radius * Math.cos(startRad);
                        const y1 = centerY + radius * Math.sin(startRad);
                        const x2 = centerX + radius * Math.cos(endRad);
                        const y2 = centerY + radius * Math.sin(endRad);
                        
                        const largeArc = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M ${centerX} ${centerY}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');
                        
                        currentAngle = endAngle;
                        
                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={colors[index % colors.length]}
                            stroke="white"
                            strokeWidth="2"
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <title>{item.status}: {item.count} ({percentage.toFixed(1)}%)</title>
                          </path>
                        );
                      });
                    })()}
                    {/* Center circle for donut effect */}
                    <circle cx="120" cy="120" r="60" fill="white" />
                    <text x="120" y="115" textAnchor="middle" className="text-2xl font-bold fill-gray-800">
                      {analytics.totalComplaints}
                    </text>
                    <text x="120" y="135" textAnchor="middle" className="text-xs fill-gray-600">
                      Total
                    </text>
                  </svg>
                </div>

                {/* Legend with bars */}
                <div className="space-y-3">
                  {analytics.complaintsByStatus.map((item, index) => {
                    const percentage = ((item.count / analytics.totalComplaints) * 100).toFixed(1);
                    const colors = ['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-emerald-500', 'bg-red-500'];
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium capitalize flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></span>
                            {item.status}
                          </span>
                          <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${colors[index % colors.length]} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.complaintsByMonth.map((item, index) => {
                    const maxCount = Math.max(...analytics.complaintsByMonth.map(m => m.count));
                    const percentage = ((item.count / maxCount) * 100).toFixed(1);
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.month}</span>
                          <span className="text-muted-foreground">{item.count} complaints</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsAnalytics;
