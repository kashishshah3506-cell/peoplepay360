import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getTimeOffTypes, createTimeOffType,
  getAllocations, createAllocation, updateAllocationStatus,
  getTimeOffRequests, createTimeOffRequest, updateRequestStatus,
} from '../api/timeOffApi';
import { getEmployees } from '../api/employeeApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const TimeOff = () => {
  const [searchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employee_id');
  const initialTab = searchParams.get('tab') || 'requests';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);

  const { user } = useAuth();
  const canApprove = ['Admin', 'HR Manager'].includes(user?.role);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, allocRes, typeRes, empRes] = await Promise.all([
        getTimeOffRequests(employeeIdFilter),
        getAllocations(employeeIdFilter),
        getTimeOffTypes(),
        getEmployees(),
      ]);
      setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
      setAllocations(Array.isArray(allocRes.data) ? allocRes.data : []);
      setTypes(Array.isArray(typeRes.data) ? typeRes.data : []);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    } catch (err) {
      console.error('Failed to fetch time off data', err);
      setRequests([]);
      setAllocations([]);
      setTypes([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFilter]);

  const handleRequestApproval = async (id, status) => {
    try {
      await updateRequestStatus(id, status);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request');
    }
  };

  const handleAllocationApproval = async (id, status) => {
    try {
      await updateAllocationStatus(id, status);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update allocation');
    }
  };

  const statusColor = (status) => {
    if (status === 'Approved') return 'bg-green-100 text-green-700';
    if (status === 'Refused') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const tabs = [
    { key: 'requests', label: 'Requests' },
    { key: 'allocations', label: 'Allocations' },
    { key: 'types', label: 'Time Off Types' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Time Off</h1>
          <p className="text-sm text-slate-500 mt-1">
            {employeeIdFilter ? 'Filtered by employee' : 'All time off records'}
          </p>
        </div>
        <div className="space-x-2">
          {activeTab === 'requests' && (
            <button onClick={() => setRequestModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium">
              + New Request
            </button>
          )}
          {activeTab === 'allocations' && canApprove && (
            <button onClick={() => setAllocationModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium">
              + New Allocation
            </button>
          )}
          {activeTab === 'types' && canApprove && (
            <button onClick={() => setTypeModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium">
              + New Type
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeTab === 'requests' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">End</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  {canApprove && <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No requests found.</td></tr>
                ) : requests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.employee_name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.time_off_type_name}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(r.start_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(r.end_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{r.duration} {r.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                    {canApprove && (
                      <td className="px-4 py-3 text-right space-x-2">
                        {r.status === 'Pending' && (
                          <>
                            <button onClick={() => handleRequestApproval(r.id, 'Approved')} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                            <button onClick={() => handleRequestApproval(r.id, 'Refused')} className="text-red-600 hover:text-red-800 text-xs font-medium">Refuse</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'allocations' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Allocated</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Taken</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Remaining</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  {canApprove && <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {allocations.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No allocations found.</td></tr>
                ) : allocations.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.employee_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.time_off_type_name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.allocated_amount} {a.unit}</td>
                    <td className="px-4 py-3 text-slate-600">{a.taken_amount} {a.unit}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{a.remaining} {a.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>{a.status}</span>
                    </td>
                    {canApprove && (
                      <td className="px-4 py-3 text-right space-x-2">
                        {a.status === 'Pending' && (
                          <>
                            <button onClick={() => handleAllocationApproval(a.id, 'Approved')} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                            <button onClick={() => handleAllocationApproval(a.id, 'Refused')} className="text-red-600 hover:text-red-800 text-xs font-medium">Refuse</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'types' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Requires Allocation</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Requires Approval</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Affects Payroll</th>
                </tr>
              </thead>
              <tbody>
                {types.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No time off types found.</td></tr>
                ) : types.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                    <td className="px-4 py-3 text-slate-600">{t.unit}</td>
                    <td className="px-4 py-3 text-slate-600">{t.requires_allocation ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.requires_approval ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.affects_payroll ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* New Request Modal */}
      <Modal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} title="New Time Off Request">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.target;
            try {
              await createTimeOffRequest({
                employee_id: f.employee_id.value,
                time_off_type_id: f.time_off_type_id.value,
                start_date: f.start_date.value,
                end_date: f.end_date.value,
                duration: parseFloat(f.duration.value),
                reason: f.reason.value,
              });
              setRequestModalOpen(false);
              fetchAll();
            } catch (err) {
              alert(err.response?.data?.message || 'Failed to create request');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
            <select name="employee_id" defaultValue={employeeIdFilter || ''} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="">Select...</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time Off Type *</label>
            <select name="time_off_type_id" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="">Select...</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
              <input type="date" name="start_date" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
              <input type="date" name="end_date" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (days) *</label>
            <input type="number" step="0.5" name="duration" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <textarea name="reason" rows={2} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRequestModalOpen(false)} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800">Submit Request</button>
          </div>
        </form>
      </Modal>

      {/* New Allocation Modal */}
      <Modal isOpen={allocationModalOpen} onClose={() => setAllocationModalOpen(false)} title="New Allocation">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.target;
            try {
              await createAllocation({
                employee_id: f.employee_id.value,
                time_off_type_id: f.time_off_type_id.value,
                allocated_amount: parseFloat(f.allocated_amount.value),
                valid_from: f.valid_from.value,
                valid_to: f.valid_to.value,
              });
              setAllocationModalOpen(false);
              fetchAll();
            } catch (err) {
              alert(err.response?.data?.message || 'Failed to create allocation');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
            <select name="employee_id" defaultValue={employeeIdFilter || ''} required className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="">Select...</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time Off Type *</label>
            <select name="time_off_type_id" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="">Select...</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Allocated Amount *</label>
            <input type="number" step="0.5" name="allocated_amount" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
              <input type="date" name="valid_from" className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
              <input type="date" name="valid_to" className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAllocationModalOpen(false)} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800">Create Allocation</button>
          </div>
        </form>
      </Modal>

      {/* New Type Modal */}
      <Modal isOpen={typeModalOpen} onClose={() => setTypeModalOpen(false)} title="New Time Off Type">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.target;
            try {
              await createTimeOffType({
                name: f.name.value,
                unit: f.unit.value,
                requires_allocation: f.requires_allocation.checked,
                requires_approval: f.requires_approval.checked,
                affects_payroll: f.affects_payroll.checked,
              });
              setTypeModalOpen(false);
              fetchAll();
            } catch (err) {
              alert(err.response?.data?.message || 'Failed to create type');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input name="name" required className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
            <select name="unit" className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="Days">Days</option>
              <option value="Hours">Hours</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="requires_allocation" defaultChecked /> Requires Allocation
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="requires_approval" defaultChecked /> Requires Approval
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="affects_payroll" defaultChecked /> Affects Payroll
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setTypeModalOpen(false)} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800">Create Type</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimeOff;