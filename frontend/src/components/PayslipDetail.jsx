import { useState, useEffect } from 'react';
import { getPayslipById, emailPayslip } from '../api/payrollApi';
// Ensure you import your axiosClient if it's not imported yet, for example:
// import axiosClient from '../api/axiosClient'; 

const PayslipDetail = ({ payslipId, onClose }) => {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const [printing, setPrinting] = useState(false); // Added printing state

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getPayslipById(payslipId);
        setPayslip(res.data);
      } catch (err) {
        console.error('Failed to load payslip', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [payslipId]);

  const handleEmail = async () => {
    setEmailing(true);
    try {
      const res = await emailPayslip(payslipId);
      alert(res.data.previewUrl ? `Emailed! Preview: ${res.data.previewUrl}` : 'Payslip emailed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to email payslip');
    } finally {
      setEmailing(false);
    }
  };

  // Added dynamic print handler function
  const handlePrint = async () => {
    setPrinting(true);
    try {
      const response = await axiosClient.get(`/payslips/${payslipId}/print`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download payslip PDF');
      console.error(err);
    } finally {
      setPrinting(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading payslip...</div>;
  if (!payslip) return <div className="p-6 text-center text-slate-500">Payslip not found.</div>;

  const lines = Array.isArray(payslip.lines) ? payslip.lines : [];

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800">{payslip.employee_name}</h3>
          <p className="text-sm text-slate-500">{payslip.payrun_name} · {payslip.status}</p>
        </div>
        <div className="space-x-2">
          {/* Replaced old static <a> link with the new dynamic Print button */}
          <button
            onClick={handlePrint}
            disabled={printing}
            className="text-xs font-medium px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 inline-block disabled:opacity-50"
          >
            {printing ? 'Downloading...' : 'Print PDF'}
          </button>
          <button
            onClick={handleEmail}
            disabled={emailing}
            className="text-xs font-medium px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {emailing ? 'Sending...' : 'Email Payslip'}
          </button>
        </div>
      </div>

      <table className="w-full text-sm mb-4">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-slate-600">Component</th>
            <th className="text-left px-3 py-2 font-medium text-slate-600">Category</th>
            <th className="text-right px-3 py-2 font-medium text-slate-600">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-slate-100">
              <td className="px-3 py-2 text-slate-800">{line.name}</td>
              <td className="px-3 py-2 text-slate-500">{line.category}</td>
              <td className="px-3 py-2 text-right text-slate-800">₹{parseFloat(line.amount).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Gross Salary</span>
          <span className="font-medium text-slate-800">₹{parseFloat(payslip.gross_salary).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Total Deductions</span>
          <span className="font-medium text-slate-800">₹{parseFloat(payslip.total_deductions).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base pt-1">
          <span className="font-semibold text-slate-800">Net Salary</span>
          <span className="font-bold text-slate-900">₹{parseFloat(payslip.net_salary).toLocaleString()}</span>
        </div>
      </div>

      {payslip.has_warning && (
        <div className="mt-4 bg-amber-50 text-amber-700 text-xs p-2 rounded border border-amber-200">
          Warning: {payslip.warning_message}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
          Close
        </button>
      </div>
    </div>
  );
};

export default PayslipDetail;
