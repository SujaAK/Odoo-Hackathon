import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, ShieldAlert, AlertTriangle, FileDown, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/axios';
import { Driver, DriverStatus } from '../types';

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Heavy Rigid (HR)');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [contact, setContact] = useState('');
  const [safetyScore, setSafetyScore] = useState('100');
  const [editId, setEditId] = useState<string | null>(null);
  const [unlinkedUsers, setUnlinkedUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, [statusFilter]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/drivers', { params });
      setDrivers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnlinkedUsers = async (currentLinkedUserId?: string | null) => {
    try {
      const res = await api.get('/drivers/unlinked-users');
      let users = res.data;
      if (currentLinkedUserId) {
        const exists = users.find((u: any) => u.id === currentLinkedUserId);
        if (!exists) {
          const currentDriver = drivers.find(d => d.userId === currentLinkedUserId);
          if (currentDriver?.user) {
            users = [currentDriver.user, ...users];
          } else {
            users = [{ id: currentLinkedUserId, name: 'Currently Linked Account', email: '' }, ...users];
          }
        }
      }
      setUnlinkedUsers(users);
    } catch (err) {
      console.error('Failed to fetch unlinked users:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditId(null);
    setName('');
    setLicenseNumber('');
    setLicenseCategory('Heavy Rigid (HR)');
    setLicenseExpiry('');
    setContact('');
    setSafetyScore('100');
    setSelectedUserId('');
    setUnlinkedUsers([]);
    setError('');
    setIsModalOpen(true);
    fetchUnlinkedUsers();
  };

  const handleOpenEditModal = (driver: Driver) => {
    setEditId(driver.id);
    setName(driver.name);
    setLicenseNumber(driver.licenseNumber);
    setLicenseCategory(driver.licenseCategory);
    setLicenseExpiry(driver.licenseExpiry.split('T')[0]);
    setContact(driver.contact);
    setSafetyScore(driver.safetyScore.toString());
    setSelectedUserId(driver.userId || '');
    setUnlinkedUsers([]);
    setError('');
    setIsModalOpen(true);
    fetchUnlinkedUsers(driver.userId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiry,
      contact,
      safetyScore: parseFloat(safetyScore),
      userId: selectedUserId || null,
    };

    try {
      if (editId) {
        await api.put(`/drivers/${editId}`, payload);
      } else {
        await api.post('/drivers', payload);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save driver');
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this driver?')) return;
    try {
      await api.put(`/drivers/${id}/suspend`);
      fetchDrivers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to suspend driver');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.put(`/drivers/${id}/activate`);
      fetchDrivers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to activate driver');
    }
  };

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/export/drivers', '_blank');
  };

  const isExpired = (expiryStr: string) => {
    return new Date(expiryStr) < new Date();
  };

  const isExpiringSoon = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // expiring in next 30 days
  };

  // Find any driver that has an expired license
  const expiredLicenseCount = drivers.filter(d => isExpired(d.licenseExpiry)).length;

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status: DriverStatus) => {
    const cls = `badge badge-${status.toLowerCase().replace(/_/g, '-')}`;
    return <span className={cls}>{status}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Drivers & Safety Registry</h1>
          <p className="page-subtitle">Track licenses validity, contact details, and compliance scores</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileDown size={18} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add Driver
          </button>
        </div>
      </div>

      {/* Expired License Warning Alert Banner */}
      {expiredLicenseCount > 0 && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <ShieldAlert size={20} />
          <div>
            <strong>Critical Alert:</strong> {expiredLicenseCount} driver(s) have expired licenses. Expired license drivers are blocked from new dispatches automatically.
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by name, license number, or phone..."
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
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading driver registry...
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver Info</th>
                  <th>License No.</th>
                  <th>Category</th>
                  <th>License Expiry</th>
                  <th>Contact Info</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => {
                  const expired = isExpired(driver.licenseExpiry);
                  const soon = isExpiringSoon(driver.licenseExpiry);

                  return (
                    <tr key={driver.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{driver.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {driver.id.substring(0, 8)}</div>
                      </td>
                      <td><code>{driver.licenseNumber}</code></td>
                      <td>{driver.licenseCategory}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: expired ? 'var(--color-danger)' : soon ? 'var(--color-warning)' : 'inherit', fontWeight: (expired || soon) ? 600 : 400 }}>
                            {new Date(driver.licenseExpiry).toLocaleDateString()}
                          </span>
                          {expired && <span title="License Expired!"><ShieldAlert size={14} color="var(--color-danger)" /></span>}
                          {soon && <span title="Expiring within 30 days"><AlertTriangle size={14} color="var(--color-warning)" /></span>}
                        </div>
                      </td>
                      <td>{driver.contact}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '40px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${driver.safetyScore}%`, 
                                background: driver.safetyScore >= 80 ? 'var(--color-success)' : driver.safetyScore >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{driver.safetyScore}</span>
                        </div>
                      </td>
                      <td>{statusBadge(driver.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(driver)}>
                            Edit
                          </button>
                          
                          {driver.status === 'SUSPENDED' ? (
                            <button className="btn btn-success btn-sm" onClick={() => handleActivate(driver.id)}>
                              <CheckCircle size={14} /> Activate
                            </button>
                          ) : (
                            <button 
                              className="btn btn-danger btn-sm" 
                              disabled={driver.status === 'ON_TRIP'} 
                              onClick={() => handleSuspend(driver.id)}
                              title={driver.status === 'ON_TRIP' ? 'Cannot suspend driver while on trip' : ''}
                            >
                              <XCircle size={14} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No drivers found matching filters.
          </div>
        )}
      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editId ? 'Edit Driver' : 'Add Driver'}</h2>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">License Number</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. DL-9831"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">License Category</label>
                  <select className="select" value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)}>
                    <option value="Light Rigid (LR)">Light Rigid (LR)</option>
                    <option value="Medium Rigid (MR)">Medium Rigid (MR)</option>
                    <option value="Heavy Rigid (HR)">Heavy Rigid (HR)</option>
                    <option value="Heavy Combination (HC)">Heavy Combination (HC)</option>
                    <option value="Multi-Combination (MC)">Multi-Combination (MC)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">License Expiry Date</label>
                  <input
                    type="date"
                    className="input"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Safety Compliance Score (0-100)</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Contact Info (Phone/Email)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. +61 412 345 678"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Linked User Account (Optional)</label>
                <select 
                  className="select" 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- No Linked User --</option>
                  {unlinkedUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email || 'No email'})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Links this operational driver profile to an authenticated login account.
                </p>
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
