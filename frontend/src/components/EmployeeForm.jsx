import { useState, useEffect } from 'react';
import { getDepartments, getJobPositions, getSchedules } from '../api/employeeApi';

const EmployeeForm = ({ initialData, onSubmit, onCancel, submitLabel }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    job_position_id: '',
    working_schedule_id: '',
    status: 'Active',
    date_joined: new Date().toISOString().split('T')[0],
  });
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [deptRes, posRes, schedRes] = await Promise.all([
          getDepartments(),
          getJobPositions(),
          getSchedules(),
        ]);
        setDepartments(deptRes.data);
        setJobPositions(posRes.data);
        setSchedules(schedRes.data);
      } catch (err) {
        console.error('Failed to load dropdown options', err);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        department_id: initialData.department_id || '',
        job_position_id: initialData.job_position_id || '',
        working_schedule_id: initialData.working_schedule_id || '',
        status: initialData.status || 'Active',
        date_joined: initialData.date_joined
          ? new Date(initialData.date_joined).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        department_id: form.department_id || null,
        job_position_id: form.job_position_id || null,
        working_schedule_id: form.working_schedule_id || null,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Full Name *</label>
        <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Department</label>
          <select name="department_id" value={form.department_id} onChange={handleChange} className={inputClass}>
            <option value="">Select...</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Job Position</label>
          <select name="job_position_id" value={form.job_position_id} onChange={handleChange} className={inputClass}>
            <option value="">Select...</option>
            {jobPositions.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Working Schedule</label>
          <select name="working_schedule_id" value={form.working_schedule_id} onChange={handleChange} className={inputClass}>
            <option value="">Select...</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Date Joined</label>
        <input type="date" name="date_joined" value={form.date_joined} onChange={handleChange} className={inputClass} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;