
import React from 'react';
import { UserRole } from '../types';

interface RoleHeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout?: () => void;
}

const RoleHeader: React.FC<RoleHeaderProps> = ({ currentRole, onRoleChange, onLogout }) => {
  const roles = [
    { value: UserRole.CUSTOMER, label: '顾客 (下单端)', icon: 'fa-user' },
    { value: UserRole.PICKER, label: '仓管 (备货端)', icon: 'fa-box' },
    { value: UserRole.CASHIER, label: '收银 (全能端)', icon: 'fa-cash-register' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <i className="fas fa-store text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">智联仓储</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Store Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => onRoleChange(r.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentRole === r.value
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className={`fas ${r.icon} ${currentRole === r.value ? 'text-indigo-600' : 'text-slate-400'}`}></i>
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            ))}
          </div>
          
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="退出管理"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default RoleHeader;
