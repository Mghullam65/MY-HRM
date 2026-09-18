// ============================================================
// HRM SYSTEM — SPMS TAX CALCULATION ENGINE SERVICE (EXACT)
// Implements Pakistan FBR Salaried Tax Withholding (§8 & §12)
// ============================================================

const DEFAULT_TAX_SLABS = [
  { id: 1, payroll_type: 1, range_from: 0, range_to: 600000, fixed_tax: 0, percentage_over: 0, effective_date: '2025-07-01' },
  { id: 2, payroll_type: 1, range_from: 600000, range_to: 1200000, fixed_tax: 0, percentage_over: 0.01, effective_date: '2025-07-01' },
  { id: 3, payroll_type: 1, range_from: 1200000, range_to: 2200000, fixed_tax: 6000, percentage_over: 0.11, effective_date: '2025-07-01' },
  { id: 4, payroll_type: 1, range_from: 2200000, range_to: 3200000, fixed_tax: 116000, percentage_over: 0.23, effective_date: '2025-07-01' },
  { id: 5, payroll_type: 1, range_from: 3200000, range_to: 4100000, fixed_tax: 346000, percentage_over: 0.30, effective_date: '2025-07-01' },
  { id: 6, payroll_type: 1, range_from: 4100000, range_to: 999999999, fixed_tax: 616000, percentage_over: 0.35, effective_date: '2025-07-01' }
];

