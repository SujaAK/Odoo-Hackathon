import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vehicles', label: 'Vehicles', icon: Truck },
  { path: '/drivers', label: 'Drivers', icon: Users },
  { path: '/trips', label: 'Trips', icon: MapPin },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/fuel', label: 'Fuel & Expenses', icon: Fuel },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const roleLabels: Record<string, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        width: '260px',
        height: '100vh',
        background: 'var(--color-card)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Truck size={20} color="#000" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            TransitOps
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Transport Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems
            .filter(({ path }) => {
              if (!user) return false;
              if (user.role === 'FLEET_MANAGER') return true;
              if (path === '/dashboard' || path === '/settings') return true;
              // All roles can view vehicles and trips
              if (path === '/vehicles' || path === '/trips') return true;
              if (user.role === 'DRIVER') return path === '/fuel';
              if (user.role === 'SAFETY_OFFICER') return path === '/drivers' || path === '/maintenance';
              if (user.role === 'FINANCIAL_ANALYST') return path === '/fuel' || path === '/reports';
              return false;
            })
            .map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#000' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-brand)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                })}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
        </div>
      </nav>

      {/* User Info + Logout */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={18} color="#fbbf24" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              {roleLabels[user?.role || ''] || user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
