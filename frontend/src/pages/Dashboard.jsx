import { useState, useEffect } from 'react';
import { getDashboardSummary, getAttendanceOverview, getTimeOffOverview, getAlerts } from '../api/dashboardApi';
import KpiCard from '../components/KpiCard';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0f172a', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [timeOff, setTimeOff] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [summaryRes, attRes, toRes, alertsRes] = await Promise.all([
          getDashboardSummary(),
          getAttendanceOverview(),
          getTimeOffOverview(),
          getAlerts(),
        ]);
        setSummary(summaryRes.data || null);
        setAttendance(attRes.data || null);
        setTimeOff(toRes.data || null);
        setAlerts(alertsRes.data || null);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setLoadError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  if (loadError) {
    return (
      <div className="bg-red-50 text-red-600 text-sm p-4 rounded border border-red-200">
        {loadError}
      </div>
    );
  }

  const kpis = summary?.kpis || {};
  const salaryByDept = Array.isArray(summary?.salary_by_department) ? summary.salary_by_department : [];
  const monthlyTrend = Array.isArray(summary?.monthly_trend) ? summary.monthly_trend : [];
  const statusBreakdown = Array.isArray(summary?.payslip_status_breakdown)
    ? summary.payslip_status_breakdown.map((s) => ({ name: s.status, value: parseInt(s.count) }))
    : [];
  const deptHeadcount = Array.isArray(summary?.department_headcount) ? summary.department_headcount : [];

  const attendancePie = attendance
    ? [
        { name: 'Present', value: attendance.present || 0 },
        { name: 'Overtime', value: attendance.overtime || 0 },
        { name: 'Late', value: attendance.late || 0 },
        { name: 'Absent', value: attendance.absent || 0 },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payroll Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Integrated payroll and HR insights across your organization</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Net Salary Paid" value={`₹${parseFloat(kpis.total_net_salary_paid || 0).toLocaleString()}`} />
        <KpiCard label="Payslips Generated" value={kpis.payslips_generated || 0} />
        <KpiCard label="Average Salary" value={`₹${parseFloat(kpis.average_salary || 0).toLocaleString()}`} />
        <KpiCard
          label="Attendance Health"
          value={`${kpis.attendance_health_percent || 0}%`}
          accent={parseFloat(kpis.attendance_health_percent) >= 90 ? 'text-green-600' : 'text-amber-600'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Salary by Department - Bar Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Salary Cost by Department</h2>
          {salaryByDept.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-16">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salaryByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="total_salary" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Trend - Line Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Monthly Net Salary Trend</h2>
          {monthlyTrend.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-16">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="total_salary" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Payslip Status - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Payslip Status</h2>
          {statusBreakdown.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-16">No payslips yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Overview - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Attendance Breakdown</h2>
          {attendancePie.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-16">No attendance data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {attendancePie.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {attendance && (
            <div className="text-center text-sm text-slate-500 mt-2">
              Coverage: <span className="font-semibold text-slate-800">{attendance.coverage_percent}%</span>
            </div>
          )}
        </div>

        {/* Time Off Overview */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Time Off Overview</h2>
          {timeOff ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Approved Requests</span><span className="font-semibold">{timeOff.requests?.approved || 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Pending Requests</span><span className="font-semibold">{timeOff.requests?.pending || 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Refused Requests</span><span className="font-semibold">{timeOff.requests?.refused || 0}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                <span className="text-slate-600">Total Balance Remaining</span>
                <span className="font-bold text-slate-900">{timeOff.balances?.total_remaining || 0} days</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center py-16">No time off data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Headcount - Bar Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Department Headcount</h2>
          {deptHeadcount.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-16">No department data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptHeadcount} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="headcount" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Payroll Alerts</h2>
          {alerts ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Duplicate Payslips</span>
                <span className={`font-semibold ${alerts.alerts?.duplicate_payslips > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {alerts.alerts?.duplicate_payslips || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payslips with Warnings</span>
                <span className={`font-semibold ${alerts.alerts?.payslips_with_warnings?.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {alerts.alerts?.payslips_with_warnings?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Missing Contracts</span>
                <span className={`font-semibold ${alerts.alerts?.missing_contracts?.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {alerts.alerts?.missing_contracts?.length || 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center py-16">No alert data</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;