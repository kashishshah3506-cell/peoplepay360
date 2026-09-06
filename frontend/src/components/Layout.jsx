import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, CalendarClock, Clock, Palmtree, Wallet, LogOut,
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Contracts', path: '/contracts', icon: FileText },
    { label: 'Schedules', path: '/schedules', icon: CalendarClock },
    { label: 'Attendance', path: '/attendance', icon: Clock },
    { label: 'Time Off', path: '/time-off', icon: Palmtree },
    { label: 'Payroll', path: '/payroll', icon: Wallet },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-slate-700">PeoplePay360</div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded mb-1 text-sm transition-colors ${
                  isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700 text-sm">
          <div className="mb-3">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-slate-400">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 rounded py-1.5 text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;