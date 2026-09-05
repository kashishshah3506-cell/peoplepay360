import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeById } from '../api/employeeApi';

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await getEmployeeById(id);
        setEmployee(res.data);
      } catch (err) {
        console.error('Failed to fetch employee', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!employee) return <div className="p-8 text-center text-slate-500">Employee not found.</div>;

  const smartLinks = [
    { label: 'Contracts', count: employee.counts?.contracts ?? 0, path: `/contracts?employee_id=${id}` },
    { label: 'Attendance', count: employee.counts?.attendance ?? 0, path: `/attendance?employee_id=${id}` },
    { label: 'Time Off', count: employee.counts?.time_off_requests ?? 0, path: `/time-off?employee_id=${id}` },
    { label: 'Allocations', count: employee.counts?.allocations ?? 0, path: `/time-off?tab=allocations&employee_id=${id}` },
  ];

  return (
    <div>
      <button onClick={() => navigate('/employees')} className="text-sm text-slate-500 hover:text-slate-800 mb-4">
        &larr; Back to Employees
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{employee.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{employee.email}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {employee.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <div className="text-slate-400">Department</div>
            <div className="font-medium text-slate-800">{employee.department_name || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400">Job Position</div>
            <div className="font-medium text-slate-800">{employee.job_position_title || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400">Manager</div>
            <div className="font-medium text-slate-800">{employee.manager_name || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400">Working Schedule</div>
            <div className="font-medium text-slate-800">{employee.schedule_name || '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {smartLinks.map((link) => (
          <Link
            key={link.label}
            to={link.path}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl font-bold text-slate-800">{link.count}</div>
            <div className="text-sm text-slate-500">{link.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDetail;