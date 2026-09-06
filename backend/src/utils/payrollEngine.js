const pool = require('../config/db');

// Safely evaluates a formula string like "BASIC + HRA - PF" using resolved code values.
// Only allows numbers, known codes, and + - * / ( ) operators. No eval() of raw user input.
const evaluateFormula = (formula, resolvedValues) => {
  // Replace known codes with their numeric values
  const tokens = formula.match(/[A-Za-z_][A-Za-z0-9_]*|[0-9.]+|[+\-*/()]/g) || [];
  let expression = '';

  for (const token of tokens) {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
      if (!(token in resolvedValues)) {
        throw new Error(`Formula references unknown code: ${token}`);
      }
      expression += resolvedValues[token];
    } else {
      expression += token;
    }
  }

  // Final safety check: expression must only contain digits, operators, dots, spaces, parens
  if (!/^[0-9.+\-*/()\s]+$/.test(expression)) {
    throw new Error('Formula contains invalid characters after resolution');
  }

  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expression});`)();
  if (typeof result !== 'number' || Number.isNaN(result)) {
    throw new Error('Formula did not evaluate to a valid number');
  }
  return result;
};

// Computes a full payslip's rule breakdown for one employee + contract + structure + worked days ratio
const computePayslipLines = async (structureId, contract, workedDaysRatio) => {
  const rulesResult = await pool.query(
    'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
    [structureId]
  );
  const rules = rulesResult.rows;

  const resolvedValues = {}; // code -> numeric amount
  const lines = [];

  for (const rule of rules) {
    let amount = 0;

    if (rule.code === 'BASIC' && rule.computation_method === 'Fixed') {
      // BASIC is special-cased to pull from the contract wage, prorated by worked days
      amount = parseFloat(contract.wage) * workedDaysRatio;
    } else if (rule.computation_method === 'Fixed') {
      amount = parseFloat(rule.amount) || 0;
    } else if (rule.computation_method === 'Percentage') {
      const base = resolvedValues[rule.percentage_base_code];
      if (base === undefined) {
        throw new Error(`Rule ${rule.code} references undefined base code ${rule.percentage_base_code}`);
      }
      amount = (base * parseFloat(rule.percentage)) / 100;
    } else if (rule.computation_method === 'Formula') {
      amount = evaluateFormula(rule.formula, resolvedValues);
    }

    amount = Math.round(amount * 100) / 100;
    resolvedValues[rule.code] = amount;

    lines.push({
      salary_rule_id: rule.id,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      amount,
      sequence: rule.sequence,
    });
  }

  const grossLines = lines.filter(l => l.category === 'Gross');
  const gross = grossLines.length > 0
    ? grossLines.reduce((s, l) => s + l.amount, 0)
    : lines.filter(l => ['Basic', 'Allowance'].includes(l.category)).reduce((s, l) => s + l.amount, 0);

  const deductions = lines.filter(l => l.category === 'Deduction').reduce((s, l) => s + l.amount, 0);

  const netLines = lines.filter(l => l.category === 'Net');
  const net = netLines.length > 0
    ? netLines.reduce((s, l) => s + l.amount, 0)
    : (gross - deductions);
  return { lines, gross_salary: gross, total_deductions: deductions, net_salary: net };
};

module.exports = { computePayslipLines, evaluateFormula };