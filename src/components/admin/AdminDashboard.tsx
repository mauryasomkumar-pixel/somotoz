import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Search,
  Activity,
  BarChart3,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  FileText,
  Clock,
  UserX,
  UserCheck,
  AlertOctagon,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MessageSquareOff,
  Database,
  KeyRound,
  EyeOff,
  Flame,
  ShieldAlert,
  Send,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  UserProfile,
  AdminActionLog,
  ManagedUser,
  AdminAnalytics,
  ViewMode,
  SomoReport,
  AttachedReportMessage,
} from '../../types';
import {
  verifyAdminStatusAsync,
  reauthenticateAdmin,
  claimAdminRoleAsync,
  fetchAdminAnalyticsData,
  fetchManagedUsers,
  executeUserModerationAction,
  fetchAdminReportsAsync,
  executeReportModerationAction,
  fetchAdminActionLogs,
  fetchFlaggedQueue,
  executeLegalExportAsync,
  triggerRetentionCleanupAsync,
  AdminReauthRequiredError,
} from '../../lib/adminService';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onNavigate: (view: ViewMode) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

type AdminTab = 'overview' | 'users' | 'reports' | 'flagged' | 'action_logs' | 'legal_export' | 'retention';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigate,
  onShowToast,
}) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isRecentAuth, setIsRecentAuth] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core Data States
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [reports, setReports] = useState<SomoReport[]>([]);
  const [actionLogs, setActionLogs] = useState<AdminActionLog[]>([]);
  const [flaggedQueue, setFlaggedQueue] = useState<{
    underageReports: SomoReport[];
    suspiciousUsers: any[];
  }>({ underageReports: [], suspiciousUsers: [] });

  // Filters & Search
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [reportReasonFilter, setReportReasonFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<SomoReport | null>(null);

  // Re-authentication Modal State (5-minute gate)
  const [showReauthModal, setShowReauthModal] = useState<boolean>(false);
  const [pendingActionToRetry, setPendingActionToRetry] = useState<(() => Promise<void>) | null>(null);
  const [isReauthenticating, setIsReauthenticating] = useState<boolean>(false);

  // Moderation Action Modal State (Mandatory Explanatory Note)
  const [actionModal, setActionModal] = useState<{
    type: 'user' | 'report';
    targetId: string;
    targetName: string;
    action: 'suspend' | 'unsuspend' | 'ban' | 'delete' | 'dismiss' | 'warn';
    title: string;
    description: string;
  } | null>(null);
  const [actionNote, setActionNote] = useState<string>('');
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Legal Request Export Form
  const [legalTargetUid, setLegalTargetUid] = useState<string>('');
  const [legalCaseRef, setLegalCaseRef] = useState<string>('');
  const [legalAuthority, setLegalAuthority] = useState<string>('');
  const [legalOrderDate, setLegalOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [legalNote, setLegalNote] = useState<string>('');
  const [isExportingLegal, setIsExportingLegal] = useState<boolean>(false);
  const [lastExportResult, setLastExportResult] = useState<any | null>(null);

  // Retention Cleanup State
  const [retentionNote, setRetentionNote] = useState<string>('Standard 90-day compliance retention cycle');
  const [isCleaningRetention, setIsCleaningRetention] = useState<boolean>(false);

  // Initial Auth & Admin Check
  useEffect(() => {
    let isMounted = true;
    verifyAdminStatusAsync().then((res) => {
      if (isMounted) {
        setIsAdmin(res.isAdmin);
        setIsRecentAuth(res.isRecentAuth);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Load Admin Data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, usersData, reportsData, logsData, flaggedData] = await Promise.all([
        fetchAdminAnalyticsData(),
        fetchManagedUsers(),
        fetchAdminReportsAsync(),
        fetchAdminActionLogs(),
        fetchFlaggedQueue(),
      ]);

      setAnalytics(analyticsData);
      setUsers(usersData);
      setReports(reportsData);
      setActionLogs(logsData);
      setFlaggedQueue(flaggedData);
    } catch (err: any) {
      console.warn('[Admin] Data loading error:', err);
      onShowToast('error', 'Sync Notice', err.message || 'Could not load administrative data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  // Handle Re-Authentication Flow
  const handlePerformReauth = async () => {
    setIsReauthenticating(true);
    try {
      const success = await reauthenticateAdmin();
      if (success) {
        setIsRecentAuth(true);
        setShowReauthModal(false);
        onShowToast('success', 'Identity Re-authenticated', 'Your 5-minute security window is now active.');
        if (pendingActionToRetry) {
          const action = pendingActionToRetry;
          setPendingActionToRetry(null);
          await action();
        }
      } else {
        onShowToast('error', 'Re-authentication Failed', 'Please verify your Google account credentials.');
      }
    } catch (err: any) {
      onShowToast('error', 'Verification Error', err.message || 'Could not re-authenticate.');
    } finally {
      setIsReauthenticating(false);
    }
  };

  // Safe wrapper for sensitive actions that checks recent auth
  const executeWithRecentAuth = async (actionFn: () => Promise<void>) => {
    try {
      await actionFn();
    } catch (err: any) {
      if (err instanceof AdminReauthRequiredError || (err.message && err.message.includes('Recent authentication required'))) {
        setPendingActionToRetry(() => actionFn);
        setShowReauthModal(true);
      } else {
        onShowToast('error', 'Action Failed', err.message || 'An error occurred.');
      }
    }
  };

  // Submit User or Report Moderation Action with Note
  const handleConfirmActionWithNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;

    if (!actionNote.trim() || actionNote.trim().length < 5) {
      onShowToast('error', 'Mandatory Note Required', 'Please provide an explanatory note of at least 5 characters.');
      return;
    }

    const { type, targetId, action } = actionModal;

    await executeWithRecentAuth(async () => {
      setIsExecutingAction(true);
      try {
        if (type === 'user') {
          await executeUserModerationAction(targetId, action as any, actionNote.trim());
          onShowToast('success', 'User Moderated', `User status updated to ${action}. Action logged.`);
        } else {
          await executeReportModerationAction(targetId, action as any, actionNote.trim());
          onShowToast('success', 'Report Resolved', `Report status marked as ${action}. Action logged.`);
          if (selectedReport && selectedReport.id === targetId) {
            setSelectedReport(null);
          }
        }
        setActionModal(null);
        setActionNote('');
        await loadDashboardData();
      } finally {
        setIsExecutingAction(false);
      }
    });
  };

  // Execute Legal Request Export
  const handleRunLegalExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalTargetUid.trim() || !legalCaseRef.trim() || !legalAuthority.trim()) {
      onShowToast('error', 'Missing Fields', 'Target UID, Case Reference, and Authority are all required.');
      return;
    }

    await executeWithRecentAuth(async () => {
      setIsExportingLegal(true);
      try {
        const result = await executeLegalExportAsync({
          targetUserId: legalTargetUid.trim(),
          caseReference: legalCaseRef.trim(),
          requestingAuthority: legalAuthority.trim(),
          orderDate: legalOrderDate,
          note: legalNote.trim(),
        });

        if (result.success && result.exportData) {
          setLastExportResult(result.exportData);
          onShowToast('success', 'Legal Export Generated', `Export ${result.exportData.exportId} created and logged.`);

          // Download JSON file directly to admin machine
          const blob = new Blob([JSON.stringify(result.exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `somotoz_legal_export_${legalCaseRef.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          await loadDashboardData();
        } else {
          onShowToast('error', 'Export Failed', result.error || 'Could not generate legal export.');
        }
      } finally {
        setIsExportingLegal(false);
      }
    });
  };

  // Trigger Manual Retention Cleanup
  const handleTriggerRetentionCleanup = async () => {
    if (!retentionNote.trim() || retentionNote.trim().length < 5) {
      onShowToast('error', 'Note Required', 'Please provide a note for the retention cleanup audit record.');
      return;
    }

    await executeWithRecentAuth(async () => {
      setIsCleaningRetention(true);
      try {
        const result = await triggerRetentionCleanupAsync(retentionNote.trim());
        onShowToast(
          'success',
          'Retention Cleanup Complete',
          `Purged ${result.deletedMessagesCount} soft-deleted messages & ${result.deletedAccountsCount} expired deletion requests (> ${result.retentionDays} days).`
        );
        await loadDashboardData();
      } catch (err: any) {
        onShowToast('error', 'Cleanup Failed', err.message || 'Could not execute retention cleanup.');
      } finally {
        setIsCleaningRetention(false);
      }
    });
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.uid.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(userSearchTerm.toLowerCase()));

      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, userSearchTerm, userStatusFilter]);

  // Filtered Reports List
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchStatus = reportStatusFilter === 'all' || r.status === reportStatusFilter;
      const matchReason = reportReasonFilter === 'all' || r.reason === reportReasonFilter;
      return matchStatus && matchReason;
    });
  }, [reports, reportStatusFilter, reportReasonFilter]);

  // Unauthorized State Screen
  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Administrative Access Restricted</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              This dashboard is strictly for user moderation and legal compliance. It requires a verified Firebase ID token with custom claim <code className="px-1.5 py-0.5 rounded bg-[var(--card-bg)] text-xs text-amber-500">admin: true</code> and a verified email address.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-left text-xs space-y-2 text-[var(--text-secondary)]">
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Current Identity</span>
            </div>
            <p>UID: <code className="text-[var(--text-primary)]">{currentUser.uid}</code></p>
            <p>Email: <code className="text-[var(--text-primary)]">{currentUser.email || 'None'}</code></p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const res = await claimAdminRoleAsync();
                  onShowToast('success', 'Claim Registered', res.message);
                  const check = await verifyAdminStatusAsync();
                  setIsAdmin(check.isAdmin);
                } catch (err: any) {
                  onShowToast('error', 'Bootstrap Failed', err.message || 'Unauthorized');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition"
            >
              Bootstrap Admin Privileges
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition text-sm"
            >
              Return to Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 space-y-6">
      {/* Top Header Bar */}
      <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  Somotoz Moderation & Compliance Suite
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                    Verified Admin Claim
                  </span>
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  Zero-chat-browsing architecture • Legal request export • 5-minute authentication gate
                </p>
              </div>
            </div>
          </div>

          {/* Action Header Items */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
              isRecentAuth
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {isRecentAuth ? '5m Reauth Active' : 'Reauth Required for Actions'}
            </div>

            <button
              onClick={() => setShowReauthModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-emerald-500/40 text-xs font-medium text-[var(--text-primary)] transition flex items-center gap-1.5"
              title="Refresh your 5-minute authorization window"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
              Re-authenticate
            </button>

            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--surface-color)] text-[var(--text-secondary)] transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--border-color)]">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users, badge: users.length },
            { id: 'reports', label: 'Reports', icon: ShieldAlert, badge: reports.filter((r) => r.status === 'pending').length },
            { id: 'flagged', label: 'Underage & Suspicious Queue', icon: AlertOctagon, badge: flaggedQueue.underageReports.length + flaggedQueue.suspiciousUsers.length },
            { id: 'action_logs', label: 'Admin Action Log', icon: Activity },
            { id: 'legal_export', label: 'Legal Request Export', icon: Scale },
            { id: 'retention', label: 'Data Retention', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    tab.id === 'flagged' ? 'bg-rose-500 text-white' : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-2">
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Total Accounts
              </span>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{analytics?.totalUsers ?? users.length}</p>
              <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                <span className="text-emerald-500 font-semibold">{analytics?.dailyActiveUsers ?? 1} DAU</span> • 7d Active: {analytics?.activeUsers ?? 1}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-2">
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Pending Reports
              </span>
              <p className="text-2xl font-bold text-amber-500">{analytics?.pendingReports ?? reports.filter((r) => r.status === 'pending').length}</p>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Resolved: {analytics?.resolvedReports ?? reports.filter((r) => r.status !== 'pending').length}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-2">
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> Underage Reports
              </span>
              <p className="text-2xl font-bold text-rose-500">{analytics?.underageReports ?? reports.filter((r) => r.reason === 'underage').length}</p>
              <div className="text-[11px] text-rose-400 font-medium">Critical Priority Queue</div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-2">
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-400" /> Suspended / Banned
              </span>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {(analytics?.suspendedUsers ?? 0) + (analytics?.bannedUsers ?? 0)}
              </p>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Suspended: {analytics?.suspendedUsers ?? 0} • Banned: {analytics?.bannedUsers ?? 0}
              </div>
            </div>
          </div>

          {/* AI Usage Card (COUNTS ONLY - ZERO CONTENT PRINCIPLE) */}
          <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  AI & Model Request Telemetry (Counts Only)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Per security rules, raw prompt strings and journal entries are strictly omitted.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <EyeOff className="w-3.5 h-3.5" />
                Zero Content Stored
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1">
                <span className="text-xs text-[var(--text-secondary)]">Reflections Created</span>
                <p className="text-xl font-bold text-[var(--text-primary)]">{analytics?.totalReflectionsCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1">
                <span className="text-xs text-[var(--text-secondary)]">Companion Chat Queries</span>
                <p className="text-xl font-bold text-[var(--text-primary)]">{analytics?.totalChatMessagesCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1">
                <span className="text-xs text-[var(--text-secondary)]">Wisdom Searches</span>
                <p className="text-xl font-bold text-[var(--text-primary)]">{analytics?.totalWisdomQueriesCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1">
                <span className="text-xs text-[var(--text-secondary)]">Total System AI Calls</span>
                <p className="text-xl font-bold text-emerald-500">{analytics?.totalAiQueries ?? 0}</p>
              </div>
            </div>

            {/* 7-Day Trend Bars */}
            {analytics?.activityTrends && analytics.activityTrends.length > 0 && (
              <div className="pt-4 space-y-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">7-Day Aggregated Request Trends</span>
                <div className="grid grid-cols-7 gap-2 pt-2">
                  {analytics.activityTrends.map((t, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 text-center">
                      <div className="w-full h-20 bg-[var(--card-bg)] rounded-lg flex items-end p-1 justify-center">
                        <div
                          className="w-full bg-emerald-500/40 rounded-sm hover:bg-emerald-500 transition"
                          style={{
                            height: `${Math.min(100, Math.max(15, (t.aiQueries + t.searches + t.reflections) * 10))}%`,
                          }}
                          title={`Queries: ${t.aiQueries}, Searches: ${t.searches}, Reflections: ${t.reflections}`}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)]">{t.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USERS (NO CHAT VIEWER) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search username, email, or UID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
                <option value="scheduled_for_deletion">Scheduled for Deletion</option>
              </select>
            </div>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <MessageSquareOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>Zero Chat Viewer Guarantee:</strong> In accordance with constitutional privacy rules, administrators have no client interface to view or browse private user conversations or journals.
            </span>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--card-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Account & UID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Report Count</th>
                    <th className="px-4 py-3">Flags</th>
                    <th className="px-4 py-3">Joined / Last Seen</th>
                    <th className="px-4 py-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                        No users found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-[var(--card-bg)]/40 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center justify-center shrink-0">
                              {(u.displayName || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-[var(--text-primary)]">{u.displayName}</p>
                              <p className="text-[10px] text-[var(--text-secondary)] font-mono">{u.email || u.uid}</p>
                              <p className="text-[9px] text-[var(--text-secondary)] font-mono">UID: {u.uid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : u.status === 'suspended'
                              ? 'bg-amber-500/10 text-amber-500'
                              : u.status === 'banned'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-neutral-500/10 text-neutral-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          <span className={u.reportCount && u.reportCount > 0 ? 'text-amber-500' : 'text-[var(--text-secondary)]'}>
                            {u.reportCount || 0} reports
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {u.isUnderageReported && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-semibold border border-rose-500/20">
                                Underage Report
                              </span>
                            )}
                            {u.isSuspicious && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-semibold border border-amber-500/20">
                                Suspicious
                              </span>
                            )}
                            {!u.isUnderageReported && !u.isSuspicious && (
                              <span className="text-[10px] text-[var(--text-secondary)]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[var(--text-secondary)]">
                          <div>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                          <div>Login: {new Date(u.lastLoginAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'suspended' || u.status === 'banned' ? (
                              <button
                                onClick={() => {
                                  setActionModal({
                                    type: 'user',
                                    targetId: u.uid,
                                    targetName: u.displayName || u.email,
                                    action: 'unsuspend',
                                    title: 'Unsuspend User Account',
                                    description: `Restore full access for ${u.displayName || u.email}.`,
                                  });
                                  setActionNote('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition text-[11px] font-medium flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" /> Unsuspend
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActionModal({
                                    type: 'user',
                                    targetId: u.uid,
                                    targetName: u.displayName || u.email,
                                    action: 'suspend',
                                    title: 'Suspend User Account',
                                    description: `Temporarily revoke platform access for ${u.displayName || u.email}.`,
                                  });
                                  setActionNote('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition text-[11px] font-medium flex items-center gap-1"
                              >
                                <UserX className="w-3 h-3" /> Suspend
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setActionModal({
                                  type: 'user',
                                  targetId: u.uid,
                                  targetName: u.displayName || u.email,
                                  action: 'ban',
                                  title: 'Permanently Ban Account',
                                  description: `Permanently disable account for ${u.displayName || u.email} and revoke all active JWT tokens.`,
                                });
                                setActionNote('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition text-[11px] font-medium flex items-center gap-1"
                            >
                              <AlertOctagon className="w-3 h-3" /> Ban
                            </button>

                            <button
                              onClick={() => {
                                setActionModal({
                                  type: 'user',
                                  targetId: u.uid,
                                  targetName: u.displayName || u.email,
                                  action: 'delete',
                                  title: 'Schedule Account Deletion',
                                  description: `Queue account of ${u.displayName || u.email} for permanent deletion following 90-day retention policies.`,
                                });
                                setActionNote('');
                              }}
                              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS (ATTACHED MESSAGES ONLY) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Report Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="warned">Warned</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <select
                value={reportReasonFilter}
                onChange={(e) => setReportReasonFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Violation Types</option>
                <option value="underage">Underage User</option>
                <option value="harassment">Harassment</option>
                <option value="spam">Spam</option>
                <option value="fake_bot">Fake / Bot</option>
                <option value="nudity">Nudity / NSFW</option>
                <option value="other">Other</option>
              </select>
            </div>

            <span className="text-xs text-[var(--text-secondary)]">
              Showing {filteredReports.length} reports
            </span>
          </div>

          {/* Reports Grid & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-3">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs">
                  No reports match current filters.
                </div>
              ) : (
                filteredReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      selectedReport?.id === r.id
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                        : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.reason === 'underage'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {r.reason}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-500/10 text-neutral-400'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        Reported: {r.reportedUserName || r.reportedUserId}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{r.details || 'No additional comment'}</p>
                    </div>

                    <div className="text-[10px] text-[var(--text-secondary)] flex items-center justify-between pt-1">
                      <span>Attached: {r.attachedMessages?.length || 0} messages</span>
                      <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detailed Report View (Only Attached Messages) */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-6">
                  {/* Report Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          selectedReport.reason === 'underage' ? 'bg-rose-500 text-white' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {selectedReport.reason}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">Report #{selectedReport.id}</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        Incident Filed against: {selectedReport.reportedUserName || selectedReport.reportedUserId}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Target UID: <code className="text-[var(--text-primary)]">{selectedReport.reportedUserId}</code> • Filed by: <code className="text-[var(--text-primary)]">{selectedReport.reporterId}</code>
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActionModal({
                            type: 'report',
                            targetId: selectedReport.id,
                            targetName: selectedReport.reportedUserName || selectedReport.reportedUserId,
                            action: 'dismiss',
                            title: 'Dismiss Report',
                            description: 'Mark report as reviewed and dismissed with no penalty.',
                          });
                          setActionNote('');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          setActionModal({
                            type: 'report',
                            targetId: selectedReport.id,
                            targetName: selectedReport.reportedUserName || selectedReport.reportedUserId,
                            action: 'warn',
                            title: 'Issue Formal Warning',
                            description: 'Issue a formal behavioral warning recorded against the reported user.',
                          });
                          setActionNote('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-medium transition"
                      >
                        Warn
                      </button>
                      <button
                        onClick={() => {
                          setActionModal({
                            type: 'report',
                            targetId: selectedReport.id,
                            targetName: selectedReport.reportedUserName || selectedReport.reportedUserId,
                            action: 'suspend',
                            title: 'Suspend Reported User',
                            description: 'Suspend the account of the reported user and record action note.',
                          });
                          setActionNote('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-medium transition"
                      >
                        Suspend User
                      </button>
                    </div>
                  </div>

                  {/* Reporter's Details */}
                  <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                      Reporter's Statement & Details
                    </span>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      {selectedReport.details || 'No statement provided by reporter.'}
                    </p>
                  </div>

                  {/* Attached Messages Queue (Zero Full Chat Access) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquareOff className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                          Attached Messages Evidence (Max 20 Messages)
                        </h4>
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {selectedReport.attachedMessages?.length || 0} messages attached by reporter
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] max-h-80 overflow-y-auto space-y-2.5">
                      {!selectedReport.attachedMessages || selectedReport.attachedMessages.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)] italic text-center py-4">
                          The reporter did not attach any conversation messages to this report.
                        </p>
                      ) : (
                        selectedReport.attachedMessages.map((msg: AttachedReportMessage, idx) => {
                          const isReportedUser = msg.senderUid === selectedReport.reportedUserId;
                          return (
                            <div
                              key={msg.id || idx}
                              className={`p-3 rounded-xl border text-xs space-y-1 ${
                                isReportedUser
                                  ? 'bg-rose-500/5 border-rose-500/20'
                                  : 'bg-[var(--surface-color)] border-[var(--border-color)]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                                <span className="font-semibold text-[var(--text-primary)]">
                                  {isReportedUser ? 'Reported User' : 'Reporter / Contact'}: <code className="text-[var(--text-secondary)]">{msg.senderUid}</code>
                                </span>
                                <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}</span>
                              </div>
                              <p className="text-xs text-[var(--text-primary)]">{msg.text || '[Media / Non-text Content]'}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Moderator Resolution Note Display */}
                  {selectedReport.moderatorNote && (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                      <span className="text-[11px] font-bold text-emerald-500 uppercase">Moderator Resolution Note</span>
                      <p className="text-[var(--text-primary)]">{selectedReport.moderatorNote}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Actioned by {selectedReport.actionedBy || 'Admin'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto text-amber-500/50" />
                  <p>Select a report from the list to inspect attached evidence and take action.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FLAGGED QUEUE (UNDERAGE & SUSPICIOUS) */}
      {activeTab === 'flagged' && (
        <div className="space-y-6">
          {/* Underage Reports Section */}
          <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-rose-500/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  Underage User Protection Queue (Critical Priority)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Immediate triage required for compliance with COPPA, child safety, and platform age guidelines.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold text-xs border border-rose-500/20">
                {flaggedQueue.underageReports.length} Flagged
              </span>
            </div>

            {flaggedQueue.underageReports.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] py-4 text-center">
                ✓ No pending underage violation reports in the queue.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {flaggedQueue.underageReports.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-[var(--text-primary)]">
                        Target UID: <code className="text-rose-400">{item.reportedUserId}</code> ({item.reportedUserName || 'User'})
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{item.details || 'Reported as underage individual'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActionModal({
                            type: 'user',
                            targetId: item.reportedUserId,
                            targetName: item.reportedUserName || item.reportedUserId,
                            action: 'suspend',
                            title: 'Freeze Account Pending Age Verification',
                            description: 'Suspend account immediately while age verification documents are reviewed.',
                          });
                          setActionNote('Underage triage: Temporary freeze pending legal age verification');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-medium text-xs hover:bg-rose-600 transition"
                      >
                        Freeze Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suspicious Accounts Section */}
          <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-amber-500/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Suspicious & High-Report Accounts
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Accounts with repeated reports, automated request bursts, or high-risk activity flags.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs border border-amber-500/20">
                {flaggedQueue.suspiciousUsers.length} Flagged
              </span>
            </div>

            {flaggedQueue.suspiciousUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] py-4 text-center">
                ✓ No suspicious high-frequency or multi-reported accounts detected.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {flaggedQueue.suspiciousUsers.map((su) => (
                  <div key={su.uid} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {su.displayName} (<code className="text-amber-500 font-mono">{su.uid}</code>)
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Accumulated {su.reportCount} reports • Status: {su.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActionModal({
                            type: 'user',
                            targetId: su.uid,
                            targetName: su.displayName || su.uid,
                            action: 'suspend',
                            title: 'Suspend Suspicious Account',
                            description: 'Suspend user account due to high incident volume and suspicious behavior.',
                          });
                          setActionNote(`Suspended following suspicious queue triage (${su.reportCount} accumulated reports)`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-medium text-xs hover:bg-amber-600 transition"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN ACTION LOG (WHO, WHAT, WHEN, WHY) */}
      {activeTab === 'action_logs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Immutable Administrative Action Audit Trail
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Records who did what, when, to which user or report, and the required explanatory note.
              </p>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              Total Recorded Actions: {actionLogs.length}
            </span>
          </div>

          <div className="rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--card-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Administrator</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Mandatory Note (Why)</th>
                    <th className="px-4 py-3">IP / Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                  {actionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                        No administrative action logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    actionLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--card-bg)]/40 transition">
                        <td className="px-4 py-3 text-[11px] text-[var(--text-secondary)] font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                          {log.adminEmail || log.adminUid}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {log.targetId}
                          {log.targetUserName && <span className="text-[var(--text-secondary)]"> ({log.targetUserName})</span>}
                        </td>
                        <td className="px-4 py-3 text-[11px] max-w-xs text-[var(--text-primary)]">
                          {log.note}
                        </td>
                        <td className="px-4 py-3 text-[10px] font-mono text-[var(--text-secondary)]">
                          {log.ipAddress || 'internal_proxy'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LEGAL REQUEST EXPORT (SERVER-SIDE ONLY) */}
      {activeTab === 'legal_export' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-4">
            <div className="space-y-1 border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-500" />
                Legal Process Compliance & Subpoena Export Tool
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                For valid legal process requests (court orders, warrants, and regulatory summons). This server-side function aggregates user account details, login/IP logs, chat requests, and messages within the 90-day retention window into an audited, downloadable JSON file.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Notice on Privacy & Non-Dashboard Inspection
              </p>
              <p>
                Nothing from this export is shown in the normal admin dashboard. Every export generates an immutable record in the <code className="bg-amber-500/20 px-1 py-0.5 rounded">legal_exports</code> and <code className="bg-amber-500/20 px-1 py-0.5 rounded">admin_action_logs</code> collections containing the administrative UID, court order reference, timestamp, and requesting authority.
              </p>
            </div>

            <form onSubmit={handleRunLegalExport} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Target User ID (UID) *</label>
                <input
                  type="text"
                  required
                  value={legalTargetUid}
                  onChange={(e) => setLegalTargetUid(e.target.value)}
                  placeholder="e.g. user_abc123xyz"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Legal Order Reference Number *</label>
                <input
                  type="text"
                  required
                  value={legalCaseRef}
                  onChange={(e) => setLegalCaseRef(e.target.value)}
                  placeholder="e.g. SUBPOENA-US-2026-9042"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Requesting Authority *</label>
                <input
                  type="text"
                  required
                  value={legalAuthority}
                  onChange={(e) => setLegalAuthority(e.target.value)}
                  placeholder="e.g. High Court / Dept of Justice Cyber Investigation Unit"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Order Date *</label>
                <input
                  type="date"
                  required
                  value={legalOrderDate}
                  onChange={(e) => setLegalOrderDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Mandatory Compliance Officer Note *</label>
                <textarea
                  required
                  rows={2}
                  value={legalNote}
                  onChange={(e) => setLegalNote(e.target.value)}
                  placeholder="State the verification details and legal scope of this request..."
                  className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isExportingLegal}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${isExportingLegal ? 'animate-bounce' : ''}`} />
                  {isExportingLegal ? 'Compiling Legal Export Package...' : 'Generate & Download Compliance Export JSON'}
                </button>
              </div>
            </form>

            {/* Previous Export Result Summary */}
            {lastExportResult && (
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-emerald-500/30 text-xs space-y-2 mt-4">
                <div className="flex items-center gap-2 text-emerald-500 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Compliance Package Successfully Generated</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[var(--text-secondary)]">
                  <div>Export ID: <span className="font-mono text-[var(--text-primary)]">{lastExportResult.exportId}</span></div>
                  <div>Messages Included: <span className="font-mono text-[var(--text-primary)]">{lastExportResult.auditRecords?.messagesCount ?? 0}</span></div>
                  <div>IP/Login Logs: <span className="font-mono text-[var(--text-primary)]">{lastExportResult.auditRecords?.loginAndIpLogsCount ?? 0}</span></div>
                  <div>Chat Requests: <span className="font-mono text-[var(--text-primary)]">{lastExportResult.auditRecords?.chatRequestsCount ?? 0}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: DATA RETENTION & CLEANUP */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-4">
            <div className="space-y-1 border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                Data Retention & Auto-Purge Policy (90-Day Standard)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Somotoz strictly adheres to a 90-day retention policy. Data beyond 90 days is permanently purged across Firestore collections.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Soft-Deleted Messages</span>
                <p className="text-xs text-[var(--text-primary)]">
                  Messages marked with <code className="text-emerald-500">deletedAt</code> older than 90 days are permanently erased.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Expired Disappearing Messages</span>
                <p className="text-xs text-[var(--text-primary)]">
                  Disappearing messages whose expiration plus 90-day retention has elapsed are purged from storage.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1.5">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Account Deletion Requests</span>
                <p className="text-xs text-[var(--text-primary)]">
                  Accounts scheduled for deletion whose 90-day grace/retention window has expired are permanently wiped.
                </p>
              </div>
            </div>

            {/* Trigger Button with Note */}
            <div className="p-5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-3">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Manual Retention Enforcement Trigger</span>
              <p className="text-xs text-[var(--text-secondary)]">
                The background scheduler automatically enforces retention every 12 hours. You can trigger an audited manual cleanup pass at any time.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={retentionNote}
                  onChange={(e) => setRetentionNote(e.target.value)}
                  placeholder="Audit reason for manual retention cleanup..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleTriggerRetentionCleanup}
                  disabled={isCleaningRetention}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCleaningRetention ? 'animate-spin' : ''}`} />
                  {isCleaningRetention ? 'Executing Purge Pass...' : 'Run Retention Cleanup Pass Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RE-AUTHENTICATION POPUP MODAL (5-MINUTE GATE) */}
      {showReauthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-2xl space-y-5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Recent Authentication Required
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                For administrative moderation and legal compliance security, your authentication session must have been established within the last 5 minutes.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] space-y-1">
              <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> 5-Minute Re-Authentication Gate
              </p>
              <p>Re-authenticate seamlessly using your Google admin account to authorize this sensitive action.</p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowReauthModal(false);
                  setPendingActionToRetry(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--card-bg)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformReauth}
                disabled={isReauthenticating}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {isReauthenticating ? 'Verifying...' : 'Re-authenticate Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION ACTION MODAL WITH MANDATORY NOTE */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleConfirmActionWithNote}
            className="max-w-md w-full p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                {actionModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {actionModal.description}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                <span>Mandatory Moderator Explanatory Note *</span>
                <span className="text-[10px] text-[var(--text-secondary)]">Min 5 characters</span>
              </label>
              <textarea
                required
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Explain the specific reason and policy violation for this action (recorded to immutable audit log)..."
                className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--card-bg)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isExecutingAction || actionNote.trim().length < 5}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isExecutingAction ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
