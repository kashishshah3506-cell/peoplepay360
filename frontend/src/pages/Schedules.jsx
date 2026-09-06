import { useState, useEffect } from 'react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getScheduleById } from '../api/scheduleApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ScheduleForm from '../components/ScheduleForm';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const { user } = useAuth();

  const canEdit = ['Admin', 'HR Manager'].includes(user?.role);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await getSchedules();
      setSchedules(res.data);
    } catch (err) {
      console.error('Failed to fetch schedules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const openCreateModal = () => {
    setEditingSchedule(null);
    setModalOpen(true);
  };

  const openEditModal = async (schedule) => {
    const res = await getScheduleById(schedule.id);
    setEditingSchedule(res.data);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editingSchedule) {
      await updateSchedule(editingSchedule.id, payload);
    } else {
      await createSchedule(payload);
    }
    setModalOpen(false);
    fetchSchedules();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await deleteSchedule(id);
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Working Schedules</h1>
          <p className="text-sm text-slate-500 mt-1">Define weekly work patterns</p>
        </div>
        {canEdit && (
          <button onClick={openCreateModal} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium">
            + New Schedule
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No schedules found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Weekly Hours</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                {canEdit && <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
             {schedules.map((s) => (
  <tr
    key={s.id}
    onClick={() => canEdit && openEditModal(s)}
    className={`border-b border-slate-100 hover:bg-slate-50 ${canEdit ? 'cursor-pointer' : ''}`}
  >
    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
    <td className="px-4 py-3 text-slate-600">{s.schedule_type}</td>
    <td className="px-4 py-3 text-slate-600">{s.total_weekly_hours} hrs</td>
    <td className="px-4 py-3 text-slate-600">{s.company_name}</td>
    {canEdit && (
      <td className="px-4 py-3 text-right space-x-2">
        <button
          onClick={(e) => { e.stopPropagation(); openEditModal(s); }}
          className="text-slate-600 hover:text-slate-900 text-xs font-medium"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
          className="text-red-600 hover:text-red-800 text-xs font-medium"
        >
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
        title={editingSchedule ? 'Edit Schedule' : 'New Schedule'}
      >
        <ScheduleForm
          initialData={editingSchedule}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitLabel={editingSchedule ? 'Save Changes' : 'Create Schedule'}
        />
      </Modal>
    </div>
  );
};

export default Schedules;