import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getContracts, createContract, updateContract, deleteContract } from '../api/contractApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ContractForm from '../components/ContractForm';

const Contracts = () => {
  const [searchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employee_id');

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const { user } = useAuth();

  const canEdit = ['Admin', 'HR Manager'].includes(user?.role);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await getContracts(employeeIdFilter);
      setContracts(res.data);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [employeeIdFilter]);

  const openCreateModal = () => {
    setEditingContract(null);
    setModalOpen(true);
  };

  const openEditModal = (contract) => {
    setEditingContract(contract);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editingContract) {
      await updateContract(editingContract.id, payload);
    } else {
      await createContract(payload);
    }
    setModalOpen(false);
    fetchContracts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract?')) return;
    try {
      await deleteContract(id);
      fetchContracts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete contract');
    }
  };

  const statusColor = (status) => {
    if (status === 'Running') return 'bg-green-100 text-green-700';
    if (status === 'Expired') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contracts</h1>
          <p className="text-sm text-slate-500 mt-1">
            {employeeIdFilter ? 'Filtered by employee' : 'All employee contracts'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + New Contract
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No contracts found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Structure</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Wage</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Start</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">End</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                {canEdit && <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.employee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.salary_structure_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">₹{parseFloat(c.wage).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(c.start_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEditModal(c)} className="text-slate-600 hover:text-slate-900 text-xs font-medium">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContract ? 'Edit Contract' : 'New Contract'}
      >
        <ContractForm
          initialData={editingContract}
          defaultEmployeeId={employeeIdFilter}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitLabel={editingContract ? 'Save Changes' : 'Create Contract'}
        />
      </Modal>
    </div>
  );
};

export default Contracts;