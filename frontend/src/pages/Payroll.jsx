import { useState, useEffect } from 'react';
import {
  getPayruns, getPayrunById, computePayrun, validatePayrun, markPayrunPaid, sendAllPayslips,
} from '../api/payrollApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import PayrunWizard from '../components/PayrunWizard';
import PayslipDetail from '../components/PayslipDetail';

const Payroll = () => {
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const { user } = useAuth();

  const canManage = ['Admin', 'HR Payroll User', 'HR Payroll Manager'].includes(user?.role);

  const fetchPayruns = async () => {
    setLoading(true);
    try {
      const res = await getPayruns();
      setPayruns(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch payruns', err);
      setPayruns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, []);

  const openPayrun = async (id) => {
    try {
      const res = await getPayrunById(id);
      setSelectedPayrun(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load payrun');
    }
  };

  const handleWizardCreated = async (newPayrunId) => {
    setWizardOpen(false);
    await fetchPayruns();
    openPayrun(newPayrunId);
  };

  const refreshSelectedPayrun = async () => {
    if (selectedPayrun) await openPayrun(selectedPayrun.id);
    fetchPayruns();
  };

  const handleCompute = async () => {
    setProcessing(true);
    try {
      await computePayrun(selectedPayrun.id);
      await refreshSelectedPayrun();
    } catch (err) {
      alert(err.response?.data?.message || 'Compute failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleValidate = async () => {
    setProcessing(true);
    try {
      await validatePayrun(selectedPayrun.id);
      await refreshSelectedPayrun();
    } catch (err) {
      const data = err.response?.data;
      if (data?.payslips_with_warnings?.length) {
        alert(`Validation failed. Warnings on: ${data.payslips_with_warnings.map((p) => p.employee_name).join(', ')}`);
      } else {
        alert(data?.message || 'Validation failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!window.confirm('Mark this payrun as Paid? This is a final action.')) return;
    setProcessing(true);
    try {
      await markPayrunPaid(selectedPayrun.id);
      await refreshSelectedPayrun();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendPayslips = async () => {
    setProcessing(true);
    try {
      const res = await sendAllPayslips(selectedPayrun.id);
      const failed = res.data.results.filter((r) => r.status === 'failed');
      alert(failed.length ? `Sent with ${failed.length} failure(s)` : 'All payslips sent successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send payslips');
    } finally {
      setProcessing(false);
    }
  };

  const statusColor = (status) => {
    if (status === 'Paid') return 'bg-green-100 text-green-700';
    if (status === 'Validated') return 'bg-blue-100 text-blue-700';
    if (status === 'Computed') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  // ===== Payrun Processing Screen =====
  if (selectedPayrun) {
    const payslips = Array.isArray(selectedPayrun.payslips) ? selectedPayrun.payslips : [];

    return (
      <div>
        <button onClick={() => setSelectedPayrun(null)} className="text-sm text-slate-500 hover:text-slate-800 mb-4">
          &larr; Back to Payruns
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{selectedPayrun.name}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {selectedPayrun.structure_name} · {new Date(selectedPayrun.period_start).toLocaleDateString()} - {new Date(selectedPayrun.period_end).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(selectedPayrun.status)}`}>
              {selectedPayrun.status}
            </span>
          </div>

          {canManage && (
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={handleCompute}
                disabled={processing || selectedPayrun.status === 'Paid'}
                className="px-4 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Compute
              </button>
              <button
                onClick={handleValidate}
                disabled={processing || !['Computed'].includes(selectedPayrun.status)}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Validate
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={processing || selectedPayrun.status !== 'Validated'}
                className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Mark Paid
              </button>
              <button
                onClick={handleSendPayslips}
                disabled={processing || !['Validated', 'Paid'].includes(selectedPayrun.status)}
                className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Send Payslips
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {payslips.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No payslips in this payrun.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Worked Days</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Gross</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Deductions</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Net</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPayslipId(p.id)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{p.employee_name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.worked_days ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">₹{parseFloat(p.gross_salary || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">₹{parseFloat(p.total_deductions || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">₹{parseFloat(p.net_salary || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                        {p.has_warning && <span className="text-amber-500 text-xs" title={p.warning_message}>&#9888;</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={!!selectedPayslipId} onClose={() => setSelectedPayslipId(null)} title="Payslip">
          {selectedPayslipId && (
            <PayslipDetail payslipId={selectedPayslipId} onClose={() => setSelectedPayslipId(null)} />
          )}
        </Modal>
      </div>
    );
  }

  // ===== Payrun List Screen =====
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">Manage pay runs and payslips</p>
        </div>
        {canManage && (
          <button onClick={() => setWizardOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium">
            + New Pay Run
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading payruns...</div>
        ) : payruns.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No pay runs found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Structure</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Period</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Payslips</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {payruns.map((p) => (
                <tr key={p.id} onClick={() => openPayrun(p.id)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.structure_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(p.period_start).toLocaleDateString()} - {new Date(p.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.payslip_count}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} title="New Pay Run">
        <PayrunWizard onCreated={handleWizardCreated} onCancel={() => setWizardOpen(false)} />
      </Modal>
    </div>
  );
};

export default Payroll;