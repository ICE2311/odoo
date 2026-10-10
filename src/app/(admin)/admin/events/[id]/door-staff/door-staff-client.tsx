'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  UserCheck,
  Shield,
  QrCode,
  Award,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Search,
  Plus,
} from 'lucide-react';
import { addEventDoorStaffAction, revokeEventDoorStaffAction } from '@/server/actions/admin-door-staff';

interface DoorStaffRecord {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  phone: string | null;
  studentId: string | null;
  grantedAt: string;
  revokedAt: string | null;
  isMember: boolean;
}

interface CandidateUser {
  id: string;
  name: string | null;
  email: string;
  isMember: boolean;
  studentId: string | null;
}

export function DoorStaffClient({
  event,
  initialStaff,
  candidateUsers,
}: {
  event: { id: string; title: string; startsAt: string; venue: string; status: string };
  initialStaff: DoorStaffRecord[];
  candidateUsers: CandidateUser[];
}) {
  const [staffList, setStaffList] = useState<DoorStaffRecord[]>(initialStaff);
  const [selectedUserId, setSelectedUserId] = useState(candidateUsers[0]?.id || '');
  const [searchCandidate, setSearchCandidate] = useState('');
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const activeStaff = staffList.filter((s) => !s.revokedAt);
  const revokedStaff = staffList.filter((s) => !!s.revokedAt);

  const handleGrant = (userId: string) => {
    if (!userId) return;
    setStatusMsg(null);

    startTransition(async () => {
      try {
        const res = await addEventDoorStaffAction(event.id, userId);
        const candidate = candidateUsers.find((c) => c.id === userId);

        setStaffList((prev) => {
          const existing = prev.find((s) => s.userId === userId);
          if (existing) {
            return prev.map((s) =>
              s.id === existing.id
                ? { ...s, revokedAt: null, grantedAt: new Date().toISOString() }
                : s
            );
          }
          return [
            ...prev,
            {
              id: res.staffId,
              userId,
              userName: candidate?.name || 'User',
              userEmail: candidate?.email || '',
              phone: null,
              studentId: candidate?.studentId || null,
              grantedAt: new Date().toISOString(),
              revokedAt: null,
              isMember: candidate?.isMember || false,
            },
          ];
        });

        setStatusMsg({ text: `Granted door staff access to ${candidate?.name || candidate?.email}!` });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to grant door staff role', error: true });
      }
    });
  };

  const handleRevoke = (staffId: string, name: string) => {
    setStatusMsg(null);

    startTransition(async () => {
      try {
        await revokeEventDoorStaffAction(staffId);
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, revokedAt: new Date().toISOString() } : s))
        );
        setStatusMsg({ text: `Revoked door staff role for ${name}.` });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to revoke door staff', error: true });
      }
    });
  };

  const filteredCandidates = candidateUsers.filter((c) => {
    const q = searchCandidate.toLowerCase();
    const alreadyActive = activeStaff.some((s) => s.userId === c.id);
    if (alreadyActive) return false;
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.studentId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href={`/admin/events/${event.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-600" /> Door Staff: {event.title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Assign active members temporary door staff privileges to scan attendee tickets at {event.venue}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/check-in?eventId=${event.id}`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-[var(--radius-md)] text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <QrCode className="w-4 h-4" /> Open Check-In Scanner
          </Link>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-[var(--radius-md)] text-xs font-medium flex items-center gap-2 ${
            statusMsg.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-success/10 text-success border border-success/20'
          }`}
        >
          {statusMsg.error ? (
            <XCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grant New Door Staff Card */}
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Assign Temporary Door Staff Role
        </h2>
        <p className="text-xs text-muted-foreground">
          Assigned door staff can access the event door scanner and check in tickets. Only active members are eligible.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchCandidate}
              onChange={(e) => setSearchCandidate(e.target.value)}
              placeholder="Search active members by name or email..."
              className="w-full pl-9 pr-3 py-2 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-2 focus:ring-primary"
          >
            {filteredCandidates.length === 0 ? (
              <option value="">No matching members found</option>
            ) : (
              filteredCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || 'Unnamed'} ({c.email}) {c.isMember ? '✓ Member' : ''}
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => handleGrant(selectedUserId)}
            disabled={isPending || !selectedUserId || filteredCandidates.length === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-md)] text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs flex items-center justify-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5" /> Grant Door Access
          </button>
        </div>
      </div>

      {/* Active Door Staff List */}
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-success" /> Active Door Staff ({activeStaff.length})
          </h2>
          <span className="text-xs text-muted-foreground">Authorized to scan tickets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted border-b text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Staff Member</th>
                <th className="px-6 py-3">Membership</th>
                <th className="px-6 py-3">Granted At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-muted/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{staff.userName || 'Unnamed'}</div>
                    <div className="text-xs text-muted-foreground">{staff.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    {staff.isMember ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-md)] text-xs font-medium bg-success/10 text-success">
                        <UserCheck className="w-3 h-3" /> Active Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-md)] text-xs text-muted-foreground bg-muted">
                        Non-member
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(staff.grantedAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRevoke(staff.id, staff.userName || staff.userEmail)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-[var(--radius-md)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revoke Access
                    </button>
                  </td>
                </tr>
              ))}

              {activeStaff.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-xs">
                    No door staff assigned yet. Select an active member above to grant access.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoked Door Staff History */}
      {revokedStaff.length > 0 && (
        <div className="bg-card border rounded-[var(--radius-xl)] shadow-xs overflow-hidden opacity-90">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
            <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Revoked Staff ({revokedStaff.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted border-b text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Revoked At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revokedStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-medium text-foreground">{staff.userName || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">{staff.userEmail}</div>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {staff.revokedAt ? new Date(staff.revokedAt).toLocaleString('en-IN') : 'Revoked'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleGrant(staff.userId)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-[var(--radius-md)] transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Re-grant Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

