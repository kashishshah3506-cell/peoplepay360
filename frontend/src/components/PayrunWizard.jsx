import { useState, useEffect } from 'react';
import { getSalaryStructures } from '../api/contractApi';
import { getEligibleEmployees, createPayrun } from '../api/payrollApi';

const PayrunWizard = ({ onCreated, onCancel }) => {
  const [step, setStep] = useState(1);
  const [structures, setStructures] = useState([]);
  const [name, setName] = useState('');
  const [structureId, setStructureId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const [eligible, setEligible] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStructures = async () => {
      try {
        const res = await getSalaryStructures();
        setStructures(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load salary structures', err);
      }
    };
    loadStructures();
  }, []);

  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !structureId || !periodStart || !periodEnd) {
      setError('All scope fields are required');
      return;
    }
    setLoadingEligible(true);
    try {
      const res = await getEligibleEmployees(periodStart, periodEnd);
      const list = Array.isArray(res.data) ? res.data : [];
      setEligible(list);
      setSelectedIds(list.map((e) => e.employee_id)); // pre-select all eligible
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch eligible employees');
    } finally {
      setLoadingEligible(false);
    }
  };

  const toggleEmployee = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one employee');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await createPayrun({
        name,
        salary_structure_id: structureId,
        period_start: periodStart,
        period_end: periodEnd,
        employee_ids: selectedIds,
      });
      onCreated(res.data.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payrun');
    } finally {
      setCreating(false);
    }
  };

  const inputClass = 'w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-xs font-medium">
        <span className={`px-2 py-1 rounded ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>1. Scope</span>
        <span className="text-slate-300">&rarr;</span>
        <span className={`px-2 py-1 rounded ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>2. Employees</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-2 rounded border border-red-200 mb-4">{error}</div>
      )}

      {step === 1 && (
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className={labelClass}>Pay Run Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. September 2026" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Salary Structure *</label>
            <select value={structureId} onChange={(e) => setStructureId(e.target.value)} required className={inputClass}>
              <option value="">Select...</option>
              {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Period Start *</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Period End *</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loadingEligible} className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
              {loadingEligible ? 'Loading...' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            {eligible.length} eligible employee{eligible.length !== 1 ? 's' : ''} found for this period. Select who to include.
          </p>

          {eligible.length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-sm">No eligible employees with active contracts for this period.</div>
          ) : (
            <div className="border border-slate-200 rounded max-h-64 overflow-y-auto mb-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === eligible.length}
                        onChange={(e) =>
                          setSelectedIds(e.target.checked ? eligible.map((emp) => emp.employee_id) : [])
                        }
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Employee</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Wage</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Contract Start</th>
                  </tr>
                </thead>
                <tbody>
                  {eligible.map((emp) => (
                    <tr key={emp.employee_id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(emp.employee_id)}
                          onChange={() => toggleEmployee(emp.employee_id)}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">{emp.name}</td>
                      <td className="px-3 py-2 text-slate-600">₹{parseFloat(emp.wage).toLocaleString()}</td>
                      <td className="px-3 py-2 text-slate-600">{new Date(emp.start_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || selectedIds.length === 0}
              className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Payrun'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrunWizard;