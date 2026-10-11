'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Calendar,
  X,
  Plus,
  Sparkles,
  Award,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  updateUserDetails,
  grantManualMembership,
  assignDoorStaffRole,
  revokeDoorStaffRole,
  deleteUserAction,
} from '@/server/actions/admin-users';

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  studentId: string | null;
  college: string | null;
  role: 'user' | 'admin' | 'treasurer';
  emailOptIn: boolean;
  createdAt: Date;
  activeMembership: {
    id: string;
    startsAt: string;
    endsAt: string;
  } | null;
  doorAssignments: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    startsAt: string | null;
  }>;
}

interface UpcomingEvent {
  id: string;
  title: string;
  startsAt: string;
  status: string;
}

export function UsersClient({
  initialUsers,
  upcomingEvents,
}: {
  initialUsers: UserRecord[];
  upcomingEvents: UpcomingEvent[];
}) {
  const [usersList, setUsersList] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'treasurer' | 'member' | 'non-member' | 'door-staff'>('all');
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Modal form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [formRole, setFormRole] = useState<'user' | 'admin' | 'treasurer'>('user');
  const [formEmailOptIn, setFormEmailOptIn] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setFormName(u.name || '');
    setFormEmail(u.email);
    setFormPhone(u.phone || '');
    setFormStudentId(u.studentId || '');
    setFormCollege(u.college || '');
    setFormRole(u.role);
    setFormEmailOptIn(u.emailOptIn);
    setSelectedEventId(upcomingEvents[0]?.id || '');
    setStatusMessage(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setStatusMessage(null);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingUser) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingUser]);

  const handleDeleteUser = (u: UserRecord) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${u.name || u.email}"? This cannot be undone.`)) return;

    setStatusMessage(null);
    startTransition(async () => {
      try {
        const res = await deleteUserAction(u.id);
        setUsersList((prev) => prev.filter((item) => item.id !== u.id));
        if (editingUser?.id === u.id) {
          setEditingUser(null);
        }
        setStatusMessage({ text: res.message });
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Failed to delete user', error: true });
      }
    });
  };


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setStatusMessage(null);

    startTransition(async () => {
      try {
        await updateUserDetails(editingUser.id, {
          name: formName,
          email: formEmail,
          phone: formPhone || null,
          studentId: formStudentId || null,
          college: formCollege || null,
          emailOptIn: formEmailOptIn,
          role: formRole,
        });

        // Update local state
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  name: formName,
                  email: formEmail,
                  phone: formPhone || null,
                  studentId: formStudentId || null,
                  college: formCollege || null,
                  emailOptIn: formEmailOptIn,
                  role: formRole,
                }
              : u
          )
        );

        setEditingUser((prev) =>
          prev
            ? {
                ...prev,
                name: formName,
                email: formEmail,
                phone: formPhone || null,
                studentId: formStudentId || null,
                college: formCollege || null,
                emailOptIn: formEmailOptIn,
                role: formRole,
              }
            : null
        );

        setStatusMessage({ text: 'User details saved successfully!' });
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Failed to update user', error: true });
      }
    });
  };

  const handleGrantMembership = async () => {
    if (!editingUser) return;
    setStatusMessage(null);

    startTransition(async () => {
      try {
        const res = await grantManualMembership(editingUser.id, 365);
        const newExpiry = new Date(res.endsAt).toISOString();

        setUsersList((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  activeMembership: {
                    id: 'new',
                    startsAt: new Date().toISOString(),
                    endsAt: newExpiry,
                  },
                }
              : u
          )
        );

        setEditingUser((prev) =>
          prev
            ? {
                ...prev,
                activeMembership: {
                  id: 'new',
                  startsAt: new Date().toISOString(),
                  endsAt: newExpiry,
                },
              }
            : null
        );

        setStatusMessage({ text: 'Active 1-Year Membership granted!' });
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Failed to grant membership', error: true });
      }
    });
  };

  const handleAssignDoorStaff = async () => {
    if (!editingUser || !selectedEventId) return;
    setStatusMessage(null);

    startTransition(async () => {
      try {
        const res = await assignDoorStaffRole(editingUser.id, selectedEventId);
        const ev = upcomingEvents.find((e) => e.id === selectedEventId);

        const newAssignment = {
          id: res.staffId,
          eventId: selectedEventId,
          eventTitle: ev?.title || 'Event',
          startsAt: ev?.startsAt || null,
        };

        setUsersList((prev) =>
          prev.map((u) => {
            if (u.id !== editingUser.id) return u;
            const filtered = u.doorAssignments.filter((d) => d.eventId !== selectedEventId);
            return {
              ...u,
              doorAssignments: [...filtered, newAssignment],
            };
          })
        );

        setEditingUser((prev) => {
          if (!prev) return null;
          const filtered = prev.doorAssignments.filter((d) => d.eventId !== selectedEventId);
          return {
            ...prev,
            doorAssignments: [...filtered, newAssignment],
          };
        });

        setStatusMessage({ text: `Granted temporary Door Staff role for ${ev?.title}!` });
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Failed to assign door staff', error: true });
      }
    });
  };

  const handleRevokeDoorStaff = async (staffId: string) => {
    if (!editingUser) return;
    setStatusMessage(null);

    startTransition(async () => {
      try {
        await revokeDoorStaffRole(staffId);

        setUsersList((prev) =>
          prev.map((u) => {
            if (u.id !== editingUser.id) return u;
            return {
              ...u,
              doorAssignments: u.doorAssignments.filter((d) => d.id !== staffId),
            };
          })
        );

        setEditingUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            doorAssignments: prev.doorAssignments.filter((d) => d.id !== staffId),
          };
        });

        setStatusMessage({ text: 'Door Staff role revoked.' });
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Failed to revoke door staff', error: true });
      }
    });
  };

  // Filter and search
  const filteredUsers = usersList.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.studentId?.toLowerCase().includes(q) ||
      u.college?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filter === 'admin') return u.role === 'admin';
    if (filter === 'treasurer') return u.role === 'treasurer';
    if (filter === 'member') return !!u.activeMembership;
    if (filter === 'non-member') return !u.activeMembership && u.role !== 'admin' && u.role !== 'treasurer';
    if (filter === 'door-staff') return u.doorAssignments.length > 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Users & Members</h1>
          <p className="text-muted-foreground text-sm">
            Manage registered users, member status, admin privileges, and temporary door roles.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-[var(--radius-lg)] border text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Users ({usersList.length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              filter === 'admin'
                ? 'bg-card text-primary font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Admins ({usersList.filter((u) => u.role === 'admin').length})
          </button>
          <button
            onClick={() => setFilter('treasurer')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              filter === 'treasurer'
                ? 'bg-card text-emerald-600 font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Treasurers ({usersList.filter((u) => u.role === 'treasurer').length})
          </button>
          <button
            onClick={() => setFilter('member')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              filter === 'member'
                ? 'bg-card text-success font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Members ({usersList.filter((u) => !!u.activeMembership).length})
          </button>
          <button
            onClick={() => setFilter('door-staff')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] transition-colors whitespace-nowrap ${
              filter === 'door-staff'
                ? 'bg-card text-accent font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Door Staff ({usersList.filter((u) => u.doorAssignments.length > 0).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, student ID..."
            className="w-full pl-9 pr-4 py-2 border rounded-[var(--radius-md)] bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-xs"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">User</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Contact & College</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Role & Status</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Temporary Roles</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {user.name || 'Unnamed User'}
                          {user.role === 'admin' && (
                            <span title="Administrator">
                              <Shield className="w-3.5 h-3.5 text-primary" />
                            </span>
                          )}
                          {user.role === 'treasurer' && (
                            <span title="Treasurer">
                              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-xs text-foreground">
                      {user.phone ? <span>📞 {user.phone}</span> : <span className="text-muted-foreground italic">No phone</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {user.studentId ? `ID: ${user.studentId}` : ''}
                      {user.studentId && user.college ? ' • ' : ''}
                      {user.college || ''}
                    </div>
                  </td>

                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-md)] text-xs font-semibold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : user.role === 'treasurer'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {user.role === 'treasurer' && <Wallet className="w-3 h-3" />}
                        {user.role}
                      </span>

                      {user.activeMembership ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-md)] text-xs font-medium bg-success/10 text-success border border-success/20">
                          <UserCheck className="w-3 h-3" /> Member
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-md)] text-xs text-muted-foreground bg-muted/60">
                          Non-member
                        </span>
                      )}
                    </div>

                    {user.activeMembership && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Valid until{' '}
                        {new Date(user.activeMembership.endsAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {user.doorAssignments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.doorAssignments.map((da) => (
                          <span
                            key={da.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-md)] text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                            title={`Door Staff for ${da.eventTitle}`}
                          >
                            <Award className="w-3 h-3 text-amber-600" />
                            {da.eventTitle.slice(0, 18)}
                            {da.eventTitle.length > 18 ? '...' : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User & Role Modal */}
      {editingUser && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeEditModal}
        >
          <div 
            className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted">
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-primary" /> Edit User & Privileges
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{editingUser.email}</p>
              </div>
              <button
                onClick={closeEditModal}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-6">
              {statusMessage && (
                <div
                  className={`p-3 rounded-[var(--radius-md)] text-xs font-medium flex items-center gap-2 ${
                    statusMessage.error
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-success/10 text-success border border-success/20'
                  }`}
                >
                  {statusMessage.error ? (
                    <XCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Form for Profile & Role */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={formStudentId}
                      onChange={(e) => setFormStudentId(e.target.value)}
                      placeholder="e.g. 23BCE1001"
                      className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      College / Institution
                    </label>
                    <input
                      type="text"
                      value={formCollege}
                      onChange={(e) => setFormCollege(e.target.value)}
                      placeholder="e.g. School of Computer Engineering"
                      className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* System Role Selection */}
                <div className="pt-2 border-t">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    System Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                        formRole === 'user' ? 'border-primary bg-primary/5 font-semibold text-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value="user"
                        checked={formRole === 'user'}
                        onChange={() => setFormRole('user')}
                        className="text-primary"
                      />
                      <span>Regular User</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                        formRole === 'treasurer' ? 'border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value="treasurer"
                        checked={formRole === 'treasurer'}
                        onChange={() => setFormRole('treasurer')}
                        className="text-emerald-600"
                      />
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Treasurer
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2.5 border rounded-[var(--radius-md)] cursor-pointer text-xs ${
                        formRole === 'admin' ? 'border-primary bg-primary/5 font-semibold text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value="admin"
                        checked={formRole === 'admin'}
                        onChange={() => setFormRole('admin')}
                        className="text-primary"
                      />
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Administrator
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="emailOptIn"
                    checked={formEmailOptIn}
                    onChange={(e) => setFormEmailOptIn(e.target.checked)}
                    className="rounded-xs border-border"
                  />
                  <label htmlFor="emailOptIn" className="text-xs text-muted-foreground cursor-pointer">
                    Subscribed to email notifications & announcements
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving Profile...' : 'Save Profile & Role Changes'}
                </button>
              </form>

              {/* Membership Grant Section */}
              <div className="p-3 bg-muted border rounded-[var(--radius-lg)] space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Club Membership
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {editingUser.activeMembership ? (
                        <span className="text-success font-medium">
                          Active until{' '}
                          {new Date(editingUser.activeMembership.endsAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        'No active membership'
                      )}
                    </p>
                  </div>

                  <button
                    onClick={handleGrantMembership}
                    disabled={isPending}
                    className="px-2.5 py-1.5 bg-success text-white rounded-[var(--radius-md)] text-xs font-semibold hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {editingUser.activeMembership ? 'Extend 1 Year' : 'Grant 1-Year Membership'}
                  </button>
                </div>
              </div>

              {/* Temporary Role: Event Door Staff */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-[var(--radius-lg)] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-700" /> Temporary Role: Door Staff
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Grant this user door check-in scanner permissions for a specific event.
                  </p>
                </div>

                {/* Active Assignments */}
                {editingUser.doorAssignments.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-amber-900">Current Assignments:</span>
                    {editingUser.doorAssignments.map((da) => (
                      <div
                        key={da.id}
                        className="flex justify-between items-center p-2 bg-white border border-amber-200 rounded-[var(--radius-md)] text-xs"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{da.eventTitle}</div>
                          {da.startsAt && (
                            <div className="text-[11px] text-muted-foreground">
                              {new Date(da.startsAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRevokeDoorStaff(da.id)}
                          disabled={isPending}
                          className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded-xs text-xs font-medium transition-colors"
                        >
                          Revoke Role
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assign to another event */}
                {upcomingEvents.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-amber-300 rounded-[var(--radius-md)] text-xs bg-white outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {upcomingEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} ({new Date(ev.startsAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAssignDoorStaff}
                      disabled={isPending || !selectedEventId}
                      className="px-3 py-1.5 bg-amber-700 text-white rounded-[var(--radius-md)] text-xs font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Grant Role
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 italic">No upcoming events scheduled.</p>
                )}
              </div>

              {/* Danger Zone: Delete User */}
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-[var(--radius-lg)] space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-destructive flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Danger Zone
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Permanently delete this user account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(editingUser)}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-destructive text-white rounded-[var(--radius-md)] text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
