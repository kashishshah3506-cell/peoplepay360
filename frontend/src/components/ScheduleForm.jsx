import { useState, useEffect } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleForm = ({ initialData, onSubmit, onCancel, submitLabel }) => {
  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState('Fixed');
  const [companyName, setCompanyName] = useState('My Company');
  const [lines, setLines] = useState([
    { day_of_week: 'Monday', start_time: '09:00', end_time: '18:00', break_minutes: 60 },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setScheduleType(initialData.schedule_type || 'Fixed');
      setCompanyName(initialData.company_name || 'My Company');
      if (initialData.lines && initialData.lines.length > 0) {
        setLines(initialData.lines.map((l) => ({
          day_of_week: l.day_of_week,
          start_time: l.start_time?.slice(0, 5) || '09:00',
          end_time: l.end_time?.slice(0, 5) || '18:00',
          break_minutes: l.break_minutes || 0,
        })));
      }
    }
  }, [initialData]);

  const addLine = () => {
    setLines([...lines, { day_of_week: 'Monday', start_time: '09:00', end_time: '18:00', break_minutes: 0 }]);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ name, schedule_type: scheduleType, company_name: companyName, lines });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-2 rounded border border-red-200">{error}</div>
      )}

      <div>
        <label className={labelClass}>Schedule Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={`${inputClass} w-full`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Type</label>
          <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className={`${inputClass} w-full`}>
            <option value="Fixed">Fixed</option>
            <option value="Flexible">Flexible</option>
            <option value="Shift">Shift</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={`${inputClass} w-full`} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Weekly Pattern</label>
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={line.day_of_week}
                onChange={(e) => updateLine(index, 'day_of_week', e.target.value)}
                className={`${inputClass} flex-1`}
              >
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                type="time"
                value={line.start_time}
                onChange={(e) => updateLine(index, 'start_time', e.target.value)}
                className={inputClass}
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="time"
                value={line.end_time}
                onChange={(e) => updateLine(index, 'end_time', e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                value={line.break_minutes}
                onChange={(e) => updateLine(index, 'break_minutes', parseInt(e.target.value) || 0)}
                placeholder="Break (min)"
                className={`${inputClass} w-24`}
              />
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="text-red-500 hover:text-red-700 text-sm px-1"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="text-sm text-slate-600 hover:text-slate-900 mt-2 font-medium"
        >
          + Add Day
        </button>
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

export default ScheduleForm;