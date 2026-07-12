import { useState, useEffect } from 'react';
import { Truck, Users, MapPin, Wrench, Fuel, BarChart3, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/axios';
import KPICard from '../components/KPICard';
import { DashboardKPIs, Trip } from '../types';

const STATUS_COLORS = {
  Available: '#4ade80',
  'On Trip': '#60a5fa',
  'In Shop': '#fbbf24',
  Retired: '#f87171',
};

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleType, setVehicleType] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    loadData(vehicleType, status, region);
  }, [vehicleType, status, region]);

  const loadData = async (typeFilter = '', statusFilter = '', regionFilter = '') => {
    try {
      const params: any = {};
      if (typeFilter) params.vehicleType = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;

      const [kpiRes, tripsRes] = await Promise.all([
        api.get('/dashboard/kpis', { params }),
        api.get('/dashboard/recent-trips'),
      ]);
      setKpis(kpiRes.data);
      setRecentTrips(tripsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !kpis) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</p>
      </div>
    );
  }

  const pieData = kpis ? [
    { name: 'Available', value: kpis.availableVehicles },
    { name: 'On Trip', value: kpis.onTripVehicles },
    { name: 'In Shop', value: kpis.inShopVehicles },
    { name: 'Retired', value: kpis.retiredVehicles },
  ].filter(d => d.value > 0) : [];

  const statusBadge = (status: string) => {
    const cls = `badge badge-${status.toLowerCase().replace(/[_ ]/g, '-')}`;
    return <span className={cls}>{status.replace(/_/g, ' ')}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time fleet operations overview</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Vehicle Type:</span>
          <select className="select" style={{ width: '160px', padding: '6px 12px' }} value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
            <option value="">All Types</option>
            {kpis?.filterOptions?.vehicleTypes?.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status:</span>
          <select className="select" style={{ width: '160px', padding: '6px 12px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Region:</span>
          <select className="select" style={{ width: '160px', padding: '6px 12px' }} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All Regions</option>
            {kpis?.filterOptions?.regions?.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KPICard icon={<Truck size={22} />} label="Active Vehicles" value={kpis?.onTripVehicles || 0} subtitle="Currently on trip" color="info" />
        <KPICard icon={<Truck size={22} />} label="Available Vehicles" value={kpis?.availableVehicles || 0} subtitle="Ready for dispatch" color="success" />
        <KPICard icon={<Wrench size={22} />} label="In Maintenance" value={kpis?.inShopVehicles || 0} subtitle="Vehicles in shop" color="warning" />
        <KPICard icon={<MapPin size={22} />} label="Active Trips" value={kpis?.dispatchedTrips || 0} subtitle="Dispatched trips" color="info" />
        <KPICard icon={<Clock size={22} />} label="Pending Trips" value={kpis?.draftTrips || 0} subtitle="Draft / awaiting dispatch" color="warning" />
        <KPICard icon={<Users size={22} />} label="Drivers On Duty" value={kpis?.onTripDrivers || 0} subtitle={`of ${kpis?.totalDrivers || 0} total`} color="brand" />
        <KPICard icon={<BarChart3 size={22} />} label="Fleet Utilization" value={`${kpis?.fleetUtilization || 0}%`} subtitle="Active vehicle ratio" color="brand" />
      </div>

      {/* Charts + Recent Trips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Vehicle Status Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
            Vehicle Status Distribution
          </h3>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pieData.map((entry) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS],
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {entry.name}: <strong style={{ color: 'var(--color-text-primary)' }}>{entry.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No vehicle data available</p>
          )}
        </div>

        {/* Recent Trips */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
            Recent Trips
          </h3>
          {recentTrips.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.slice(0, 6).map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <span style={{ fontSize: '0.8rem' }}>
                          {trip.source} → {trip.destination}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {trip.vehicle.regNumber}
                      </td>
                      <td>{statusBadge(trip.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No trips yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
