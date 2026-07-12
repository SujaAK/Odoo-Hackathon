import { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Filter, Calendar, FileDown, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import { MaintenanceLog, Vehicle } from '../types';

export default function Maintenance() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('Routine Service');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Close Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalCost, setFinalCost] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/maintenance', { params });
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch maintenance logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      // Get all vehicles to schedule maintenance
      const res = await api.get('/vehicles');
      // Filter out retired vehicles
      setVehicles(res.data.filter((v: Vehicle) => v.status !== 'RETIRED'));
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    }
  };

  const handleOpenAddModal = async () => {
    setVehicleId('');
    setType('Routine Service');
    setDescription('');
    setCost('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsModalOpen(true);
    await fetchVehicles();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      vehicleId,
      type,
      description,
      cost: parseFloat(cost || '0'),
      startDate,
    };

    try {
      await api.post('/maintenance', payload);
      setIsModalOpen(false);
      fetchLogs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save maintenance log');
    }
  };

  const handleOpenCloseModal = (log: MaintenanceLog) => {
    setActiveLogId(log.id);
    setEndDate(new Date().toISOString().split('T')[0]);
    setFinalCost(log.cost.toString());
    setError('');
    setIsCloseModalOpen(true);
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      endDate,
      cost: parseFloat(finalCost || '0'),
    };

    try {
      await api.put(`/maintenance/${activeLogId}/close`, payload);
      setIsCloseModalOpen(false);
      fetchLogs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to close maintenance log');
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/export/maintenance', '_blank');
  };

  const filteredLogs = logs.filter(l =>
    l.vehicle.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const cls = `badge badge-${status.toLowerCase().replace(/_/g, '-')}`;
    return <span className={cls}>{status}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Logs</h1>
          <p className="page-subtitle">Schedule repair jobs and track service costs</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileDown size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Log Maintenance
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by vehicle reg, model, service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--color-text-muted)" />
            <select className="select" style={{ width: '150px', padding: '8px 12px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading maintenance logs...
          </div>
        ) : filteredLogs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle Details</th>
                  <th>Service Type</th>
                  <th>Description</th>
                  <th>Est. / Final Cost</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.vehicle.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{log.vehicle.regNumber}</div>
                    </td>
                    <td>{log.type}</td>
                    <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={log.description}>
                      {log.description}
                    </td>
                    <td>${log.cost.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <Calendar size={14} color="var(--color-text-muted)" />
                        {new Date(log.startDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {log.endDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <Calendar size={14} color="var(--color-text-muted)" />
                          {new Date(log.endDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td>{statusBadge(log.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {log.status !== 'CLOSED' ? (
                        <button className="btn btn-success btn-sm" onClick={() => handleOpenCloseModal(log)}>
                          <CheckCircle size={12} /> Close Job
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No logs found matching filters.
          </div>
        )}
      </div>

      {/* Add Maintenance Log Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Log Vehicle Maintenance</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Vehicle</label>
                <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id} disabled={v.status === 'ON_TRIP'}>
                      {v.name} ({v.regNumber}) - {v.status === 'ON_TRIP' ? 'ON TRIP (Blocked)' : v.status}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                  Logging maintenance will automatically change vehicle status to <strong>IN SHOP</strong>.
                </span>
              </div>

              <div>
                <label className="label">Maintenance Type</label>
                <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Routine Service">Routine Service</option>
                  <option value="Engine Repair">Engine Repair</option>
                  <option value="Brake Overhaul">Brake Overhaul</option>
                  <option value="Tire Replacement">Tire Replacement</option>
                  <option value="Electrical Repair">Electrical Repair</option>
                  <option value="Other Diagnostics">Other Diagnostics</option>
                </select>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Describe repair job details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Estimated Cost ($)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Dialog */}
      {isCloseModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Complete Maintenance Job</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleCloseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Final Maintenance Cost ($)</label>
                <input
                  type="number"
                  className="input"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCloseModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Complete Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