const TaxEngine = {
  DEFAULT_TAX_SLABS,

  /**
   * Resolve active tax slabs for a given payroll month and payroll type.
   * Finds the latest effective_date on or before payroll_month (YYYY-MM).
   */
  getEffectiveSlabs(taxTable = DEFAULT_TAX_SLABS, payrollMonth = '2026-07', payrollType = 1) {
    if (!Array.isArray(taxTable) || taxTable.length === 0) {
      taxTable = DEFAULT_TAX_SLABS;
    }
    const typeSlabs = taxTable.filter(s => Number(s.payroll_type || 1) === Number(payrollType || 1));
    const targetMonthPrefix = payrollMonth ? payrollMonth.slice(0, 7) : '2026-07';

    // Find all slabs effective on or before the target month
    const validSlabs = typeSlabs.filter(s => {
      const eff = s.effective_date ? s.effective_date.slice(0, 7) : '2025-07';
      return eff <= targetMonthPrefix;
    });

    if (validSlabs.length === 0) {
      return typeSlabs.length > 0 ? typeSlabs : DEFAULT_TAX_SLABS;
    }

    // Determine the latest effective_date among valid slabs
    let latestDate = '';
    validSlabs.forEach(s => {
      const eff = s.effective_date || '';
      if (!latestDate || eff > latestDate) latestDate = eff;
    });

    const activeSet = validSlabs.filter(s => s.effective_date === latestDate);
    return activeSet.sort((a, b) => Number(a.range_from) - Number(b.range_from));
  },

  /**
   * Determine fiscal year start for a given month (YYYY-MM).
   * Pakistan Fiscal Year starts July 1 (Month 07).
   * E.g. '2026-07' to '2027-06' belongs to FY 2026-2027 (starts '2026-07').
   */
  getFiscalYearStart(payrollMonth = '2026-07') {
    const parts = payrollMonth.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (month >= 7) {
      return `${year}-07`;
    } else {
      return `${year - 1}-07`;
    }
  },

  /**
   * Computes derived rates from monthly salary and working days.
   */
  deriveRates(monthlySalary = 0, workingDays = 22) {
    const days = Math.max(1, Number(workingDays) || 22);
    const monthly = Math.max(0, Number(monthlySalary) || 0);
    const daily = monthly / days;
    const hourly = daily / 8;
    const perMinute = hourly / 60;
    return {
      monthlyRate: monthly,
      dailyRate: Math.round(daily * 100) / 100,
      hourly: Math.round(hourly * 100) / 100,
      perMinute: Math.round(perMinute * 10000) / 10000
    };
  },

  /**
   * The Exact SPMS Tax Calculation Engine (§8).
   */
  calculate({
    employee = {},
    payrollMonth = '2026-07',
    payrollType = 1,
    grossIncome = 0,
    pfAmount = null,
    pfFundRate = null,
    eobiEmployee = 0,
    preTaxLoans = 0,
    otherDeductions = 0,
    splitter = null,
    bonus = 0,
    bonusTax = 'no',
    priorPayrollRowsInFY = [],
    taxTable = DEFAULT_TAX_SLABS,
    alreadyNetOfPF = false
  }) {
    // 1) Base income, net of PF exactly ONCE
    let gross = Number(grossIncome) || 0;
    const pfRate = pfFundRate !== null ? Number(pfFundRate) : Number(employee.pf_fund !== undefined ? employee.pf_fund : 0);
    
    let pfDeduction = 0;
    if (alreadyNetOfPF) {
      pfDeduction = pfAmount !== null ? Number(pfAmount) : 0;
    } else {
      pfDeduction = pfAmount !== null ? Number(pfAmount) : (gross * (pfRate / 100));
      gross = gross - pfDeduction; // PF removed here, never again
    }

    const eobi = Number(eobiEmployee !== undefined ? eobiEmployee : (employee.eoib_employee || 0));
    const loansPreTax = Number(preTaxLoans || 0);

    gross = gross - eobi - loansPreTax;

    // 2) Splitter -> the amount actually taxed this month
    const empSplitter = splitter !== null && splitter !== undefined ? Number(splitter) : (employee.splitter !== undefined && employee.splitter !== null && employee.splitter > 0 ? Number(employee.splitter) : gross);
    
    let sendInBankBeforeTax = 0;
    let cashRemittances = 0;

    if (gross > empSplitter) {
      sendInBankBeforeTax = empSplitter;
      cashRemittances = gross - empSplitter;
    } else {
      sendInBankBeforeTax = gross;
      cashRemittances = 0;
    }

    const isBonusTaxable = (bonusTax === 'yes' || bonusTax === true || employee.bonus_tax === 'yes');
    const recurringBonus = Number(bonus !== undefined ? bonus : (employee.bonus || 0));
    if (isBonusTaxable && recurringBonus > 0) {
      sendInBankBeforeTax += recurringBonus;
    }

    // 3) Annualise by projecting THIS month's taxed amount across the year
    const annualSalary = sendInBankBeforeTax * 12;

    // 4) Slab lookup: latest tax_table set effective on/before payroll_month
    const activeSlabs = this.getEffectiveSlabs(taxTable, payrollMonth, payrollType);
    let matchedSlab = activeSlabs[0] || DEFAULT_TAX_SLABS[0];

    for (const slab of activeSlabs) {
      const from = Number(slab.range_from);
      const to = slab.range_to !== null && slab.range_to !== undefined ? Number(slab.range_to) : Infinity;
      if (annualSalary >= from && annualSalary <= to) {
        matchedSlab = slab;
        break;
      }
    }

    const fixedTax = Number(matchedSlab.fixed_tax || 0);
    const percentageOver = Number(matchedSlab.percentage_over || 0); // Fraction: 0.01 = 1%
    const slabFrom = Number(matchedSlab.range_from || 0);

    let totalAnnualTax = 0;
    if (annualSalary > slabFrom) {
      totalAnnualTax = fixedTax + (annualSalary - slabFrom) * percentageOver;
    } else {
      totalAnnualTax = fixedTax;
    }

    // 5) Spread over remaining fiscal-year months (FY starts JULY)
    const fyStart = this.getFiscalYearStart(payrollMonth);
    const relevantPriorRows = (priorPayrollRowsInFY || []).filter(r => {
      const m = r.payroll_month || r.month || '';
      return m >= fyStart && m < payrollMonth;
    });

    const priorTax = relevantPriorRows.reduce((sum, r) => sum + Number(r.withholding_tax || r.tax || 0), 0);
    const priorCount = relevantPriorRows.length;
    const remainingMonths = Math.max(1, 12 - priorCount);

    let withholdingTax = (totalAnnualTax - priorTax) / remainingMonths;
    withholdingTax = Math.round(Math.max(0, withholdingTax) * 100) / 100;

    // 6) Net pay & bank transfer
    const sendInBank = Math.max(0, Math.round((sendInBankBeforeTax - withholdingTax) * 100) / 100);
    const otherDeduct = Number(otherDeductions || 0);
    const netPay = Math.max(0, Math.round(((gross - otherDeduct) - withholdingTax) * 100) / 100);

    return {
      grossIncome: Math.round((gross + pfDeduction + eobi + loansPreTax) * 100) / 100,
      pfDeduction: Math.round(pfDeduction * 100) / 100,
      eobiDeduction: Math.round(eobi * 100) / 100,
      preTaxLoansDeduction: Math.round(loansPreTax * 100) / 100,
      baseAfterPF: Math.round(gross * 100) / 100,
      splitter: empSplitter,
      sendInBankBeforeTax: Math.round(sendInBankBeforeTax * 100) / 100,
      cashRemittances: Math.round(cashRemittances * 100) / 100,
      annualSalary: Math.round(annualSalary * 100) / 100,
      matchedSlab: {
        id: matchedSlab.id,
        range_from: matchedSlab.range_from,
        range_to: matchedSlab.range_to,
        fixed_tax: matchedSlab.fixed_tax,
        percentage_over: matchedSlab.percentage_over,
        effective_date: matchedSlab.effective_date
      },
      totalAnnualTax: Math.round(totalAnnualTax * 100) / 100,
      priorTax: Math.round(priorTax * 100) / 100,
      priorCount,
      remainingMonths,
      withholdingTax: Math.round(withholdingTax * 100) / 100,
      sendInBank,
      netPay
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TaxEngine;
}
if (typeof window !== 'undefined') {
  window.TaxEngine = TaxEngine;
}
