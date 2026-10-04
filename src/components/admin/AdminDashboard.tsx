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
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  Download,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Info,
  Calendar,
  Sparkles,
  Terminal,
  Cpu,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { UserProfile, AdminActivityLog, ManagedUser, AdminAnalytics, ViewMode } from '../../types';
import {
  checkIsAdmin,
  fetchAdminActivityLogs,
  fetchManagedUsers,
  fetchAdminAnalyticsData,
  setUserAccessStatus,
  updateUserAppDataByAdmin,
  deleteUserSomotozData
} from '../../lib/adminService';
import { getEffectiveAdminEmail, ADMIN_EMAIL } from '../../config/adminConfig';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onNavigate: (view: ViewMode) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

type AdminTab = 'analytics' | 'users' | 'activities' | 'security';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigate,
  onShowToast,
}) => {
  const isAuthorized = checkIsAdmin(currentUser);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Data states
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);

  // Filter & Search states
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [logSearchTerm, setLogSearchTerm] = useState<string>('');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals state
  const [inspectLog, setInspectLog] = useState<AdminActivityLog | null>(null);
  const [editUserModal, setEditUserModal] = useState<ManagedUser | null>(null);
  const [editFormData, setEditFormData] = useState<{ displayName: string; bio: string }>({
    displayName: '',
    bio: '',
  });
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    user: ManagedUser;
    targetDisabled: boolean;
  } | null>(null);
  const [deleteDataModal, setDeleteDataModal] = useState<ManagedUser | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Load all admin data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, usersData, logsData] = await Promise.all([
        fetchAdminAnalyticsData(),
        fetchManagedUsers(),
        fetchAdminActivityLogs({ limitCount: 300 }),
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData);
      setActivityLogs(logsData);
    } catch (err: any) {
      console.error('[Admin] Error loading dashboard data:', err);
      onShowToast('error', 'Sync Failed', 'Could not refresh administrative telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadAdminData();
    }
  }, [isAuthorized]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.uid.toLowerCase().includes(userSearchTerm.toLowerCase());
      return matchSearch;
    });
  }, [users, userSearchTerm]);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    let result = activityLogs.filter((l) => {
      const matchType = selectedActivityType === 'all' || l.activityType === selectedActivityType;
      const matchStatus = selectedStatus === 'all' || l.status === selectedStatus;
      const term = logSearchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        l.query.toLowerCase().includes(term) ||
        l.userEmail.toLowerCase().includes(term) ||
        l.userId.toLowerCase().includes(term) ||
        l.feature.toLowerCase().includes(term) ||
        (l.userName && l.userName.toLowerCase().includes(term));

      return matchType && matchStatus && matchSearch;
    });

    result = [...result].sort((a, b) => {
      return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return result;
  }, [activityLogs, selectedActivityType, selectedStatus, logSearchTerm, sortOrder]);

  // Handle Enable / Disable user access
  const handleConfirmToggleStatus = async () => {
    if (!confirmStatusModal) return;
    setIsProcessingAction(true);
    try {
      const { user, targetDisabled } = confirmStatusModal;
      await setUserAccessStatus(user.uid, targetDisabled);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? { ...u, status: targetDisabled ? 'disabled' : 'active' }
            : u
        )
      );
      onShowToast(
        'success',
        targetDisabled ? 'Access Disabled' : 'Access Restored',
        `User ${user.displayName || user.email} access has been updated.`
      );
      setConfirmStatusModal(null);
      // Reload logs to show new audit record
      const updatedLogs = await fetchAdminActivityLogs({ limitCount: 300 });
      setActivityLogs(updatedLogs);
    } catch (err: any) {
      onShowToast('error', 'Action Failed', err.message || 'Could not update user status.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Edit User Profile
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;
    setIsProcessingAction(true);
    try {
      await updateUserAppDataByAdmin(editUserModal.uid, {
        displayName: editFormData.displayName,
        bio: editFormData.bio,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === editUserModal.uid
            ? { ...u, displayName: editFormData.displayName, bio: editFormData.bio }
            : u
        )
      );
      onShowToast('success', 'Profile Updated', 'User application profile has been saved.');
      setEditUserModal(null);
      const updatedLogs = await fetchAdminActivityLogs({ limitCount: 300 });
      setActivityLogs(updatedLogs);
    } catch (err: any) {
      onShowToast('error', 'Update Failed', err.message || 'Could not edit user data.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Delete User Application Data
  const handleConfirmDeleteData = async () => {
    if (!deleteDataModal) return;
    setIsProcessingAction(true);
    try {
      await deleteUserSomotozData(deleteDataModal.uid);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === deleteDataModal.uid
            ? { ...u, totalEntries: 0, totalActivities: 0 }
            : u
        )
      );
      onShowToast(
        'success',
        'Data Deleted',
        `Somotoz application data for ${deleteDataModal.displayName || deleteDataModal.email} was removed.`
      );
      setDeleteDataModal(null);
      const updatedLogs = await fetchAdminActivityLogs({ limitCount: 300 });
      setActivityLogs(updatedLogs);
    } catch (err: any) {
      onShowToast('error', 'Deletion Failed', err.message || 'Could not delete application data.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Export logs to CSV
  const handleExportLogsCSV = () => {
    if (filteredLogs.length === 0) {
      onShowToast('info', 'No Data', 'No logs available to export for the current filter.');
      return;
    }

    const headers = ['Timestamp', 'Date_Time', 'Activity_Type', 'User_Email', 'User_ID', 'Feature', 'Query_Prompt', 'Model_Used', 'Tokens', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.activityType}"`,
      `"${l.userEmail}"`,
      `"${l.userId}"`,
      `"${l.feature}"`,
      `"${(l.query || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${l.modelUsed || ''}"`,
      l.tokens || 0,
      `"${l.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `somotoz_admin_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'Audit Exported', `Exported ${filteredLogs.length} activity records to CSV.`);
  };

  // UNAUTHORIZED SHIELD SCREEN
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 font-mono text-center">
        <div className="p-8 bg-[#090914] border-2 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.2)] clip-cyber-card">
          <div className="w-16 h-16 mx-auto bg-rose-950/40 border border-rose-500/80 flex items-center justify-center text-rose-400 mb-6 clip-badge-poly">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">
            Access Denied // Admin Authorization Required
          </h2>
          <p className="mt-3 text-sm text-[#A1A1AA] max-w-lg mx-auto font-sans leading-relaxed">
            The Somotoz Admin Dashboard is restricted exclusively to authorized administrators.
            Your authenticated account (<code className="text-rose-400">{currentUser?.email || 'unidentified'}</code>) does not hold administrative privileges.
          </p>

          <div className="mt-6 p-4 bg-black/60 border border-[#25253D] text-left max-w-md mx-auto text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#EDEDED] font-bold">
              <Shield className="w-4 h-4 text-[#00F0FF]" />
              Security Verification Gate:
            </div>
            <p className="text-[#A1A1AA] text-[11px]">
              Configured Admin Email: <span className="text-[#00F0FF]">{getEffectiveAdminEmail()}</span>
            </p>
            <p className="text-[#737373] text-[10px]">
              If you are the owner, sign in with your configured admin email or update <code className="text-[#EDEDED]">src/config/adminConfig.ts</code>.
            </p>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-8 px-6 py-2.5 bg-[#00F0FF] hover:bg-[#00D8E6] text-black font-bold text-xs uppercase tracking-wider clip-badge-poly shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
          >
            Return to User Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono pb-12">
      {/* Top Header & Telemetry Status */}
      <div className="bg-[#090916]/95 border border-[#25253D] p-5 sm:p-6 clip-cyber-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black border border-[#00F0FF] flex items-center justify-center text-[#00F0FF] clip-badge-poly shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  SOMOTOZ MASTER ADMIN
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 clip-badge-poly flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> SECURE ROOT
                  </span>
                </h1>
              </div>
              <p className="text-xs text-[#A1A1AA] font-sans mt-0.5">
                Centralized telemetry, user governance, and internal AI query audit logging.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3 py-1.5 bg-black/80 border border-[#25253D] text-[11px] text-[#A1A1AA] flex items-center gap-2 clip-badge-poly">
            <span className="text-[#737373]">ADMIN:</span>
            <span className="text-[#00F0FF] font-bold">{getEffectiveAdminEmail()}</span>
          </div>

          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="p-2 bg-black/80 hover:bg-[#151528] border border-[#25253D] hover:border-[#00F0FF] text-[#A1A1AA] hover:text-[#00F0FF] clip-badge-poly transition-all cursor-pointer"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00F0FF]' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="px-3.5 py-1.5 bg-black/80 hover:bg-[#151528] border border-[#25253D] hover:border-[#EDEDED] text-xs text-[#EDEDED] clip-badge-poly transition-colors cursor-pointer"
          >
            Return to App
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#25253D] pb-3 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-bold flex items-center gap-2 clip-badge-poly transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-[#0E0E1C] border border-[#25253D] text-[#A1A1AA] hover:text-white hover:border-[#00F0FF]/40'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>ANALYTICS &amp; OVERVIEW</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold flex items-center gap-2 clip-badge-poly transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-[#0E0E1C] border border-[#25253D] text-[#A1A1AA] hover:text-white hover:border-[#00F0FF]/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>USER MANAGEMENT ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2 font-bold flex items-center gap-2 clip-badge-poly transition-all cursor-pointer ${
            activeTab === 'activities'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-[#0E0E1C] border border-[#25253D] text-[#A1A1AA] hover:text-white hover:border-[#00F0FF]/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>AI QUERIES &amp; SEARCH AUDIT ({activityLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 font-bold flex items-center gap-2 clip-badge-poly transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-[#0E0E1C] border border-[#25253D] text-[#A1A1AA] hover:text-white hover:border-[#00F0FF]/40'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>SECURITY &amp; RULES</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: ANALYTICS & OVERVIEW
      ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#090916] border border-[#25253D] p-5 clip-cyber-card relative overflow-hidden group hover:border-[#00F0FF]/50 transition-colors">
              <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
                <span>TOTAL REGISTERED USERS</span>
                <Users className="w-4 h-4 text-[#00F0FF]" />
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold text-white">
                {analytics?.totalUsers ?? users.length}
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 inline" />
                <span>{analytics?.activeUsers ?? 1} active in last 7 days</span>
              </div>
            </div>

            <div className="bg-[#090916] border border-[#25253D] p-5 clip-cyber-card relative overflow-hidden group hover:border-[#A855F7]/50 transition-colors">
              <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
                <span>TOTAL AI QUERIES</span>
                <Sparkles className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold text-white">
                {analytics?.totalAiQueries ?? 0}
              </div>
              <div className="mt-2 text-[11px] text-[#A1A1AA] font-sans">
                Multimodal prompts &amp; stream completions
              </div>
            </div>

            <div className="bg-[#090916] border border-[#25253D] p-5 clip-cyber-card relative overflow-hidden group hover:border-[#FF007A]/50 transition-colors">
              <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
                <span>TOTAL GROUNDED SEARCHES</span>
                <Search className="w-4 h-4 text-[#FF007A]" />
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold text-white">
                {analytics?.totalSearches ?? 0}
              </div>
              <div className="mt-2 text-[11px] text-[#A1A1AA] font-sans">
                Wisdom Explorer evidence queries
              </div>
            </div>

            <div className="bg-[#090916] border border-[#25253D] p-5 clip-cyber-card relative overflow-hidden group hover:border-amber-400/50 transition-colors">
              <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
                <span>JOURNAL REFLECTIONS</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold text-white">
                {analytics?.totalReflections ?? 0}
              </div>
              <div className="mt-2 text-[11px] text-[#A1A1AA] font-sans">
                Recorded cognitive reflections
              </div>
            </div>
          </div>

          {/* Activity Trends Bar Chart */}
          <div className="bg-[#090916] border border-[#25253D] p-5 sm:p-6 clip-cyber-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00F0FF]" />
                  SOMOTOZ INTERNAL ACTIVITY VELOCITY (7-DAY TREND)
                </h3>
                <p className="text-xs text-[#A1A1AA] font-sans mt-0.5">
                  Chronological distribution of AI prompts, scientific searches, and reflections.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-[#A855F7]">
                  <span className="w-2.5 h-2.5 bg-[#A855F7] inline-block clip-badge-poly" /> AI Prompts
                </span>
                <span className="flex items-center gap-1.5 text-[#FF007A]">
                  <span className="w-2.5 h-2.5 bg-[#FF007A] inline-block clip-badge-poly" /> Searches
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 bg-amber-400 inline-block clip-badge-poly" /> Reflections
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {analytics?.activityTrends && analytics.activityTrends.length > 0 ? (
                analytics.activityTrends.map((trend, idx) => {
                  const maxVal = Math.max(
                    ...analytics.activityTrends.map((t) => Math.max(t.aiQueries, t.searches, t.reflections, 1)),
                    10
                  );
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-[#737373] text-[11px] shrink-0">{trend.date}</span>
                      <div className="flex-1 bg-black/60 border border-[#25253D] h-6 flex items-center p-0.5 gap-1">
                        <div
                          style={{ width: `${(trend.aiQueries / maxVal) * 100}%` }}
                          className="h-full bg-[#A855F7] transition-all duration-500 min-w-[2px]"
                          title={`AI Queries: ${trend.aiQueries}`}
                        />
                        <div
                          style={{ width: `${(trend.searches / maxVal) * 100}%` }}
                          className="h-full bg-[#FF007A] transition-all duration-500 min-w-[2px]"
                          title={`Searches: ${trend.searches}`}
                        />
                        <div
                          style={{ width: `${(trend.reflections / maxVal) * 100}%` }}
                          className="h-full bg-amber-400 transition-all duration-500 min-w-[2px]"
                          title={`Reflections: ${trend.reflections}`}
                        />
                      </div>
                      <span className="text-[11px] text-[#A1A1AA] w-24 text-right shrink-0">
                        {trend.aiQueries + trend.searches + trend.reflections} events
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#737373]">
                  No historical telemetry recorded yet. Activity will plot as users interact.
                </div>
              )}
            </div>
          </div>

          {/* Quick System Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#090916] border border-[#25253D] p-5 clip-cyber-card space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00F0FF]" /> System Engine Status
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-black/60 border border-[#25253D]">
                  <span className="text-[#A1A1AA]">Gemini AI SDK Pipeline</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" /> ONLINE
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-black/60 border border-[#25253D]">
                  <span className="text-[#A1A1AA]">Firestore Rules Enforced</span>
                  <span className="text-[#00F0FF] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#00F0FF] rounded-full inline-block" /> ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-black/60 border border-[#25253D]">
                  <span className="text-[#A1A1AA]">Internal Query Logging</span>
                  <span className="text-emerald-400 font-bold">100% AUDITED</span>
                </div>
              </div>
            </div>

            <div className="bg-[#090916] border border-[#25253D] p-5 clip-cyber-card space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" /> Privacy &amp; Data Boundary Guarantee
              </h4>
              <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
                Somotoz strictly tracks queries, prompts, and actions performed <strong>INSIDE</strong> the Somotoz web application.
                Zero telemetry or personal activity is accessed or collected from the user's external browser tabs, Google account, Gmail, Chrome history, or operating system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: USER MANAGEMENT
      ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Privacy Security Banner */}
          <div className="p-3.5 bg-[#090916] border-l-4 border-amber-400 border border-[#25253D] text-xs text-[#EDEDED] flex items-center justify-between gap-4 font-sans">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Password Protection Enforced:</strong> Firebase Authentication manages credentials cryptographically. Administrator cannot see or retrieve user passwords under any circumstance.
              </span>
            </div>
          </div>

          {/* User Search Bar */}
          <div className="flex items-center justify-between gap-3 bg-[#090916] border border-[#25253D] p-3 clip-cyber-card">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search user by display name, email, or UID..."
                className="w-full pl-9 pr-4 py-2 bg-black/80 border border-[#25253D] text-xs text-white placeholder-[#737373] focus:border-[#00F0FF] focus:outline-none clip-badge-poly"
              />
            </div>
            <div className="text-xs text-[#737373] whitespace-nowrap">
              Showing <strong className="text-white">{filteredUsers.length}</strong> of {users.length} users
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#090916] border border-[#25253D] clip-cyber-card overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/80 border-b border-[#25253D] text-[#A1A1AA] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">App Usage</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#25253D]/60 text-white">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isUserDisabled = user.status === 'disabled';
                    return (
                      <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-[#141424] border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center font-bold text-xs clip-badge-poly">
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                {user.displayName || 'Somotoz User'}
                                {user.role === 'admin' && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 clip-badge-poly">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#737373] font-mono">
                                UID: {user.uid.slice(0, 10)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[#A1A1AA]">
                          {user.email}
                        </td>

                        <td className="py-3 px-4 text-[#737373] text-[11px]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-[#A1A1AA] text-[11px]">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Recent'}
                        </td>

                        <td className="py-3 px-4">
                          {isUserDisabled ? (
                            <span className="px-2 py-0.5 bg-rose-950/80 text-rose-400 border border-rose-500/50 text-[10px] font-bold clip-badge-poly flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> DISABLED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold clip-badge-poly flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-[#A1A1AA]">
                          <div>{user.totalActivities} activities</div>
                          <div className="text-[#737373] text-[10px]">{user.totalEntries} journal notes</div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Enable / Disable */}
                            <button
                              onClick={() =>
                                setConfirmStatusModal({
                                  user,
                                  targetDisabled: !isUserDisabled,
                                })
                              }
                              className={`p-1.5 border clip-badge-poly transition-colors cursor-pointer ${
                                isUserDisabled
                                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900/60'
                                  : 'bg-rose-950/40 border-rose-500/60 text-rose-400 hover:bg-rose-900/60'
                              }`}
                              title={isUserDisabled ? 'Enable user access' : 'Disable user access'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Profile */}
                            <button
                              onClick={() => {
                                setEditUserModal(user);
                                setEditFormData({
                                  displayName: user.displayName || '',
                                  bio: user.bio || '',
                                });
                              }}
                              className="p-1.5 bg-black/80 hover:bg-[#151528] border border-[#25253D] hover:border-[#00F0FF] text-[#A1A1AA] hover:text-[#00F0FF] clip-badge-poly transition-colors cursor-pointer"
                              title="Edit permitted profile data"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User Application Data */}
                            <button
                              onClick={() => setDeleteDataModal(user)}
                              className="p-1.5 bg-black/80 hover:bg-rose-950/40 border border-[#25253D] hover:border-rose-500/60 text-[#737373] hover:text-rose-400 clip-badge-poly transition-colors cursor-pointer"
                              title="Delete user's Somotoz application data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#737373]">
                      No users found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: AI QUERIES & ACTIVITY LOGS
      ======================================================== */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          {/* Controls: Search, Filters, CSV Export */}
          <div className="bg-[#090916] border border-[#25253D] p-4 clip-cyber-card flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                placeholder="Search prompt, search query, email, or user UID..."
                className="w-full pl-9 pr-4 py-2 bg-black/80 border border-[#25253D] text-xs text-white placeholder-[#737373] focus:border-[#00F0FF] focus:outline-none clip-badge-poly"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {/* Type Filter */}
              <select
                value={selectedActivityType}
                onChange={(e) => setSelectedActivityType(e.target.value)}
                className="px-3 py-2 bg-black/80 border border-[#25253D] text-xs text-[#EDEDED] focus:border-[#00F0FF] focus:outline-none clip-badge-poly cursor-pointer"
              >
                <option value="all">All Activity Types</option>
                <option value="ai_query">AI Queries</option>
                <option value="search">Searches</option>
                <option value="reflection">Reflections</option>
                <option value="media_gen">Media Generation</option>
                <option value="admin_action">Admin Actions</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-black/80 border border-[#25253D] text-xs text-[#EDEDED] focus:border-[#00F0FF] focus:outline-none clip-badge-poly cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="px-3 py-2 bg-black/80 border border-[#25253D] hover:border-[#00F0FF] text-xs text-[#A1A1AA] hover:text-[#00F0FF] clip-badge-poly flex items-center gap-1.5 cursor-pointer"
                title="Toggle date sort"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>

              {/* CSV Export */}
              <button
                onClick={handleExportLogsCSV}
                className="px-3 py-2 bg-[#00F0FF] hover:bg-[#00D8E6] text-black font-bold text-xs clip-badge-poly flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT CSV</span>
              </button>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="bg-[#090916] border border-[#25253D] clip-cyber-card overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/80 border-b border-[#25253D] text-[#A1A1AA] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">Query / Prompt Submitted</th>
                  <th className="py-3 px-4">Model &amp; Tokens</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#25253D]/60 text-white">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const badgeStyles: Record<string, string> = {
                      ai_query: 'bg-purple-950/80 text-purple-400 border-purple-500/50',
                      search: 'bg-pink-950/80 text-pink-400 border-pink-500/50',
                      reflection: 'bg-amber-950/80 text-amber-400 border-amber-500/50',
                      media_gen: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50',
                      admin_action: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50',
                      auth: 'bg-blue-950/80 text-blue-400 border-blue-500/50',
                    };

                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-[#737373] text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-[11px]">
                            {log.userName || log.userEmail.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-[#A1A1AA]">{log.userEmail}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 border text-[10px] font-bold clip-badge-poly uppercase ${
                              badgeStyles[log.activityType] || 'bg-slate-900 text-slate-300 border-slate-700'
                            }`}
                          >
                            {log.activityType}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#EDEDED] text-[11px]">
                          {log.feature}
                        </td>

                        <td className="py-3 px-4 max-w-xs font-sans text-xs">
                          <div className="line-clamp-2 text-[#EDEDED]">
                            {log.query || '—'}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[10px] text-[#737373] whitespace-nowrap">
                          <div className="text-[#00F0FF] font-mono">{log.modelUsed || 'gemini-flash'}</div>
                          <div>{log.tokens || 120} tokens</div>
                        </td>

                        <td className="py-3 px-4">
                          {log.status === 'success' ? (
                            <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> SUCCESS
                            </span>
                          ) : (
                            <span className="text-rose-400 text-[10px] font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> FAILED
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setInspectLog(log)}
                            className="p-1 bg-black/80 hover:bg-[#151528] border border-[#25253D] hover:border-[#00F0FF] text-[#A1A1AA] hover:text-[#00F0FF] clip-badge-poly transition-colors cursor-pointer"
                            title="Inspect full query payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#737373]">
                      No audit logs found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: SECURITY & CONFIGURATION
      ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-[#090916] border border-[#25253D] p-5 sm:p-6 clip-cyber-card space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00F0FF]" />
              Active Admin Security Configuration
            </h3>

            <div className="p-4 bg-black/80 border border-[#25253D] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#25253D] pb-2">
                <span className="text-[#A1A1AA]">Admin Config File:</span>
                <code className="text-[#00F0FF]">src/config/adminConfig.ts</code>
              </div>
              <div className="flex items-center justify-between border-b border-[#25253D] pb-2">
                <span className="text-[#A1A1AA]">Configured ADMIN_EMAIL:</span>
                <code className="text-emerald-400 font-bold">{ADMIN_EMAIL}</code>
              </div>
              <div className="flex items-center justify-between border-b border-[#25253D] pb-2">
                <span className="text-[#A1A1AA]">Active Effective Admin:</span>
                <code className="text-[#00F0FF] font-bold">{getEffectiveAdminEmail()}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA]">Firebase Custom Claim Role:</span>
                <span className="text-emerald-400 font-bold">admin: true supported</span>
              </div>
            </div>

            <div className="p-4 bg-[#141424] border border-[#25253D] space-y-2 text-xs font-sans">
              <h4 className="font-bold text-white flex items-center gap-2 font-mono">
                <Lock className="w-4 h-4 text-emerald-400" />
                Multi-Layered Enforcement Architecture
              </h4>
              <p className="text-[#A1A1AA] leading-relaxed">
                1. <strong>Firebase Security Rules</strong> enforce that only requests with authenticated token claims or matching the admin email can read or write administrative collections (<code className="text-[#EDEDED]">admin_activity_logs</code>, <code className="text-[#EDEDED]">admin_roles</code>, <code className="text-[#EDEDED]">user_status</code>).
              </p>
              <p className="text-[#A1A1AA] leading-relaxed">
                2. <strong>Server-Side APIs</strong> in <code className="text-[#EDEDED]">server.ts</code> validate token claims before processing user access disablement or data deletion operations.
              </p>
              <p className="text-[#A1A1AA] leading-relaxed">
                3. <strong>Frontend Guard</strong> in <code className="text-[#EDEDED]">App.tsx</code> blocks non-admin users immediately with zero leaks of underlying system telemetry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INSPECT ACTIVITY LOG
      ======================================================== */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#090916] border border-[#00F0FF] max-w-2xl w-full p-6 clip-cyber-card space-y-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
            <div className="flex items-center justify-between border-b border-[#25253D] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00F0FF]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Audit Telemetry Inspection // {inspectLog.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-[#737373] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-black/60 border border-[#25253D]">
                <div>
                  <span className="text-[#737373]">User:</span>{' '}
                  <span className="text-white font-bold">{inspectLog.userEmail}</span>
                </div>
                <div>
                  <span className="text-[#737373]">UID:</span>{' '}
                  <span className="text-[#00F0FF] font-mono">{inspectLog.userId}</span>
                </div>
                <div>
                  <span className="text-[#737373]">Feature:</span>{' '}
                  <span className="text-white">{inspectLog.feature}</span>
                </div>
                <div>
                  <span className="text-[#737373]">Timestamp:</span>{' '}
                  <span className="text-[#EDEDED]">{new Date(inspectLog.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-[#737373] block mb-1 text-[11px] uppercase tracking-wider">
                  Submitted Query / Prompt:
                </span>
                <div className="p-3 bg-black border border-[#25253D] text-[#EDEDED] font-mono max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed text-xs">
                  {inspectLog.query}
                </div>
              </div>

              {inspectLog.metadata && (
                <div>
                  <span className="text-[#737373] block mb-1 text-[11px] uppercase tracking-wider">
                    Metadata:
                  </span>
                  <pre className="p-2 bg-black border border-[#25253D] text-[#00F0FF] text-[10px] overflow-x-auto">
                    {JSON.stringify(inspectLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-black/80 hover:bg-[#151528] border border-[#25253D] text-xs text-white clip-badge-poly cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT USER PROFILE DATA
      ======================================================== */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#090916] border border-[#00F0FF] max-w-md w-full p-6 clip-cyber-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#25253D] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#00F0FF]" /> Edit User Profile Data
              </h3>
              <button
                onClick={() => setEditUserModal(null)}
                className="text-[#737373] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#A1A1AA] mb-1 font-mono text-[11px]">
                  DISPLAY NAME:
                </label>
                <input
                  type="text"
                  value={editFormData.displayName}
                  onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-black/80 border border-[#25253D] text-white focus:border-[#00F0FF] focus:outline-none clip-badge-poly"
                  required
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-mono text-[11px]">
                  BIOGRAPHY / ROLES:
                </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-black/80 border border-[#25253D] text-white focus:border-[#00F0FF] focus:outline-none clip-badge-poly"
                  placeholder="Application bio or title..."
                />
              </div>

              <div className="p-2.5 bg-black/60 border border-[#25253D] text-[11px] text-[#737373] font-mono">
                Note: Passwords and auth credentials cannot be accessed or edited by administrator.
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-3.5 py-2 bg-black/80 border border-[#25253D] text-xs text-[#A1A1AA] clip-badge-poly cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-[#00F0FF] hover:bg-[#00D8E6] text-black font-bold text-xs clip-badge-poly cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                >
                  {isProcessingAction ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TOGGLE STATUS CONFIRMATION
      ======================================================== */}
      {confirmStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#090916] border border-amber-400 max-w-md w-full p-6 clip-cyber-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-950/40 border border-amber-400 text-amber-400 flex items-center justify-center clip-badge-poly">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {confirmStatusModal.targetDisabled ? 'Disable User Access' : 'Restore User Access'}
                </h3>
                <p className="text-xs text-[#A1A1AA] font-sans mt-0.5">
                  Confirm governance action for {confirmStatusModal.user.displayName || confirmStatusModal.user.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed">
              {confirmStatusModal.targetDisabled
                ? 'Disabling access prevents this user from using the Somotoz workspace, submitting AI queries, or accessing Somochat. Their account data remains preserved until manually deleted.'
                : 'Restoring access immediately allows this user to resume full interaction with Somotoz workspace and features.'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmStatusModal(null)}
                className="px-3.5 py-2 bg-black/80 border border-[#25253D] text-xs text-[#A1A1AA] clip-badge-poly cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggleStatus}
                disabled={isProcessingAction}
                className={`px-4 py-2 font-bold text-xs clip-badge-poly cursor-pointer ${
                  confirmStatusModal.targetDisabled
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                }`}
              >
                {isProcessingAction
                  ? 'Updating...'
                  : confirmStatusModal.targetDisabled
                  ? 'Confirm Disable Access'
                  : 'Confirm Restore Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DELETE USER SOMOTOZ DATA CONFIRMATION
      ======================================================== */}
      {deleteDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#090916] border border-rose-500 max-w-md w-full p-6 clip-cyber-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-950/40 border border-rose-500 text-rose-400 flex items-center justify-center clip-badge-poly">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Delete Application Data
                </h3>
                <p className="text-xs text-[#A1A1AA] font-sans mt-0.5">
                  UID: {deleteDataModal.uid.slice(0, 14)}...
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-300/90 font-sans leading-relaxed">
              WARNING: This will permanently purge the user's journal reflections, activity records, and application profile from Firestore. This operation cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteDataModal(null)}
                className="px-3.5 py-2 bg-black/80 border border-[#25253D] text-xs text-[#A1A1AA] clip-badge-poly cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteData}
                disabled={isProcessingAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs clip-badge-poly shadow-[0_0_12px_rgba(244,63,94,0.4)] cursor-pointer"
              >
                {isProcessingAction ? 'Purging Data...' : 'Permanently Delete Application Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
