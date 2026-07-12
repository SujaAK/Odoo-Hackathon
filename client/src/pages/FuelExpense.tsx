import { useState, useEffect } from 'react';
import { Fuel, Plus, Search, Calendar, FileDown, DollarSign } from 'lucide-react';
import api from '../lib/axios';
import { FuelLog, Expense, Vehicle } from '../types';

export default function FuelExpense() {
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Fuel Log Form State
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);

  // Expense Form State
  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [expenseType, setExpenseType] = useState('Tolls');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
    fetchVehicles();
  }, [selectedVehicleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedVehicleId) params.vehicleId = selectedVehicleId;

      const [fuelRes, expenseRes] = await Promise.all([
        api.get('/fuel', { params }),
        api.get('/expenses', { params }),
      ]);
      setFuelLogs(fuelRes.data);
      setExpenses(expenseRes.data);
    } catch (err: any) {
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFuelModal = () => {
    setFuelVehicleId('');
    setLiters('');
    setFuelCost('');
    setFuelDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsFuelModalOpen(true);
  };

  const handleOpenExpenseModal = () => {
    setExpenseVehicleId('');
    setExpenseType('Tolls');
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setError('');
    setIsExpenseModalOpen(true);
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      vehicleId: fuelVehicleId,
      liters: parseFloat(liters),
      cost: parseFloat(fuelCost),
      date: fuelDate,
    };

    try {
      await api.post('/fuel', payload);
      setIsFuelModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save fuel log');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      vehicleId: expenseVehicleId,
      type: expenseType,
      amount: parseFloat(amount),
      date: expenseDate,
      description,
    };

    try {
      await api.post('/expenses', payload);
      setIsExpenseModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save expense log');
    }
  };

  const handleExportCSV = () => {
    window.open(`http://localhost:5000/api/export/${activeTab}`, '_blank');
  };

  const filteredFuelLogs = fuelLogs.filter(log =>
    log.vehicle.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpenses = expenses.filter(exp =>
    exp.vehicle.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Totals calculations
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuel & Expense Log</h1>
          <p className="page-subtitle">Track operational costs, toll charges, and fuel usage</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileDown size={18} /> Export CSV
          </button>
          {activeTab === 'fuel' ? (
            <button className="btn btn-primary" onClick={handleOpenFuelModal}>
              <Plus size={18} /> Add Fuel Log
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleOpenExpenseModal}>
              <Plus size={18} /> Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${activeTab === 'fuel' ? 'tab-active' : ''}`} onClick={() => { setActiveTab('fuel'); setSearchTerm(''); }}>
            Fuel Logs
          </button>
          <button className={`tab ${activeTab === 'expenses' ? 'tab-active' : ''}`} onClick={() => { setActiveTab('expenses'); setSearchTerm(''); }}>
            Other Expenses
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select className="select" style={{ width: '180px', padding: '8px 12px' }} value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
            <option value="">Filter by Vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.regNumber})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {activeTab === 'fuel' ? (
          <>
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--color-brand)' }}>
                <Fuel size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Fuel Cost</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-brand)' }}>${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--color-info)' }}>
                <Fuel size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Liters Pumped</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalFuelLiters.toLocaleString()} L</div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.12)', padding: '10px', borderRadius: '10px', color: 'var(--color-success)' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total General Expenses</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>${totalExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading log entries...
          </div>
        ) : activeTab === 'fuel' ? (
          filteredFuelLogs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Liters (L)</th>
                    <th>Refuel Cost</th>
                    <th>Price/L</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFuelLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.vehicle.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{log.vehicle.regNumber}</div>
                      </td>
                      <td>{log.liters.toLocaleString()} L</td>
                      <td>${log.cost.toLocaleString()}</td>
                      <td>${(log.cost / log.liters).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <Calendar size={14} color="var(--color-text-muted)" />
                          {new Date(log.date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No fuel logs recorded yet.</div>
          )
        ) : (
          filteredExpenses.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Expense Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{exp.vehicle.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{exp.vehicle.regNumber}</div>
                      </td>
                      <td><span className="badge badge-draft">{exp.type}</span></td>
                      <td>{exp.description || <span style={{ color: 'var(--color-text-muted)' }}>No description</span>}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>${exp.amount.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <Calendar size={14} color="var(--color-text-muted)" />
                          {new Date(exp.date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No expenses recorded yet.</div>
          )
        )}
      </div>

      {/* Add Fuel Modal */}
      {isFuelModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Fuel Log Entry</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleFuelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Vehicle</label>
                <select className="select" value={fuelVehicleId} onChange={(e) => setFuelVehicleId(e.target.value)} required>
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.regNumber})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Liters Refueled (L)</label>
                  <input type="number" className="input" placeholder="e.g. 150" value={liters} onChange={(e) => setLiters(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Total Refuel Cost ($)</label>
                  <input type="number" className="input" placeholder="e.g. 300" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Refuel Date</label>
                <input type="date" className="input" value={fuelDate} onChange={(e) => setFuelDate(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFuelModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Fuel Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Other Expense</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Vehicle</label>
                <select className="select" value={expenseVehicleId} onChange={(e) => setExpenseVehicleId(e.target.value)} required>
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.regNumber})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Expense Type</label>
                  <select className="select" value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
                    <option value="Tolls">Tolls</option>
                    <option value="Registration Fees">Registration Fees</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Road Taxes">Road Taxes</option>
                    <option value="Fines / Violations">Fines / Violations</option>
                    <option value="Other Service Charges">Other Service Charges</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount ($)</label>
                  <input type="number" className="input" placeholder="e.g. 75" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
              </div>

              <div>
                <label className="label">Description / Notes</label>
                <input type="text" className="input" placeholder="e.g. Sydney highway tolls invoice #9932" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
