import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Map,
  GraduationCap,
  GitCompareArrows,
  Trophy,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mapa', icon: Map, label: 'Mapa' },
  { to: '/universidades', icon: GraduationCap, label: 'Universidades' },
  { to: '/comparador', icon: GitCompareArrows, label: 'Comparador' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/cenarios', icon: Calculator, label: 'Cenários' },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-emerald-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-emerald-100
          transition-all duration-300 shadow-lg lg:shadow-none
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
          ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-100">
          <div className="flex-shrink-0 w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-emerald-800 text-sm leading-tight" style={{ fontWeight: 700 }}>
                MobiMap
              </div>
              <div className="text-emerald-500 text-xs leading-tight">STEM</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
                  ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }
                `}
              >
                <Icon
                  className={`flex-shrink-0 w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`}
                />
                {!collapsed && (
                  <span className="text-sm truncate">{label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex px-2 py-3 border-t border-emerald-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="ml-2 text-xs">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-emerald-100 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-50"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-emerald-800 text-sm" style={{ fontWeight: 700 }}>
              MobiMap STEM
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}