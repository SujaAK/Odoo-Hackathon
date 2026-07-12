import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Fuel, DollarSign, TrendingUp, FileDown } from 'lucide-react';
import api from '../lib/axios';
import KPICard from '../components/KPICard';
import { FuelEfficiencyReport, OperationalCostReport, VehicleROIReport } from '../types';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'efficiency' | 'cost' | 'roi' | 'utilization'>('efficiency');
  const [efficiencyData, setEfficiencyData] = useState<FuelEfficiencyReport[]>([]);
  const [costData, setCostData] = useState<OperationalCostReport[]>([]);
  const [roiData, setRoiData] = useState<VehicleROIReport[]>([]);
  const [utilizationData, setUtilizationData] = useState<{
    totalActive: number;
    onTrip: number;
    inShop: number;
    available: number;
    utilizationRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [effRes, costRes, roiRes, utilRes] = await Promise.all([
        api.get('/reports/fuel-efficiency'),
        api.get('/reports/operational-cost'),
        api.get('/reports/roi'),
        api.get('/reports/fleet-utilization'),
      ]);
      setEfficiencyData(effRes.data);
      setCostData(costRes.data);
      setRoiData(roiRes.data);
      setUtilizationData(utilRes.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = (reportType: string) => {
    window.open(`http://localhost:5000/api/export/${reportType}`, '_blank');
  };

  // Aggregated KPIs
  const avgEfficiency = efficiencyData.length > 0
    ? (efficiencyData.reduce((sum, item) => sum + item.efficiency, 0) / efficiencyData.length).toFixed(2)
    : '0.00';

  const totalCosts = costData.reduce((sum, item) => sum + item.totalCost, 0);
  const totalFuelCosts = costData.reduce((sum, item) => sum + item.fuelCost, 0);
  const totalMaintCosts = costData.reduce((sum, item) => sum + item.maintenanceCost, 0);

  const highestROI = roiData.length > 0
    ? [...roiData].sort((a, b) => b.roi - a.roi)[0]
    : null;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Track operational efficiency, maintenance costs, and capital metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => handleExportCSV('vehicles')}>
            <FileDown size={18} /> Export Fleet CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KPICard icon={<Fuel size={22} />} label="Average Fleet Efficiency" value={`${avgEfficiency} km/L`} subtitle="Distance per Liter" color="info" />
        <KPICard icon={<DollarSign size={22} />} label="Total Fuel Spend" value={`$${totalFuelCosts.toLocaleString()}`} subtitle="Aggregated fuel logs" color="warning" />
        <KPICard icon={<DollarSign size={22} />} label="Total Maintenance Spend" value={`$${totalMaintCosts.toLocaleString()}`} subtitle="Aggregated service logs" color="danger" />
        <KPICard icon={<TrendingUp size={22} />} label="Top Performing Asset" value={highestROI ? highestROI.regNumber : 'None'} subtitle={highestROI ? `ROI: ${highestROI.roi}%` : 'No ROI data'} color="success" />
      </div>

      {/* Reports Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'efficiency' ? 'tab-active' : ''}`} onClick={() => setActiveTab('efficiency')}>
          Fuel Efficiency
        </button>
        <button className={`tab ${activeTab === 'cost' ? 'tab-active' : ''}`} onClick={() => setActiveTab('cost')}>
          Operational Costs
        </button>
        <button className={`tab ${activeTab === 'roi' ? 'tab-active' : ''}`} onClick={() => setActiveTab('roi')}>
          Financial ROI
        </button>
        <button className={`tab ${activeTab === 'utilization' ? 'tab-active' : ''}`} onClick={() => setActiveTab('utilization')}>
          Fleet Utilization
        </button>
      </div>

      {/* Reports Chart Container */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Generating report dashboards...
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {activeTab === 'efficiency' && 'Fuel Efficiency (km/L) by Vehicle'}
                {activeTab === 'cost' && 'Cost Breakdown ($) by Vehicle'}
                {activeTab === 'roi' && 'Estimated ROI (%) by Vehicle'}
                {activeTab === 'utilization' && 'Active Fleet Utilization Rate'}
              </h3>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => {
                  const type = activeTab === 'efficiency' ? 'trips' : activeTab === 'cost' ? 'expenses' : activeTab === 'roi' ? 'vehicles' : 'vehicles';
                  handleExportCSV(type);
                }}
              >
                <FileDown size={14} /> Export CSV
              </button>
            </div>

            <div style={{ minHeight: '380px', width: '100%' }}>
              {activeTab === 'efficiency' && (
                efficiencyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="regNumber" stroke="var(--color-text-secondary)" />
                      <YAxis stroke="var(--color-text-secondary)" label={{ value: 'Efficiency (km/L)', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <Legend />
                      <Bar dataKey="efficiency" name="Efficiency (km/L)" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    No completed trip data found to compute fuel efficiency.
                  </div>
                )
              )}

              {activeTab === 'cost' && (
                costData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={costData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="regNumber" stroke="var(--color-text-secondary)" />
                      <YAxis stroke="var(--color-text-secondary)" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <Legend />
                      <Bar dataKey="fuelCost" name="Fuel Spend ($)" fill="var(--color-brand)" stackId="a" />
                      <Bar dataKey="maintenanceCost" name="Maintenance Spend ($)" fill="var(--color-danger)" stackId="a" />
                      <Bar dataKey="otherExpenses" name="Other Expenses ($)" fill="var(--color-info)" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    No expense or fuel log data available to build cost reports.
                  </div>
                )
              )}

              {activeTab === 'roi' && (
                roiData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={roiData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="regNumber" stroke="var(--color-text-secondary)" />
                      <YAxis stroke="var(--color-text-secondary)" label={{ value: 'Estimated ROI (%)', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-secondary)' } }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <Legend />
                      <Bar dataKey="roi" name="Return on Investment (%)" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    No financial data found to compute vehicle ROI metrics.
                  </div>
                )
              )}

              {activeTab === 'utilization' && (
                utilizationData ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center', padding: '12px 0' }}>
                    <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Fleet Composition & Active Allocations</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '16px', background: 'var(--color-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Total Active Fleet</span>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>{utilizationData.totalActive}</div>
                        </div>
                        <div style={{ padding: '16px', background: 'var(--color-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Available Vehicles</span>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>{utilizationData.available}</div>
                        </div>
                        <div style={{ padding: '16px', background: 'var(--color-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>On Trip (Active)</span>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-brand)', marginTop: '4px' }}>{utilizationData.onTrip}</div>
                        </div>
                        <div style={{ padding: '16px', background: 'var(--color-card)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>In Shop (Maintenance)</span>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>{utilizationData.inShop}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                      <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.01)', border: '10px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-brand)' }}>{utilizationData.utilizationRate}%</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '4px' }}>Utilization Rate</span>
                      </div>
                      <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '300px', lineHeight: 1.5 }}>
                        This metric represents the percentage of active (non-retired) vehicles currently dispatched on trips.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    No fleet utilization data found.
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
