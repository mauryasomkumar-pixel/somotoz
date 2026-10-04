import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  Check,
  X,
  ShieldAlert,
  Clock,
  Send,
  Users,
  Search,
  CheckCheck,
  Ban,
  Unlock,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { SomoChatRequest, SomoUser, SomoRegisteredAccount } from '../../types';

interface SomochatRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mySomoUser: SomoRegisteredAccount;
  allRequests: SomoChatRequest[];
  onAcceptRequest: (request: SomoChatRequest) => void;
  onDeclineRequest: (requestId: string) => void;
  onBlockUser: (targetSomoId: string) => void;
  onUnblockUser: (targetSomoId: string) => void;
  directory: SomoUser[];
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SomochatRequestsModal: React.FC<SomochatRequestsModalProps> = ({
  isOpen,
  onClose,
  mySomoUser,
  allRequests,
  onAcceptRequest,
  onDeclineRequest,
  onBlockUser,
  onUnblockUser,
  directory,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'blocked'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter incoming requests addressed to me
  const incomingRequests = allRequests.filter(
    (req) => req.toSomoId === mySomoUser.somoId && req.status === 'pending'
  );

  // Filter outgoing requests initiated by me
  const outgoingRequests = allRequests.filter(
    (req) => req.fromSomoId === mySomoUser.somoId && req.status === 'pending'
  );

  // Filter blocked users
  const blockedIds = mySomoUser.privacySettings?.blockedSomoIds || [];
  const blockedUsers = directory.filter((u) => blockedIds.includes(u.somoId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>CONNECTION PROTOCOL</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  E2EE MESH
                </span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Manage human chat invitations, approvals, and security blocklists.
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

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 my-4 p-1 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'incoming'
                ? 'bg-[#00F0FF] text-black shadow-md shadow-[#00F0FF]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Incoming</span>
            {incomingRequests.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'incoming' ? 'bg-black text-[#00F0FF]' : 'bg-[#00F0FF] text-black'
              }`}>
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'outgoing'
                ? 'bg-[#A855F7] text-white shadow-md shadow-[#A855F7]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Sent</span>
            {outgoingRequests.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'outgoing' ? 'bg-white text-[#A855F7]' : 'bg-[#A855F7] text-white'
              }`}>
                {outgoingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocked')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'blocked'
                ? 'bg-[#FF007A] text-white shadow-md shadow-[#FF007A]/25 font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Ban className="w-3 h-3" />
            <span>Blocked ({blockedUsers.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          
          {/* TAB 1: INCOMING REQUESTS */}
          {activeTab === 'incoming' && (
            <div>
              {incomingRequests.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] space-y-2">
                  <CheckCheck className="w-10 h-10 mx-auto text-[#00FF41]/40" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">All Caught Up!</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    No pending connection requests. Share your Somo ID <span className="text-[#00F0FF] font-bold">{mySomoUser.somoId}</span> to connect with peers.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-2xl bg-[var(--bg-input)]/90 border border-[var(--border-color)] hover:border-[#00F0FF]/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={req.fromAvatar}
                          alt={req.fromName}
                          className="w-11 h-11 rounded-full object-cover border border-[#00F0FF]/40 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {req.fromName}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00F0FF]/15 text-[#00F0FF] font-mono">
                              {req.fromSomoId}
                            </span>
                          </div>
                          {req.note ? (
                            <p className="text-[11px] text-[var(--text-secondary)] italic mt-1 bg-black/20 p-1.5 rounded-lg border border-[var(--border-color)]">
                              "{req.note}"
                            </p>
                          ) : (
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                              Requested peer chat connection.
                            </p>
                          )}
                          <span className="text-[9px] text-[var(--text-muted)] block mt-1">
                            {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
                        <button
                          type="button"
                          onClick={() => {
                            onAcceptRequest(req);
                            onShowToast('success', 'Chat Request Accepted', `Connected with ${req.fromName}!`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00FF41] to-[#00F0FF] text-black font-black text-xs hover:brightness-110 flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onDeclineRequest(req.id);
                            onShowToast('info', 'Request Declined', `Declined request from ${req.fromName}.`);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold cursor-pointer"
                        >
                          <span>Decline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onBlockUser(req.fromSomoId);
                            onShowToast('error', 'User Blocked', `Blocked ${req.fromName}.`);
                          }}
                          title="Block User Permanently"
                          className="p-1.5 rounded-xl bg-[var(--bg-card)] border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SENT OUTGOING REQUESTS */}
          {activeTab === 'outgoing' && (
            <div>
              {outgoingRequests.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] space-y-2">
                  <Send className="w-10 h-10 mx-auto text-[#A855F7]/40" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">No Outgoing Requests</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Browse the User Directory to send chat invitations to verified peers.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center text-[#A855F7] font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>To: {req.toName}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#A855F7]/15 text-[#A855F7] font-mono">
                              {req.toSomoId}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-[#FFB800]" />
                            <span>Awaiting peer approval...</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onDeclineRequest(req.id);
                          onShowToast('info', 'Request Cancelled', `Cancelled request to ${req.toName}.`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-red-500/40 text-red-400 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BLOCKED USERS */}
          {activeTab === 'blocked' && (
            <div>
              {blockedUsers.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] space-y-2">
                  <ShieldAlert className="w-10 h-10 mx-auto text-[#00FF41]/40" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">Blocklist is Clean</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    You have not blocked any peers. Blocked users cannot message, request, or view your stories.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((user) => (
                    <div
                      key={user.somoId}
                      className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover grayscale border border-red-500/50"
                        />
                        <div>
                          <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-mono">
                              {user.somoId}
                            </span>
                          </div>
                          <p className="text-[10px] text-red-400/80 mt-0.5">
                            Blocked from sending messages or requests.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUnblockUser(user.somoId);
                          onShowToast('success', 'User Unblocked', `Unblocked ${user.name}.`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00FF41] to-[#00F0FF] text-black font-black text-xs hover:brightness-110 flex items-center gap-1 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unblock</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>Zero-Knowledge Human Protection Engine</span>
          <span className="text-[#00F0FF]">IIT Madras Cyber Architecture</span>
        </div>
      </motion.div>
    </div>
  );
};
