import { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Filter, ArrowRight, Check, X, CheckCircle, Navigation, FileDown } from 'lucide-react';
import api from '../lib/axios';
import { Trip, TripStatus, Vehicle, Driver } from '../types';

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Multi-step Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  // Complete Trip Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [revenue, setRevenue] = useState('');

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/trips', { params });
      setTrips(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles/available'),
        api.get('/drivers/available'),
      ]);
      setAvailableVehicles(vRes.data);
      setAvailableDrivers(dRes.data);
    } catch (err) {
      console.error('Failed to fetch available assets', err);
    }
  };

  const handleOpenAddModal = async () => {
    setStep(1);
    setSource('');
    setDestination('');
    setPlannedDistance('');
    setCargoWeight('');
    setVehicleId('');
    setDriverId('');
    setError('');
    setIsModalOpen(true);
    await fetchAvailableAssets();
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!source || !destination || !plannedDistance || !cargoWeight) {
        setError('Please fill in all route details.');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleBackStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      source,
      destination,
      plannedDistance: parseFloat(plannedDistance),
      cargoWeight: parseFloat(cargoWeight),
      vehicleId,
      driverId,
    };

    try {
      await api.post('/trips', payload);
      setIsModalOpen(false);
      fetchTrips();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create trip');
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      await api.put(`/trips/${id}/dispatch`);
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispatch trip');
    }
  };

  const handleOpenCompleteModal = (trip: Trip) => {
    setActiveTripId(trip.id);
    setActualDistance(trip.plannedDistance.toString());
    setFuelConsumed('');
    setRevenue('');
    setError('');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      actualDistance: parseFloat(actualDistance),
      fuelConsumed: parseFloat(fuelConsumed),
      revenue: parseFloat(revenue) || 0,
    };

    try {
      await api.put(`/trips/${activeTripId}/complete`, payload);
      setIsCompleteModalOpen(false);
      fetchTrips();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete trip');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await api.put(`/trips/${id}/cancel`);
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel trip');
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/export/trips', '_blank');
  };

  const filteredTrips = trips.filter(t =>
    t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.vehicle.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.driver.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status: TripStatus) => {
    const cls = `badge badge-${status.toLowerCase().replace(/_/g, '-')}`;
    return <span className={cls}>{status}</span>;
  };

  // Selected vehicle & driver for confirmation step
  const selectedVehicle = availableVehicles.find(v => v.id === vehicleId);
  const selectedDriver = availableDrivers.find(d => d.id === driverId);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Dispatch Center</h1>
          <p className="page-subtitle">Create, dispatch, complete, and track trips lifecycle</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileDown size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Plan New Trip
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by source, destination, vehicle, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--color-text-muted)" />
            <select className="select" style={{ width: '150px', padding: '8px 12px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips list */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading dispatch logs...
          </div>
        ) : filteredTrips.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo Weight</th>
                  <th>Planned / Actual</th>
                  <th>Fuel Consumed</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {trip.source} <ArrowRight size={14} color="var(--color-brand)" /> {trip.destination}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Scheduled {new Date(trip.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 550 }}>{trip.vehicle.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{trip.vehicle.regNumber}</div>
                    </td>
                    <td>{trip.driver.name}</td>
                    <td>{trip.cargoWeight.toLocaleString()} kg</td>
                    <td>
                      <div>{trip.plannedDistance} km</div>
                      {trip.actualDistance !== null && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                          Actual: {trip.actualDistance} km
                        </div>
                      )}
                    </td>
                    <td>{trip.fuelConsumed !== null ? `${trip.fuelConsumed} L` : '—'}</td>
                    <td>{statusBadge(trip.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {trip.status === 'DRAFT' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleDispatch(trip.id)}>
                              <Navigation size={12} /> Dispatch
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(trip.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                        {trip.status === 'DISPATCHED' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleOpenCompleteModal(trip)}>
                              <CheckCircle size={12} /> Complete
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(trip.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                        {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Archived</span>
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
            No trips found matching filters.
          </div>
        )}
      </div>

      {/* Multi-step dispatch dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '580px' }}>
            {/* Step Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: 'var(--color-border)', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: '15px', left: '10%', width: step === 2 ? '40%' : step === 3 ? '80%' : '0%', height: '2px', background: 'var(--color-brand)', zIndex: 2, transition: 'width 0.3s ease' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 3 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= 1 ? 'var(--color-brand)' : 'var(--color-surface)', border: '2px solid var(--color-border)', color: step >= 1 ? '#000' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 600 }}>1</div>
                <span style={{ fontSize: '0.75rem', color: step >= 1 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>Route</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 3 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= 2 ? 'var(--color-brand)' : 'var(--color-surface)', border: '2px solid var(--color-border)', color: step >= 2 ? '#000' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 600 }}>2</div>
                <span style={{ fontSize: '0.75rem', color: step >= 2 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>Assign Assets</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 3 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= 3 ? 'var(--color-brand)' : 'var(--color-surface)', border: '2px solid var(--color-border)', color: step >= 3 ? '#000' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 600 }}>3</div>
                <span style={{ fontSize: '0.75rem', color: step >= 3 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>Confirm</span>
              </div>
            </div>

            <h2>Plan New Trip</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* STEP 1: ROUTE & LOAD */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Source Location</label>
                      <input type="text" className="input" placeholder="e.g. Sydney Port" value={source} onChange={(e) => setSource(e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">Destination Location</label>
                      <input type="text" className="input" placeholder="e.g. Melbourne Hub" value={destination} onChange={(e) => setDestination(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="label">Planned Distance (km)</label>
                      <input type="number" className="input" placeholder="e.g. 850" value={plannedDistance} onChange={(e) => setPlannedDistance(e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">Cargo Weight (kg)</label>
                      <input type="number" className="input" placeholder="e.g. 12000" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={handleNextStep}>Next Step <ArrowRight size={16} /></button>
                  </div>
                </div>
              )}

              {/* STEP 2: ASSET ALLOCATION */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="label">Select Vehicle</label>
                    <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
                      <option value="">-- Choose Available Vehicle --</option>
                      {availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.regNumber}) - Max Load: {v.maxLoad}kg
                        </option>
                      ))}
                    </select>
                    {availableVehicles.length === 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>No vehicles are available right now.</div>
                    )}
                  </div>

                  <div>
                    <label className="label">Select Driver</label>
                    <select className="select" value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
                      <option value="">-- Choose Available Driver --</option>
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} (Category: {d.licenseCategory})
                        </option>
                      ))}
                    </select>
                    {availableDrivers.length === 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>No drivers are available right now.</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleBackStep}>Back</button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      disabled={!vehicleId || !driverId}
                      onClick={() => setStep(3)}
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIRM & SUBMIT */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-brand)', fontWeight: 600, marginBottom: '12px' }}>Trip Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                      <div>Route: <strong>{source} to {destination}</strong></div>
                      <div>Cargo Weight: <strong>{cargoWeight} kg</strong></div>
                      <div>Planned Distance: <strong>{plannedDistance} km</strong></div>
                      <div>Vehicle: <strong>{selectedVehicle?.name} ({selectedVehicle?.regNumber})</strong></div>
                      <div>Driver: <strong>{selectedDriver?.name}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleBackStep}>Back</button>
                    <button type="submit" className="btn btn-success">
                      <Check size={16} /> Confirm & Save Draft
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Complete Dispatched Trip</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Actual Distance (km)</label>
                <input
                  type="number"
                  className="input"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 240"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Trip Revenue ($)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 5000"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCompleteModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
