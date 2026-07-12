import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter, Wrench, Ban, RefreshCw, FileDown } from 'lucide-react';
import api from '../lib/axios';
import { Vehicle, VehicleStatus } from '../types';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState('');

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Truck');
  const [maxLoad, setMaxLoad] = useState('');
  const [odometer, setOdometer] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, typeFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/vehicles', { params });
      setVehicles(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditId(null);
    setRegNumber('');
    setName('');
    setType('Truck');
    setMaxLoad('');
    setOdometer('');
    setAcquisitionCost('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditId(vehicle.id);
    setRegNumber(vehicle.regNumber);
    setName(vehicle.name);
    setType(vehicle.type);
    setMaxLoad(vehicle.maxLoad.toString());
    setOdometer(vehicle.odometer.toString());
    setAcquisitionCost(vehicle.acquisitionCost.toString());
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      regNumber,
      name,
      type,
      maxLoad: parseFloat(maxLoad),
      odometer: parseFloat(odometer || '0'),
      acquisitionCost: parseFloat(acquisitionCost),
    };

    try {
      if (editId) {
        await api.put(`/vehicles/${editId}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save vehicle');
    }
  };

  const handleRetire = async (id: string) => {
    if (!confirm('Are you sure you want to retire this vehicle?')) return;
    try {
      await api.put(`/vehicles/${id}/retire`);
      fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to retire vehicle');
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/export/vehicles', '_blank');
  };

  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status: VehicleStatus) => {
    const cls = `badge badge-${status.toLowerCase().replace(/_/g, '-')}`;
    return <span className={cls}>{status}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicles Registry</h1>
          <p className="page-subtitle">Manage fleet assets and lifecycle status</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileDown size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add Vehicle
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
            placeholder="Search by registration or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--color-text-muted)" />
            <select className="select" style={{ width: '150px', padding: '8px 12px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          <select className="select" style={{ width: '130px', padding: '8px 12px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="SUV">SUV</option>
            <option value="Sedan">Sedan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading vehicles...
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle Details</th>
                  <th>Reg Number</th>
                  <th>Type</th>
                  <th>Max Load (kg)</th>
                  <th>Odometer (km)</th>
                  <th>Acq. Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{vehicle.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Created {new Date(vehicle.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td><code style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>{vehicle.regNumber}</code></td>
                    <td>{vehicle.type}</td>
                    <td>{vehicle.maxLoad.toLocaleString()}</td>
                    <td>{vehicle.odometer.toLocaleString()}</td>
                    <td>${vehicle.acquisitionCost.toLocaleString()}</td>
                    <td>{statusBadge(vehicle.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(vehicle)}>
                          Edit
                        </button>
                        {vehicle.status !== 'RETIRED' && (
                          <button 
                            className="btn btn-danger btn-sm" 
                            disabled={vehicle.status === 'ON_TRIP'} 
                            onClick={() => handleRetire(vehicle.id)}
                            title={vehicle.status === 'ON_TRIP' ? 'Cannot retire vehicle while on trip' : ''}
                          >
                            <Ban size={14} /> Retire
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No vehicles found matching filters.
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Registration Number (Unique)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. TO-8822"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Vehicle Name/Model</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Volvo FH16"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Type</label>
                  <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                  </select>
                </div>
                <div>
                  <label className="label">Max Load (kg)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 15000"
                    value={maxLoad}
                    onChange={(e) => setMaxLoad(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Current Odometer (km)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 45000"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 120000"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
