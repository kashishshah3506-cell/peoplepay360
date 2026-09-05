import { useState, useEffect } from 'react';
import { getDepartments, getJobPositions } from '../api/employeeApi';
import { getSalaryStructures } from '../api/contractApi';
import { getEmployees } from '../api/employeeApi';

const ContractForm = ({ initialData, defaultEmployeeId, onSubmit, onCancel, submitLabel }) => {
  const [form, setForm] = useState({
    employee_id: defaultEmployeeId || '',
    department_id: '',
    job_position_id: '',
    salary_structure_id: '',
    wage: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'Running',
  });
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [structures, setStructures] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [empRes, deptRes, posRes, structRes] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getJobPositions(),
          getSalaryStructures(),
        ]);
        setEmployees(empRes.data);
        setDepartments(deptRes.data);
        setJobPositions(posRes.data);
        setStructures(structRes.data);
      } catch (err) {
        console.error('Failed to load dropdown options', err);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        employee_id: initialData.employee_id || '',
        department_id: initialData.department_id || '',
        job_position_id: initialData.job_position_id || '',
        salary_structure_id: initialData.salary_structure_id || '',
        wage: initialData.wage || '',
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
        status: initialData.status || 'Running',
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
        salary_structure_id: form.salary_structure_id || null,
        end_date: form.end_date || null,
        wage: parseFloat(form.wage),
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
        <label className={labelClass}>Employee *</label>
        <select
          name="employee_id"
          value={form.employee_id}
          onChange={handleChange}
          required
          disabled={!!defaultEmployeeId || !!initialData}
          className={inputClass}
        >
          <option value="">Select employee...</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
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

      <div>
        <label className={labelClass}>Salary Structure</label>
        <select name="salary_structure_id" value={form.salary_structure_id} onChange={handleChange} className={inputClass}>
          <option value="">Select...</option>
          {structures.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Wage (Monthly) *</label>
        <input type="number" step="0.01" name="wage" value={form.wage} onChange={handleChange} required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start Date *</label>
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={inputClass} />
          <p className="text-xs text-slate-400 mt-1">Leave blank if ongoing</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
          <option value="Running">Running</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ContractForm;