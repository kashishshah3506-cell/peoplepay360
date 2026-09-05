import { useState, useEffect } from 'react';
import { getDashboardSummary, getAttendanceOverview, getTimeOffOverview, getAlerts } from '../api/dashboardApi';
import KpiCard from '../components/KpiCard';
import SimpleBarChart from '../components/SimpleBarChart';

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
  const statusBreakdown = Array.isArray(summary?.payslip_status_breakdown) ? summary.payslip_status_breakdown : [];
  const deptHeadcount = Array.isArray(summary?.department_headcount) ? summary.department_headcount : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payroll Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Integrated payroll and HR insights across your organization</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Net Salary Paid"
          value={`₹${parseFloat(kpis.total_net_salary_paid || 0).toLocaleString()}`}
        />
        <KpiCard
          label="Payslips Generated"
          value={kpis.payslips_generated || 0}
        />
        <KpiCard
          label="Average Salary"
          value={`₹${parseFloat(kpis.average_salary || 0).toLocaleString()}`}
        />
        <KpiCard
          label="Attendance Health"
          value={`${kpis.attendance_health_percent || 0}%`}
          accent={parseFloat(kpis.attendance_health_percent) >= 90 ? 'text-green-600' : 'text-amber-600'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Salary by Department */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Salary Cost by Department</h2>
          <SimpleBarChart data={salaryByDept} labelKey="department" valueKey="total_salary" />
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Monthly Net Salary Trend</h2>
          <SimpleBarChart data={monthlyTrend} labelKey="month" valueKey="total_salary" color="bg-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Payslip Status */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Payslip Status</h2>
          {statusBreakdown.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-4">No payslips yet</div>
          ) : (
            <div className="space-y-2">
              {statusBreakdown.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600">{s.status}</span>
                  <span className="font-semibold text-slate-800">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Overview */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Attendance Overview</h2>
          {attendance ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Present</span><span className="font-semibold">{attendance.present}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Overtime</span><span className="font-semibold">{attendance.overtime}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Late</span><span className="font-semibold">{attendance.late}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Absent</span><span className="font-semibold">{attendance.absent}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Missing Checkouts</span><span className="font-semibold">{attendance.missing_checkouts}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                <span className="text-slate-600">Coverage</span>
                <span className="font-bold text-slate-900">{attendance.coverage_percent}%</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center py-4">No attendance data</div>
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
            <div className="text-sm text-slate-400 text-center py-4">No time off data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Headcount */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Department Overview</h2>
          {deptHeadcount.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-4">No department data</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium text-right">Headcount</th>
                </tr>
              </thead>
              <tbody>
                {deptHeadcount.map((d, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 text-slate-700">{d.department}</td>
                    <td className="py-2 text-right font-medium text-slate-800">{d.headcount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <div className="text-sm text-slate-400 text-center py-4">No alert data</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;