const pool = require('../config/db');

const getRequests = async (req, res) => {
  let { employee_id } = req.query;

  if (req.user.role === 'Employee') {
    const linked = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (linked.rows.length === 0) {
      return res.status(403).json({ message: 'No employee record linked to this account' });
    }
    employee_id = linked.rows[0].id;
  }

  try {    let query = `
      SELECT r.*, e.name AS employee_name, t.name AS time_off_type_name, t.unit
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN time_off_types t ON r.time_off_type_id = t.id
    `;
    const params = [];
    if (employee_id) {
      query += ' WHERE r.employee_id = $1';
      params.push(employee_id);
    }
    query += ' ORDER BY r.start_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createRequest = async (req, res) => {
  let { employee_id, time_off_type_id, start_date, end_date, duration, reason } = req.body;

  // If the caller is a plain Employee, force employee_id to their own record —
  // never trust a client-supplied employee_id for self-service roles.
  if (req.user.role === 'Employee') {
    const linked = await pool.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (linked.rows.length === 0) {
      return res.status(403).json({ message: 'No employee record linked to this account' });
    }
    employee_id = linked.rows[0].id;
  }

  if (!employee_id || !time_off_type_id || !start_date || !end_date || !duration) {
    return res.status(400).json({ message: 'employee_id, time_off_type_id, start_date, end_date, and duration are required' });
  }
  try {
    const result = await pool.query(`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, reason, status)
      VALUES ($1,$2,$3,$4,$5,$6,'Pending') RETURNING *
    `, [employee_id, time_off_type_id, start_date, end_date, duration, reason || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve or refuse a request. On approval, deduct from the matching allocation.
const updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Refused', 'Pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqResult = await client.query('SELECT * FROM time_off_requests WHERE id = $1 FOR UPDATE', [id]);
    if (reqResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Request not found' });
    }
    const request = reqResult.rows[0];

    if (request.status === 'Approved' && status !== 'Approved') {
      // Reverting an approval: restore balance
      await client.query(`
        UPDATE time_off_allocations
        SET taken_amount = taken_amount - $1
        WHERE employee_id = $2 AND time_off_type_id = $3 AND status = 'Approved'
      `, [request.duration, request.employee_id, request.time_off_type_id]);
    }

    if (status === 'Approved' && request.status !== 'Approved') {
      // Check the time off type requires allocation
      const typeResult = await client.query('SELECT * FROM time_off_types WHERE id = $1', [request.time_off_type_id]);
      const type = typeResult.rows[0];

      if (type.requires_allocation) {
        const allocResult = await client.query(`
          SELECT * FROM time_off_allocations
          WHERE employee_id = $1 AND time_off_type_id = $2 AND status = 'Approved'
          ORDER BY created_at ASC
        `, [request.employee_id, request.time_off_type_id]);

        const totalAllocated = allocResult.rows.reduce((sum, a) => sum + parseFloat(a.allocated_amount), 0);
        const totalTaken = allocResult.rows.reduce((sum, a) => sum + parseFloat(a.taken_amount), 0);
        const available = totalAllocated - totalTaken;

        if (available < parseFloat(request.duration)) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: `Insufficient balance. Available: ${available}, Requested: ${request.duration}` });
        }

        // Deduct from the earliest allocation(s)
        let remaining = parseFloat(request.duration);
        for (const alloc of allocResult.rows) {
          if (remaining <= 0) break;
          const allocAvailable = parseFloat(alloc.allocated_amount) - parseFloat(alloc.taken_amount);
          const deduct = Math.min(allocAvailable, remaining);
          if (deduct > 0) {
            await client.query(
              'UPDATE time_off_allocations SET taken_amount = taken_amount + $1 WHERE id = $2',
              [deduct, alloc.id]
            );
            remaining -= deduct;
          }
        }
      }
    }

    const updated = await client.query(
      'UPDATE time_off_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

const deleteRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM time_off_requests WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRequests, createRequest, updateRequestStatus, deleteRequest };