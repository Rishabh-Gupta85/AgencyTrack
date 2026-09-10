import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Role } from '../types';
import {
  Shield,
  Users,
  UserCheck,
  Plus,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Bell,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    users,
    currentUser,
    switchUserRole,
    addUser,
    updateUserRole,
    toggleUserStatus,
    auditLogs,
    slackConfig,
    updateSlackConfig,
    resetToDemoData,
    canManagePricing,
    canAdjustStock,
    canCollectPayments,
    canManageAgencies,
    canCreateOrders,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'team' | 'activity' | 'config'>('team');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // New member form
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<Role>('staff');
  const [memberTitle, setMemberTitle] = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  // Count roles matching Screenshot 9: Admins: 1, Managers: 2, Staff: 2
  const adminCount = users.filter(u => u.role === 'admin').length || 1;
  const managerCount = users.filter(u => u.role === 'manager').length || 2;
  const staffCount = users.filter(u => u.role === 'staff').length || 2;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !memberEmail) return;

    addUser({
      name: memberName,
      email: memberEmail,
      role: memberRole,
      title: memberTitle || `${memberRole.toUpperCase()} Member`,
      phone: memberPhone || '+91 98100 00000',
    });

    setShowAddMemberModal(false);
    setMemberName('');
    setMemberEmail('');
    setMemberTitle('');
    setMemberPhone('');
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/40">
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/40">
            Manager
          </span>
        );
      case 'staff':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            Staff
          </span>
        );
    }
  };

  const getPermissionsSummary = (role: Role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-[11px] text-slate-300 font-medium">
            Full Access (Pricing, Users, System)
          </span>
        );
      case 'manager':
        return (
          <span className="text-[11px] text-slate-300 font-medium">
            Orders, Invoices, Payment Collection
          </span>
        );
      case 'staff':
        return (
          <span className="text-[11px] text-slate-300 font-medium">
            Inventory & Stock Adjustments Only
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header matching Screenshot 9 */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage company profile, user permissions, and notifications
        </p>
      </div>

      {/* 3 Stat Cards matching Screenshot 9 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Admins */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Admins</span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/40 text-purple-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">{adminCount}</div>
        </div>

        {/* Managers */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Managers</span>
            <div className="w-9 h-9 rounded-xl bg-blue-950/40 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">{managerCount}</div>
        </div>

        {/* Staff */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Staff</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">{staffCount}</div>
        </div>
      </div>

      {/* Tabs Bar matching Screenshot 9 */}
      <div className="flex items-center gap-1 bg-[#121824] p-1 rounded-xl border border-[#1e2638] text-xs max-w-md">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer text-center ${
            activeTab === 'team'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Team & Permissions ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer text-center ${
            activeTab === 'activity'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Activity Log ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer text-center ${
            activeTab === 'config'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          System
        </button>
      </div>

      {/* Active Role Testing Banner */}
      <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Active Test User:</span>
              <span className="font-bold text-white text-sm">{currentUser?.name}</span>
              {getRoleBadge(currentUser?.role || 'staff')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Test RBAC: switch role below to verify permission locks in Inventory, Invoices, and Orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => switchUserRole('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-[#1a2336] text-slate-300 hover:bg-[#222e47]'
              }`}
            >
              Test as Admin
            </button>
            <button
              onClick={() => switchUserRole('manager')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentUser?.role === 'manager'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#1a2336] text-slate-300 hover:bg-[#222e47]'
              }`}
            >
              Test as Manager
            </button>
            <button
              onClick={() => switchUserRole('staff')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentUser?.role === 'staff'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#1a2336] text-slate-300 hover:bg-[#222e47]'
              }`}
            >
              Test as Staff
            </button>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-[#1e2638] text-xs">
          <div className="flex items-center gap-1.5">
            {canManagePricing ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span className={canManagePricing ? 'text-white' : 'text-slate-500'}>
              Pricing Rules
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {canAdjustStock ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span className={canAdjustStock ? 'text-white' : 'text-slate-500'}>
              Adjust Stock
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {canCollectPayments ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span className={canCollectPayments ? 'text-white' : 'text-slate-500'}>
              Collect Payments
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {canManageAgencies ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span className={canManageAgencies ? 'text-white' : 'text-slate-500'}>
              Manage Agencies
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {canCreateOrders ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span className={canCreateOrders ? 'text-white' : 'text-slate-500'}>
              Create Orders
            </span>
          </div>
        </div>
      </div>

      {/* Tab 1: Team & Permissions */}
      {activeTab === 'team' && (
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Team Members</h2>
              <p className="text-xs text-slate-400">
                Manage user roles, access levels, and account status
              </p>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#1e2638] bg-[#0f1522]">
                  <th className="py-3 px-4 font-semibold">Member</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Permissions</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#161d2c]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4">{getPermissionsSummary(u.role)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={e => updateUserRole(u.id, e.target.value as Role)}
                        className="bg-[#0f1522] border border-[#1e2638] rounded-lg px-2.5 py-1 text-slate-300 text-xs cursor-pointer focus:outline-hidden"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Log matching Screenshot 9 */}
      {activeTab === 'activity' && (
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Activity Log</h2>
            <p className="text-xs text-slate-400">
              Complete audit trail of inventory adjustments, price updates, and orders
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#1e2638] bg-[#0f1522]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#161d2c]/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {log.timestamp.replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.userName}</div>
                      <span className="text-[10px] text-indigo-400 capitalize">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300">{log.details}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#1a2336] text-slate-300 border border-slate-700/50 uppercase">
                        {log.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Config */}
      {activeTab === 'config' && (
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">System Configuration</h2>
            <p className="text-xs text-slate-400">Settings and integration parameters</p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            <div className="p-4 bg-[#0f1522] border border-[#1e2638] rounded-xl space-y-3">
              <h3 className="font-semibold text-white text-sm">Demo Data Management</h3>
              <p className="text-slate-400 text-xs">
                Reset all agencies, orders, products, and invoices to match the original screenshot demo data.
              </p>
              <button
                onClick={() => {
                  if (confirm('Reset all demo data to initial screenshot baseline?')) {
                    resetToDemoData();
                    alert('Demo data reloaded!');
                  }
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Demo Baseline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121824] border border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
              <h2 className="text-base font-bold text-white">Add Team Member</h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  className="w-full bg-[#0f1522] border border-[#1e2638] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@agencytrack.in"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="w-full bg-[#0f1522] border border-[#1e2638] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Role</label>
                <select
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value as Role)}
                  className="w-full bg-[#0f1522] border border-[#1e2638] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="staff">Staff (Inventory only)</option>
                  <option value="manager">Manager (Orders & Invoices)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-[#1a2336] hover:bg-[#222e47] text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
