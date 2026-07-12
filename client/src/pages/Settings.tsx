import { Shield, Check, X } from 'lucide-react';

interface PermissionRow {
  module: string;
  manager: 'FULL' | 'VIEW' | 'NONE';
  officer: 'FULL' | 'VIEW' | 'NONE';
  analyst: 'FULL' | 'VIEW' | 'NONE';
  driver: 'FULL' | 'VIEW' | 'NONE';
}

const matrix: PermissionRow[] = [
  { module: 'Dashboard & KPI Summary', manager: 'FULL', officer: 'VIEW', analyst: 'VIEW', driver: 'VIEW' },
  { module: 'Vehicle Management (CRUD)', manager: 'FULL', officer: 'VIEW', analyst: 'NONE', driver: 'NONE' },
  { module: 'Driver Profile & Licencing', manager: 'FULL', officer: 'FULL', analyst: 'NONE', driver: 'NONE' },
  { module: 'Safety score updates', manager: 'FULL', officer: 'FULL', analyst: 'NONE', driver: 'NONE' },
  { module: 'Trip Planning & Dispatch', manager: 'FULL', officer: 'NONE', analyst: 'NONE', driver: 'FULL' },
  { module: 'Maintenance Job logging', manager: 'FULL', officer: 'NONE', analyst: 'NONE', driver: 'NONE' },
  { module: 'Fuel & Expense Records', manager: 'FULL', officer: 'NONE', analyst: 'FULL', driver: 'NONE' },
  { module: 'Financial Analytics & CSV', manager: 'FULL', officer: 'NONE', analyst: 'FULL', driver: 'NONE' },
  { module: 'System Access settings (RBAC)', manager: 'FULL', officer: 'NONE', analyst: 'NONE', driver: 'NONE' },
];

export default function Settings() {
  const cellRender = (level: 'FULL' | 'VIEW' | 'NONE') => {
    switch (level) {
      case 'FULL':
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', background: 'rgba(34, 197, 94, 0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            <Check size={12} /> Full Control
          </div>
        );
      case 'VIEW':
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-info)', background: 'rgba(59, 130, 246, 0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            <Check size={12} /> View Only
          </div>
        );
      case 'NONE':
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            <X size={12} /> Restrict
          </div>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Authorization Matrix</h1>
          <p className="page-subtitle">View active role-based access control (RBAC) levels for the organization</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '8px', borderRadius: '8px', color: 'var(--color-brand)' }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>System Authorization Table</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>These policies are enforced server-side automatically via token attributes.</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operation / Resource</th>
                <th>Fleet Manager</th>
                <th>Safety Officer</th>
                <th>Financial Analyst</th>
                <th>Driver</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 550 }}>{row.module}</td>
                  <td>{cellRender(row.manager)}</td>
                  <td>{cellRender(row.officer)}</td>
                  <td>{cellRender(row.analyst)}</td>
                  <td>{cellRender(row.driver)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
