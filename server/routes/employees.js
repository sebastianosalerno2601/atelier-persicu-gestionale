const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// Ottieni tutti i dipendenti
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [employees] = await pool.query(`
      SELECT e.*, u.username 
      FROM employees e 
      LEFT JOIN users u ON e.id = u.employee_id 
      ORDER BY e.full_name
    `);
    res.json(employees);
  } catch (error) {
    console.error('Errore recupero dipendenti:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Crea nuovo dipendente
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { fullName, email, fiscalCode, birthYear, monthlySalary, color, createCredentials, credentials } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO employees (full_name, email, fiscal_code, birth_year, monthly_salary, color) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      [fullName, email, fiscalCode, birthYear, monthlySalary, color || '#ffffff']
    );
    
    const employeeId = result[0]?.id;
    
    // Crea credenziali se richiesto
    if (createCredentials && credentials) {
      const hashedPassword = await bcrypt.hash(credentials.password, 10);
      await pool.query(
        'INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, ?)',
        [credentials.username, hashedPassword, 'employee', employeeId]
      );
    }
    
    const [newEmployee] = await pool.query(`
      SELECT e.*, u.username 
      FROM employees e 
      LEFT JOIN users u ON e.id = u.employee_id 
      WHERE e.id = ?
    `, [employeeId]);
    res.json(newEmployee[0]);
  } catch (error) {
    console.error('Errore creazione dipendente:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiorna dipendente
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, fiscalCode, birthYear, monthlySalary, color, credentials } = req.body;
    
    await pool.query(
      'UPDATE employees SET full_name = ?, email = ?, fiscal_code = ?, birth_year = ?, monthly_salary = ?, color = ? WHERE id = ?',
      [fullName, email, fiscalCode, birthYear, monthlySalary, color, id]
    );
    
    // Aggiorna password se fornita
    if (credentials && credentials.password) {
      const hashedPassword = await bcrypt.hash(credentials.password, 10);
      await pool.query('UPDATE users SET password = ? WHERE employee_id = ?', [hashedPassword, id]);
    }
    
    const [updated] = await pool.query(`
      SELECT e.*, u.username 
      FROM employees e 
      LEFT JOIN users u ON e.id = u.employee_id 
      WHERE e.id = ?
    `, [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Errore aggiornamento dipendente:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elimina dipendente
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ message: 'Dipendente eliminato' });
  } catch (error) {
    console.error('Errore eliminazione dipendente:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

module.exports = router;

