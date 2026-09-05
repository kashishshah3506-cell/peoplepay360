import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAttendance, checkIn, checkOut, updateAttendance } from '../api/attendanceApi';
import { getEmployees } from '../api/employeeApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employee_id');

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(employeeIdFilter || '');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();

  const canEdit = ['Admin', 'HR Manager'].includes(user?.role);

  const fetchRecords = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await getAttendance(employeeIdFilter);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
      setLoadError(err.response?.data?.message || 'Failed to load attendance records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch employees', err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFilter]);

  const handleCheckIn = async () => {
    if (!selectedEmployee) return alert('Select an employee first');
    setActionLoading(true);
    try {
      await checkIn(selectedEmployee);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee) return alert('Select an employee first');
    setActionLoading(true);
    try {
      await checkOut(selectedEmployee);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    const form = e.target;
    const check_in = form.check_in.value;
    const check_out = form.check_out.value;
    const status = form.status.value;
    try {
      await updateAttendance(editingRecord.id, { check_in, check_out, status });
      setModalOpen(false);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  const statusColor = (status) => {
    if (status === 'Present') return 'bg-green-100 text-green-700';
    if (status === 'Overtime') return 'bg-blue-100 text-blue-700';
    if (status === 'Late') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const toLocalInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            {employeeIdFilter ? 'Filtered by employee' : 'All attendance records'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-3 flex-wrap">
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 text-sm flex-1 max-w-xs"
        >
          <option value="">Select employee for check-in/out...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
        <button
          onClick={handleCheckIn}
          disabled={actionLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          Check In
        </button>
        <button
          onClick={handleCheckOut}
          disabled={actionLoading}
          className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          Check Out
        </button>
      </div>

      {loadError && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded border border-red-200 mb-4">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading attendance...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No attendance records found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Check In</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Check Out</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Worked Hours</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                {canEdit && <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.employee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.check_in ? new Date(r.check_in).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.check_out ? new Date(r.check_out).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.worked_hours ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                    {r.is_manual_edit && <span className="ml-1 text-xs text-slate-400">(edited)</span>}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEditModal(r)} className="text-slate-600 hover:text-slate-900 text-xs font-medium">
                        Correct
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Manual Correction">
        {editingRecord && (
          <form onSubmit={handleManualSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
              <input
                type="datetime-local"
                name="check_in"
                defaultValue={toLocalInput(editingRecord.check_in)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Check Out</label>
              <input
                type="datetime-local"
                name="check_out"
                defaultValue={toLocalInput(editingRecord.check_out)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" defaultValue={editingRecord.status} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                <option value="Present">Present</option>
                <option value="Overtime">Overtime</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800">
                Save Correction
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Attendance;