'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, CheckCircle2, AlertTriangle, XCircle, Users, 
  Calendar, MapPin, RefreshCw, ArrowRight, ShieldCheck,
  Camera, Zap
} from 'lucide-react';
import { checkInTicketAction, getDoorStatsAction, getRecentCheckInsAction } from '@/server/actions/door';
import { QrScannerModal } from '@/components/door/qr-scanner-modal';

interface EventItem {
  id: string;
  title: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: string;
}

interface CheckInLog {
  id: string;
  holderName: string;
  priceType: string;
  code: string;
  checkedInAt: string;
  checkedInByName: string | null;
  eventTitle?: string | null;
}

interface DoorCheckInViewProps {
  initialEventId?: string;
  lockToEvent?: boolean;
}

export function DoorCheckInView({ initialEventId, lockToEvent = false }: DoorCheckInViewProps) {
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || 'auto');
  const [inputCode, setInputCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [autoSwitchEvents, setAutoSwitchEvents] = useState(!lockToEvent);
  const [stats, setStats] = useState<{ checkedIn: number; total: number; percentage: number } | null>(null);
  const [recentLogs, setRecentLogs] = useState<CheckInLog[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    details?: string;
    wrongEventData?: {
      actualEventId: string;
      actualEventTitle: string;
      code: string;
    };
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load events list on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await fetch('/api/events/list-all');
        if (res.ok) {
          const list: EventItem[] = await res.json();
          setEventsList(list);
          
          if (initialEventId && list.some((e) => e.id === initialEventId)) {
            setSelectedEventId(initialEventId);
          } else if (!initialEventId && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const queryEventId = urlParams.get('eventId');
            if (queryEventId && list.some((e) => e.id === queryEventId)) {
              setSelectedEventId(queryEventId);
            } else if (list.length > 0) {
              const published = list.find((e) => e.status === 'published');
              setSelectedEventId(published ? published.id : list[0].id);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load events:', e);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [initialEventId]);

  // When selected event changes, load stats and logs
  const loadEventData = async (eventId: string) => {
    try {
      const [s, logs] = await Promise.all([
        getDoorStatsAction(eventId),
        getRecentCheckInsAction(eventId),
      ]);
      setStats(s);
      setRecentLogs(logs as CheckInLog[]);
    } catch (e) {
      console.error('Error fetching event check-in data:', e);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadEventData(selectedEventId);
      inputRef.current?.focus();
    }
  }, [selectedEventId]);

  const handleCheckIn = async (codeToVerify?: string, overrideEventId?: string) => {
    const raw = typeof codeToVerify === 'string' ? codeToVerify : inputCode;
    const codeToSubmit = raw.trim();
    const eventIdToUse = overrideEventId || selectedEventId;

    if (!codeToSubmit) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      
      const res = await checkInTicketAction(eventIdToUse, codeToSubmit, {
        autoSwitch: autoSwitchEvents,
      });

      if (res.ok) {
        let details = `Ticket code: ${res.code} • ${res.priceType?.toUpperCase()} Pass`;
        
        // If ticket was auto-switched to a different event
        if (res.switchedEvent) {
          details += ` • Auto-switched to "${res.switchedEvent.title}"`;
          setSelectedEventId(res.switchedEvent.id);
          await loadEventData(res.switchedEvent.id);
        } else {
          await loadEventData(eventIdToUse);
        }

        setFeedback({
          type: 'success',
          title: `Checked In: ${res.holderName}`,
          details,
        });
        setInputCode('');
      } else {
        const fail = res as any;
        if (fail.reason === 'ALREADY_CHECKED_IN') {
          const formattedTime = fail.checkedInAt
            ? new Date(fail.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : 'earlier';
          setFeedback({
            type: 'warning',
            title: `Already Checked In: ${fail.holderName || 'Attendee'}`,
            details: `Scanned at ${formattedTime} by ${fail.checkedInBy || 'Door Staff'} (Code: ${fail.code || ''})`,
          });
        } else if (fail.reason === 'TICKET_NOT_FOUND') {
          setFeedback({
            type: 'error',
            title: 'Ticket Not Found',
            details: 'No valid ticket matches this 8-character code, UUID, or QR payload.',
          });
        } else if (fail.reason === 'WRONG_EVENT') {
          setFeedback({
            type: 'warning',
            title: `Ticket is for: ${fail.actualEventTitle || 'Another Event'}`,
            details: `Ticket ${fail.code || ''} (${fail.holderName || 'guest'}) is registered for a different event.`,
            wrongEventData: {
              actualEventId: fail.actualEventId || '',
              actualEventTitle: fail.actualEventTitle || 'this event',
              code: fail.code || codeToSubmit,
            },
          });
        } else if (fail.reason === 'FORBIDDEN_EVENT') {
          setFeedback({
            type: 'error',
            title: 'No Door Access',
            details: fail.message || 'You do not have door staff privileges for this event.',
          });
        } else if (fail.reason === 'REFUNDED' || fail.reason === 'VOID') {
          setFeedback({
            type: 'error',
            title: `Ticket ${fail.reason}`,
            details: `Ticket for ${fail.holderName || 'guest'} is ${fail.reason?.toLowerCase()} and cannot be used for entry.`,
          });
        } else {
          setFeedback({
            type: 'error',
            title: 'Check-in Rejected',
            details: fail.reason || 'Verification failed.',
          });
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Error during check-in',
        details: err.message || 'Network error occurred.',
      });
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const currentEvent = eventsList.find((ev) => ev.id === selectedEventId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <QrCode className="w-8 h-8 text-primary" />
            Door Check-In & Scanner
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Scan attendee QR codes via live camera or enter 8-character ticket codes to check guests in instantly.
          </p>
        </div>

        {/* Quick Launch Camera Button in Header */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setScannerModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Open Camera Scanner</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading events...</p>
        </div>
      ) : eventsList.length === 0 ? (
        <Card className="rounded-2xl border border-border shadow-sm p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold text-foreground">No events found</h2>
          <p className="text-muted-foreground mt-1">Create and publish an event first to enable door check-in.</p>
        </Card>
      ) : (
        <>
          {/* Controls Bar: Event Selector & Auto-Switch Option */}
          {!lockToEvent && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Active Event:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="border border-border bg-card text-foreground px-3.5 py-2 rounded-xl text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[240px]"
                >
                  <option value="auto">⚡ Any Event (Auto-Detect from Ticket)</option>
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({new Date(ev.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}) — {ev.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSwitchEvents}
                  onChange={(e) => setAutoSwitchEvents(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Auto-switch to matching event
                </span>
              </label>
            </div>
          )}

          {/* Live Attendance Progress Card */}
          <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-gradient-to-r from-card via-card to-primary/5">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[10px] tracking-wider">
                      {currentEvent ? currentEvent.status : 'GLOBAL ATTENDANCE'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {currentEvent ? currentEvent.venue : 'All Venues'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {currentEvent ? currentEvent.title : 'All Active Club Events'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {currentEvent ? (
                      `Starts: ${new Date(currentEvent.startsAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                    ) : (
                      'Tracking live attendance across all events'
                    )}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end justify-center bg-muted/40 sm:bg-transparent p-4 sm:p-0 rounded-xl">
                  <div className="text-3xl font-extrabold text-foreground flex items-baseline gap-1">
                    <span className="text-primary">{stats?.checkedIn ?? 0}</span>
                    <span className="text-lg text-muted-foreground font-normal">/ {stats?.total ?? 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    {stats?.percentage ?? 0}% Checked In
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-3 mt-6 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, stats?.percentage ?? 0)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scanner & Manual Input Form */}
          <Card className="rounded-2xl border-2 border-primary/20 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Scan or Enter Ticket
                </span>
                <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                  Camera + Manual Entry
                </Badge>
              </CardTitle>
              <CardDescription>
                Click &quot;Camera&quot; to scan with your phone/webcam, or enter the attendee&apos;s 8-character ticket code.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Enter code (e.g. 84485FD0) or scan QR"
                    className="h-12 px-4 pr-12 text-base font-mono rounded-xl border-border bg-input flex-1 focus:ring-2 focus:ring-primary uppercase"
                    autoFocus
                    disabled={submitting}
                  />
                  {/* Inline camera button inside input on mobile/desktop */}
                  <button
                    type="button"
                    onClick={() => setScannerModalOpen(true)}
                    title="Open Camera Scanner"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScannerModalOpen(true)}
                    className="h-12 px-4 rounded-xl border-border hover:bg-muted font-semibold flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Camera</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={submitting || !inputCode.trim()}
                    className="h-12 px-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm text-base flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        Check In <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : feedback.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  {feedback.type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
                  {feedback.type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
                  {feedback.type === 'error' && <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <h4 className="font-bold text-base leading-tight">{feedback.title}</h4>
                    {feedback.details && <p className="text-sm opacity-90 mt-0.5 font-medium">{feedback.details}</p>}

                    {/* Quick Switch Button if ticket was for a different event */}
                    {feedback.wrongEventData && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedEventId(feedback.wrongEventData!.actualEventId);
                            handleCheckIn(feedback.wrongEventData!.code, feedback.wrongEventData!.actualEventId);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg"
                        >
                          Switch to &quot;{feedback.wrongEventData.actualEventTitle}&quot; and Check In
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Check-In History Feed */}
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Recent Check-Ins
                </CardTitle>
                <CardDescription>Live log of attendees scanned into this event.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadEventData(selectedEventId)}
                className="rounded-lg text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
              </Button>
            </CardHeader>

            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No attendees checked in yet for this event.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Attendee Name</th>
                        <th className="py-3 px-4">Ticket Type</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Event</th>
                        <th className="py-3 px-4">Checked In At</th>
                        <th className="py-3 px-4">Staff Member</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            {log.holderName}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="text-xs uppercase font-medium">
                              {log.priceType}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{log.code}</td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground font-medium">
                            {log.eventTitle || 'Event'}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {new Date(log.checkedInAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">{log.checkedInByName || 'Staff'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Live Camera Scanner Modal */}
      <QrScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScan={(decodedText) => {
          handleCheckIn(decodedText);
        }}
        isProcessing={submitting}
      />
    </div>
  );
}
