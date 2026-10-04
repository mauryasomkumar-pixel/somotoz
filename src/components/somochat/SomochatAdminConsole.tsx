import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Users,
  Sparkles,
  Award,
  Radio,
  Trash2,
  Check,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Send,
  Copy,
  UserPlus,
  RefreshCw,
  Sliders,
  Flame,
  CheckCheck
} from 'lucide-react';
import {
  SomoRegisteredAccount,
  SomoUser,
  SomoUserRole,
  SomoSubAdminPermissions
} from '../../types';
import {
  generateUniqueSomoId,
  generateMasterSubAdminKey
} from '../../utils/somoCrypto';

interface SomochatAdminConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SomoRegisteredAccount;
  allAccounts: SomoRegisteredAccount[];
  onUpdateAccount: (updatedAccount: SomoRegisteredAccount) => void;
  onBroadcastAnnouncement: (title: string, message: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SomochatAdminConsole: React.FC<SomochatAdminConsoleProps> = ({
  isOpen,
  onClose,
  currentUser,
  allAccounts,
  onUpdateAccount,
  onBroadcastAnnouncement,
  onShowToast,
}) => {
  const isMasterAdmin =
    currentUser.role === 'admin' ||
    currentUser.somoId === 'SOMO-SOM-001' ||
    currentUser.email?.toLowerCase() === 'mauryasomkumar@gmail.com' ||
    currentUser.name.toLowerCase().includes('som maurya');

  const isSubAdmin = currentUser.role === 'sub_admin';

  const [activeTab, setActiveTab] = useState<'rbac' | 'id_issuer' | 'broadcast' | 'moderation'>('rbac');

  // RBAC Promotion Modal States
  const [selectedUserForPromo, setSelectedUserForPromo] = useState<SomoRegisteredAccount | null>(null);
  const [promoPerms, setPromoPerms] = useState<SomoSubAdminPermissions>({
    canManageDirectory: true,
    canIssueBadges: true,
    canModerateFeed: true,
    canBroadcastAlerts: false,
    grantedBy: currentUser.somoId,
    grantedAt: Date.now(),
  });

  // Somo ID & Badge Issuer Form
  const [issuerTargetUser, setIssuerTargetUser] = useState<string>('');
  const [customHandlePrefix, setCustomHandlePrefix] = useState('IITM');
  const [customBadgeName, setCustomBadgeName] = useState('IIT MADRAS');
  const [customBadgeColor, setCustomBadgeColor] = useState('#00F0FF');

  // Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  if (!isOpen) return null;

  // If user is neither Master Admin nor Sub-Admin: show security challenge screen
  if (!isMasterAdmin && !isSubAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-[var(--bg-card)] border border-red-500/50 rounded-3xl p-6 shadow-2xl text-center relative"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400 mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-black text-white">ACCESS RESTRICTED</h2>
          <p className="text-xs text-red-300/80 mt-1">
            Master Admin Authorization Required. This section is restricted to <strong>Som Maurya (Master Admin)</strong> and authorized Sub-Admins.
          </p>

          <div className="my-5 p-3 rounded-xl bg-black/50 border border-[var(--border-color)] text-left text-[11px] text-[var(--text-muted)] space-y-1">
            <div><strong>Your Terminal ID:</strong> <span className="text-[#00F0FF]">{currentUser.somoId}</span></div>
            <div><strong>Access Level:</strong> <span className="text-yellow-400">{currentUser.role.toUpperCase()}</span></div>
            <div><strong>Required Level:</strong> <span className="text-red-400">ADMIN / SUB-ADMIN</span></div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-white text-xs font-bold hover:bg-[var(--border-color)] cursor-pointer"
          >
            Return to Matrix
          </button>
        </motion.div>
      </div>
    );
  }

  // Handle Promote to Sub-Admin
  const handleSaveSubAdminPromotion = () => {
    if (!selectedUserForPromo) return;

    const authKey = generateMasterSubAdminKey(selectedUserForPromo.username || 'NODE');
    const updated: SomoRegisteredAccount = {
      ...selectedUserForPromo,
      role: 'sub_admin',
      customBadge: 'SUB-ADMIN',
      subAdminPermissions: {
        ...promoPerms,
        grantedBy: currentUser.somoId,
        grantedAt: Date.now(),
        authKey,
      },
    };

    onUpdateAccount(updated);
    setSelectedUserForPromo(null);
    onShowToast('success', 'Sub-Admin Authorized', `Promoted ${updated.name} with key: ${authKey}`);
  };

  // Handle Revoke Sub-Admin
  const handleRevokeSubAdmin = (account: SomoRegisteredAccount) => {
    const updated: SomoRegisteredAccount = {
      ...account,
      role: 'member',
      customBadge: 'VERIFIED PEER',
      subAdminPermissions: undefined,
    };
    onUpdateAccount(updated);
    onShowToast('info', 'Sub-Admin Revoked', `Revoked Sub-Admin status for ${account.name}.`);
  };

  // Handle Issue Custom Somo ID & Badge
  const handleIssueCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const target = allAccounts.find((a) => a.somoId === issuerTargetUser);
    if (!target) {
      onShowToast('error', 'Select User', 'Please select a registered human to issue custom credentials.');
      return;
    }

    const newSomoId = generateUniqueSomoId(customHandlePrefix, target.username?.slice(0, 4) || 'PEER');
    const updated: SomoRegisteredAccount = {
      ...target,
      somoId: newSomoId,
      customBadge: customBadgeName.trim().toUpperCase(),
      colorTheme: customBadgeColor,
      isVerified: true,
    };

    onUpdateAccount(updated);
    onShowToast('success', 'Credentials Issued', `Assigned ID ${newSomoId} and badge "${customBadgeName}" to ${target.name}!`);
    setIssuerTargetUser('');
  };

  // Handle Broadcast Matrix Announcement
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      onShowToast('error', 'Missing Content', 'Please enter both announcement title and message body.');
      return;
    }

    setIsBroadcasting(true);
    setTimeout(() => {
      onBroadcastAnnouncement(broadcastTitle.trim(), broadcastMessage.trim());
      setIsBroadcasting(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      onShowToast('success', 'Network Broadcast Sent', 'Master broadcast sent across # global-matrix!');
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00F0FF]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-[#A855F7] p-[2px] shadow-lg shadow-[#00F0FF]/30">
              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center text-[#00F0FF]">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>{isMasterAdmin ? 'MASTER ADMIN CONSOLE' : 'SUB-ADMIN OPERATIONS'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/40 font-bold">
                  {isMasterAdmin ? 'SOM MAURYA AUTH' : 'NODE CONTROLLER'}
                </span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Role-based access control, vanity Somo ID issuance, and matrix broadcasts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-input)] hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 p-1 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('rbac')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black shadow-md shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>RBAC & Roles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('id_issuer')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'id_issuer'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black shadow-md shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>ID & Badges</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black shadow-md shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcasts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#A855F7] text-black shadow-md shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Moderation</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[260px] relative z-10">

          {/* ========================================================================= */}
          {/* TAB 1: RBAC & SUB-ADMIN AUTHORIZATION                                    */}
          {/* ========================================================================= */}
          {activeTab === 'rbac' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs text-[var(--text-secondary)] flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--text-primary)]">Master Admin Role Authority:</span> Only Som Maurya holds cryptographic master permission to issue and revoke Sub-Admin delegation keys.
                </div>
              </div>

              <div className="space-y-2">
                {allAccounts.map((account) => {
                  const isThisMaster = account.somoId === 'SOMO-SOM-001' || account.role === 'admin';
                  const isAccountSubAdmin = account.role === 'sub_admin';

                  return (
                    <div
                      key={account.somoId}
                      className="p-3 rounded-2xl bg-[var(--bg-input)]/90 border border-[var(--border-color)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <img
                          src={account.avatar}
                          alt={account.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#00F0FF]/30 shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {account.name}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              isThisMaster
                                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                                : isAccountSubAdmin
                                ? 'bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40'
                                : 'bg-[var(--border-color)] text-[var(--text-muted)]'
                            }`}>
                              {account.customBadge || account.role.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                            {account.somoId} • @{account.username}
                          </div>
                        </div>
                      </div>

                      {/* Promotion / Revocation Actions */}
                      {isMasterAdmin && !isThisMaster && (
                        <div className="flex items-center space-x-2 shrink-0">
                          {isAccountSubAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleRevokeSubAdmin(account)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/30 cursor-pointer"
                            >
                              Revoke Sub-Admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForPromo(account);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40 text-xs font-bold hover:bg-[#00FF41]/30 cursor-pointer flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Authorize Sub-Admin</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: VANITY SOMO ID & BADGE ISSUER                                     */}
          {/* ========================================================================= */}
          {activeTab === 'id_issuer' && (
            <form onSubmit={handleIssueCustomBadge} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/30 text-xs text-[var(--text-secondary)]">
                Assign exclusive vanity IDs and verified badges (e.g. <strong>IIT MADRAS</strong>, <strong>RESEARCH FELLOW</strong>, <strong>VIP</strong>) to active humans.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Select Target User
                </label>
                <select
                  value={issuerTargetUser}
                  onChange={(e) => setIssuerTargetUser(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                >
                  <option value="">-- Choose Verified Human --</option>
                  {allAccounts.map((acc) => (
                    <option key={acc.somoId} value={acc.somoId}>
                      {acc.name} ({acc.somoId}) - @{acc.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    ID Prefix Code
                  </label>
                  <input
                    type="text"
                    value={customHandlePrefix}
                    onChange={(e) => setCustomHandlePrefix(e.target.value.toUpperCase().slice(0, 8))}
                    placeholder="e.g. IITM or CREATOR"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Custom Badge Title
                  </label>
                  <input
                    type="text"
                    value={customBadgeName}
                    onChange={(e) => setCustomBadgeName(e.target.value)}
                    placeholder="e.g. IIT MADRAS"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  {['#00F0FF', '#00FF41', '#A855F7', '#FF007A', '#FFB800'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCustomBadgeColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        customBadgeColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#A855F7] to-[#FF007A] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
              >
                Issue Verified Vanity Somo ID
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: NETWORK MATRIX SYSTEM BROADCAST                                   */}
          {/* ========================================================================= */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/30 text-xs text-[var(--text-secondary)]">
                Broadcast official Master Admin bulletins to all network nodes in <strong># global-matrix</strong>.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Broadcast Title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. SOMOTOZ SUITE KERNEL v2.4 DEPLOYED"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Broadcast Message Body
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Detailed network update or system announcement..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#00FF41] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Radio className="w-4 h-4" />
                <span>{isBroadcasting ? 'TRANSMITTING ACROSS NODES...' : 'TRANSMIT BROADCAST'}</span>
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MODERATION & SECURITY                                             */}
          {/* ========================================================================= */}
          {activeTab === 'moderation' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                Security enforcement: Suspend suspicious nodes or refresh cryptographic key pairs.
              </div>

              <div className="space-y-2">
                {allAccounts.map((acc) => {
                  const isThisMaster = acc.somoId === 'SOMO-SOM-001';

                  return (
                    <div
                      key={acc.somoId}
                      className="p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className={`w-9 h-9 rounded-full object-cover ${acc.isSuspended ? 'grayscale' : ''}`}
                        />
                        <div>
                          <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {acc.isSuspended && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                                SUSPENDED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {acc.email} • {acc.phoneNumber || 'No phone'}
                          </div>
                        </div>
                      </div>

                      {!isThisMaster && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated: SomoRegisteredAccount = {
                                ...acc,
                                isSuspended: !acc.isSuspended,
                              };
                              onUpdateAccount(updated);
                              onShowToast(
                                updated.isSuspended ? 'error' : 'success',
                                updated.isSuspended ? 'Node Suspended' : 'Node Restored',
                                `${acc.name} is now ${updated.isSuspended ? 'suspended' : 'active'}.`
                              );
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                              acc.isSuspended
                                ? 'bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40 hover:bg-[#00FF41]/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            }`}
                          >
                            {acc.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Sub-Admin Grant Permission Modal */}
        <AnimatePresence>
          {selectedUserForPromo && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-[var(--bg-card)] border-2 border-[#00FF41] rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00FF41]/20 border border-[#00FF41]/40 flex items-center justify-center text-[#00FF41]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">SUB-ADMIN DELEGATION</h3>
                    <p className="text-xs text-[#00FF41] font-mono">
                      Authorize {selectedUserForPromo.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 my-4">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Granted Operational Scopes:
                  </span>

                  {[
                    { key: 'canManageDirectory', label: 'User Directory & Verification Management' },
                    { key: 'canIssueBadges', label: 'Issue Custom Verified Badges' },
                    { key: 'canModerateFeed', label: 'Moderate Global Message Feed' },
                    { key: 'canBroadcastAlerts', label: 'Broadcast Network Alerts' },
                  ].map((scope) => (
                    <label
                      key={scope.key}
                      className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(promoPerms[scope.key as keyof SomoSubAdminPermissions])}
                        onChange={(e) =>
                          setPromoPerms({
                            ...promoPerms,
                            [scope.key]: e.target.checked,
                          })
                        }
                        className="rounded text-[#00FF41] focus:ring-0"
                      />
                      <span className="text-xs text-[var(--text-primary)]">{scope.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForPromo(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-white text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSubAdminPromotion}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00FF41] to-[#00F0FF] text-black text-xs font-black hover:brightness-110 cursor-pointer shadow-md"
                  >
                    Sign & Authorize
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
