const pool = require('../config/db');

// Recalculate total weekly hours from schedule lines
const recalculateWeeklyHours = async (scheduleId) => {
  const lines = await pool.query(
    'SELECT start_time, end_time, break_minutes FROM working_schedule_lines WHERE schedule_id = $1',
    [scheduleId]
  );

  let totalMinutes = 0;
  for (const line of lines.rows) {
    const [sh, sm] = line.start_time.split(':').map(Number);
    const [eh, em] = line.end_time.split(':').map(Number);
    const minutes = (eh * 60 + em) - (sh * 60 + sm) - (line.break_minutes || 0);
    totalMinutes += Math.max(minutes, 0);
  }

  const totalHours = (totalMinutes / 60).toFixed(2);
  await pool.query('UPDATE working_schedules SET total_weekly_hours = $1 WHERE id = $2', [totalHours, scheduleId]);
  return totalHours;
};

const getSchedules = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM working_schedules ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    const schedule = await pool.query('SELECT * FROM working_schedules WHERE id = $1', [id]);
    if (schedule.rows.length === 0) return res.status(404).json({ message: 'Schedule not found' });

    const lines = await pool.query(
      'SELECT * FROM working_schedule_lines WHERE schedule_id = $1 ORDER BY id',
      [id]
    );

    res.json({ ...schedule.rows[0], lines: lines.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createSchedule = async (req, res) => {
  const { name, schedule_type, company_name, lines } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const scheduleResult = await client.query(
      'INSERT INTO working_schedules (name, schedule_type, company_name) VALUES ($1,$2,$3) RETURNING *',
      [name, schedule_type || 'Fixed', company_name || 'My Company']
    );
    const schedule = scheduleResult.rows[0];

    if (Array.isArray(lines)) {
      for (const line of lines) {
        await client.query(
          'INSERT INTO working_schedule_lines (schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES ($1,$2,$3,$4,$5)',
          [schedule.id, line.day_of_week, line.start_time, line.end_time, line.break_minutes || 0]
        );
      }
    }

    await client.query('COMMIT');
    const totalHours = await recalculateWeeklyHours(schedule.id);

    res.status(201).json({ ...schedule, total_weekly_hours: totalHours });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

const updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { name, schedule_type, company_name, lines } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE working_schedules SET name = $1, schedule_type = $2, company_name = $3 WHERE id = $4 RETURNING *',
      [name, schedule_type, company_name, id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (Array.isArray(lines)) {
      await client.query('DELETE FROM working_schedule_lines WHERE schedule_id = $1', [id]);
      for (const line of lines) {
        await client.query(
          'INSERT INTO working_schedule_lines (schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES ($1,$2,$3,$4,$5)',
          [id, line.day_of_week, line.start_time, line.end_time, line.break_minutes || 0]
        );
      }
    }

    await client.query('COMMIT');
    const totalHours = await recalculateWeeklyHours(id);

    res.json({ ...result.rows[0], total_weekly_hours: totalHours });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM working_schedules WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule };