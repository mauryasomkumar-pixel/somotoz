import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logoutUser, cleanForFirestore } from './lib/firebase';
import { JournalEntry, UserProfile, ViewMode, GenerationMode, AIReflectionResponse, UserActivityLog } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CommandSidebar } from './components/CommandSidebar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ReflectionEditor } from './components/ReflectionEditor';
import { ReflectionDetail } from './components/ReflectionDetail';
import { ChatCompanion } from './components/ChatCompanion';
import { WisdomExplorer } from './components/WisdomExplorer';
import { SoundscapePlayer } from './components/SoundscapePlayer';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ProfileModal } from './components/ProfileModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Loader2, Terminal, BookOpen } from 'lucide-react';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal data state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Real User Activity Logs
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  
  // Navigation & Mode state (Default to 'dashboard' on login)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activeChatMode, setActiveChatMode] = useState<GenerationMode>('text');
  
  const [isSubmittingAI, setIsSubmittingAI] = useState<boolean>(false);
  const [chatReflectionAnchor, setChatReflectionAnchor] = useState<JournalEntry | null>(null);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // UI state
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    entry: JournalEntry | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    entry: null,
    isDeleting: false,
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (user) {
          // Check if custom user profile document exists in Firestore
          let customProfile: Partial<UserProfile> = {};
          try {
            const profileDocRef = doc(db, 'users', user.uid, 'profile', 'main');
            const profileSnap = await getDoc(profileDocRef);
            if (profileSnap.exists()) {
              customProfile = profileSnap.data() as Partial<UserProfile>;
            }
          } catch (e) {
            console.warn('Could not read user profile from firestore, using auth defaults', e);
          }

          setCurrentUser({
            uid: user.uid,
            displayName: customProfile.displayName || user.displayName || 'Som Maurya',
            email: customProfile.email || user.email || 'mauryasomkumar@gmail.com',
            photoURL: customProfile.photoURL || user.photoURL,
            phoneNumber: customProfile.phoneNumber || null,
            bio: customProfile.bio || 'AI Architect & Data Engineer',
          });
          setAuthError(null);
        } else {
          setCurrentUser(null);
          setEntries([]);
          setActivityLogs([]);
          setSelectedEntryId(null);
          setViewMode('dashboard');
        }
        setIsAuthChecking(false);
      },
      (error) => {
        console.error('Firebase Auth State Error:', error);
        setAuthError(error.message);
        setIsAuthChecking(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Subscriptions for User's Entries
  useEffect(() => {
    if (!currentUser?.uid) {
      setEntries([]);
      setIsLoadingEntries(false);
      return;
    }

    setIsLoadingEntries(true);
    const userEntriesRef = collection(db, 'users', currentUser.uid, 'entries');
    const q = query(userEntriesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedEntries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedEntries.push({
            id: docSnap.id,
            userId: currentUser.uid,
            title: data.title || 'Untitled Reflection',
            content: data.content || '',
            aiResponse: data.aiResponse || null,
            moodTags: data.moodTags || [],
            artworkData: data.artworkData,
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt,
            wordCount: data.wordCount || 0,
            isFavorite: !!data.isFavorite,
          });
        });
        setEntries(loadedEntries);
        setIsLoadingEntries(false);
      },
      (error) => {
        console.error('Firestore entries listener error:', error);
        addToast('error', 'Sync Failed', 'Could not sync entries with Firestore. Please check your connection.');
        setIsLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, addToast]);

  // 3. Real-time Firestore Subscriptions for User's Activity Logs
  useEffect(() => {
    if (!currentUser?.uid) {
      setActivityLogs([]);
      return;
    }

    const activitiesRef = collection(db, 'users', currentUser.uid, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedLogs: UserActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedLogs.push({
            id: docSnap.id,
            userId: currentUser.uid,
            mode: data.mode || 'text',
            action: data.action || 'System Operation',
            timestamp: data.timestamp || Date.now(),
            tokens: data.tokens || 100,
            metadata: data.metadata,
          });
        });
        setActivityLogs(loadedLogs);
      },
      (error) => {
        console.warn('Firestore activity listener notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Helper to record a real activity event in Firestore and state
  const logActivity = useCallback(
    async (mode: GenerationMode, action: string, tokens?: number, metadata?: Record<string, any>) => {
      if (!currentUser?.uid) return;
      const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const logObj: UserActivityLog = {
        id: logId,
        userId: currentUser.uid,
        mode,
        action,
        timestamp: Date.now(),
        tokens: tokens || 120,
        metadata,
      };

      // Optimistic local state update
      setActivityLogs((prev) => [logObj, ...prev]);

      try {
        const actDocRef = doc(db, 'users', currentUser.uid, 'activities', logId);
        await setDoc(actDocRef, cleanForFirestore(logObj));
      } catch (err) {
        console.warn('Could not persist activity log to Firestore:', err);
      }
    },
    [currentUser?.uid]
  );

  // Handle Profile Updates from ProfileModal
  const handleUpdateProfile = async (
    updatedData: Partial<UserProfile>,
    passwordData?: { currentPass: string; newPass: string }
  ) => {
    if (!currentUser?.uid) return;

    // Simulate network delay for real-world feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Save to Firestore
    try {
      const profileDocRef = doc(db, 'users', currentUser.uid, 'profile', 'main');
      await setDoc(
        profileDocRef,
        cleanForFirestore({
          ...updatedData,
          uid: currentUser.uid,
          updatedAt: Date.now(),
        }),
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore profile persist note:', err);
    }

    // Update currentUser state immediately
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedData,
      };
    });

    // Log this profile configuration event
    logActivity('text', 'Profile and security configuration updated', 50);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      addToast('success', 'Access Granted', 'Successfully authenticated with Google.');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        const errorMsg = err?.message || 'Authentication failed. Please try again.';
        setAuthError(errorMsg);
        addToast('error', 'Sign-in Error', errorMsg);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      addToast('info', 'Signed Out', 'You have been safely signed out.');
    } catch (err: any) {
      console.error('Logout error:', err);
      addToast('error', 'Sign Out Error', err.message);
    }
  };

  // Handle Navigation from any button/sidebar
  const handleNavigate = (view: ViewMode, chatMode?: GenerationMode) => {
    if (chatMode) {
      setActiveChatMode(chatMode);
    }
    setViewMode(view);
  };

  // Handle New Entry Submission to Gemini & Firestore
  const handleCreateOrUpdateReflection = async (
    content: string,
    customTitle?: string,
    promptType?: string
  ) => {
    if (!currentUser?.uid) {
      addToast('error', 'Authentication Required', 'You must be logged in to save reflections.');
      return;
    }

    setIsSubmittingAI(true);
    try {
      // Step 1: Call Gemini API proxy endpoint
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          promptType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const { reflection } = await response.json();

      const wordCount = content.trim().split(/\s+/).length;
      const finalTitle = customTitle || reflection?.title || 'Personal Reflection';
      const moodTags = reflection?.moodTags || ['#reflective'];

      const aiPayload: AIReflectionResponse = {
        title: finalTitle,
        conversationalReply: reflection?.conversationalReply || 'Reflection recorded.',
        moodTags: moodTags,
        actionableTakeaways: reflection?.actionableTakeaways || [],
      };

      // Determine entry ID (new or existing edit)
      const isEditing = viewMode === 'edit' && selectedEntryId;
      const entryId = isEditing ? selectedEntryId! : `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = Date.now();

      const rawEntryData = {
        id: entryId,
        userId: currentUser.uid,
        title: finalTitle,
        content: content,
        aiResponse: aiPayload,
        moodTags: moodTags,
        createdAt: isEditing ? (entries.find((e) => e.id === entryId)?.createdAt || now) : now,
        updatedAt: now,
        wordCount: wordCount,
        isFavorite: isEditing ? (entries.find((e) => e.id === entryId)?.isFavorite || false) : false,
      };

      // Clean undefineds before saving to Firestore
      const cleanData = cleanForFirestore(rawEntryData);

      // Step 2: Persist to user-isolated path `users/{userId}/entries/{entryId}`
      const entryDocRef = doc(db, 'users', currentUser.uid, 'entries', entryId);
      await setDoc(entryDocRef, cleanData);

      // Record Activity
      logActivity(
        'text',
        isEditing ? `Updated reflection: "${finalTitle}"` : `Created reflection: "${finalTitle}"`,
        Math.round(wordCount * 1.3)
      );

      // Step 3: Switch to View mode with the created/updated entry
      setSelectedEntryId(entryId);
      setViewMode('view');
      addToast(
        'success',
        isEditing ? 'Reflection Updated' : 'Reflection Recorded',
        'Empathetic insights and mood tags generated successfully.'
      );
    } catch (error: any) {
      console.error('Reflection submission error:', error);
      addToast('error', 'Reflection Failed', error.message || 'Could not process reflection.');
      throw error;
    } finally {
      setIsSubmittingAI(false);
    }
  };

  // Update Artwork for an entry
  const handleUpdateEntryArtwork = async (entryId: string, svgData: string) => {
    if (!currentUser?.uid) return;
    try {
      const entryDocRef = doc(db, 'users', currentUser.uid, 'entries', entryId);
      await updateDoc(entryDocRef, { artworkData: svgData });
      
      logActivity('image', 'Generated SVG mood artwork', 240);
      addToast('success', 'Visual Art Saved', 'Your generated mood artwork was stored with this reflection.');
    } catch (err: any) {
      console.error('Error saving artwork:', err);
      addToast('error', 'Artwork Save Failed', err.message);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (entryId: string, currentFav: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.uid) return;

    try {
      const entryDocRef = doc(db, 'users', currentUser.uid, 'entries', entryId);
      await updateDoc(entryDocRef, { isFavorite: !currentFav });
      addToast('info', !currentFav ? 'Added to Starred' : 'Removed from Starred');
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err);
      addToast('error', 'Update Failed', err.message);
    }
  };

  // Delete Entry Request
  const handleRequestDelete = (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      entry,
      isDeleting: false,
    });
  };

  // Confirm Delete Entry
  const handleConfirmDelete = async () => {
    if (!currentUser?.uid || !deleteModal.entry) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const entryId = deleteModal.entry.id;
      const entryDocRef = doc(db, 'users', currentUser.uid, 'entries', entryId);
      await deleteDoc(entryDocRef);

      if (selectedEntryId === entryId) {
        setSelectedEntryId(null);
        setViewMode('write');
      }

      addToast('info', 'Reflection Deleted', 'The journal entry was permanently removed.');
      setDeleteModal({ isOpen: false, entry: null, isDeleting: false });
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast('error', 'Delete Failed', err.message);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Open Chat anchored on a specific reflection
  const handleOpenChatWithReflection = (entry: JournalEntry) => {
    setChatReflectionAnchor(entry);
    setActiveChatMode('text');
    setViewMode('chat');
  };

  // Save synthesized chat response to Journal
  const handleSaveChatToJournal = (content: string, title?: string) => {
    handleCreateOrUpdateReflection(content, title);
  };

  // Current Selected Entry
  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || null;

  // Manual or Federated Local Auth Handler
  const handleManualAuth = (user: UserProfile) => {
    setCurrentUser(user);
    addToast('success', 'Access Granted', `Neural workspace online. Welcome, ${user.displayName || 'Engineer'}!`);
  };

  // Render Skeleton while checking initial auth status
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center space-y-4 font-mono">
        <div className="w-12 h-12 bg-black border border-[#00FF41] flex items-center justify-center text-[#00FF41] shadow-[4px_4px_0px_0px_#00FF41] animate-pulse">
          <Terminal className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-[#00FF41] flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#00FF41]" />
          INITIALIZING SOMOTOZ NEURAL KERNEL...
        </p>
      </div>
    );
  }

  // Render Landing Page if unauthenticated
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onSignIn={handleGoogleSignIn}
          onManualAuth={handleManualAuth}
          isAuthenticating={isAuthenticating}
          authError={authError}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const isJournalView = viewMode === 'write' || viewMode === 'view' || viewMode === 'edit';
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Som Maurya';

  // Render Authenticated Dashboard & Engineering Workspace
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col h-screen overflow-hidden font-sans selection:bg-[#00FF41] selection:text-black transition-colors duration-300">
      
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        entryCount={entries.length}
        currentView={viewMode}
        onSelectView={handleNavigate}
        onNewReflection={() => {
          setSelectedEntryId(null);
          setViewMode('write');
        }}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        isSidebarOpen={isSidebarOpenMobile}
      />

      {/* Main Workspace Layout (Sidebar + Main Content Area) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Command Sidebar for Quick Multi-Modal Navigation */}
        <CommandSidebar
          currentView={viewMode}
          currentChatMode={activeChatMode}
          onSelectView={handleNavigate}
          onNewReflection={() => {
            setSelectedEntryId(null);
            setViewMode('write');
          }}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          user={currentUser}
          entryCount={entries.length}
          entries={entries}
          onSelectEntry={(entry) => {
            setSelectedEntryId(entry.id);
            setViewMode('view');
          }}
          onDeleteEntry={handleRequestDelete}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        {/* Secondary Journal Entry List Sidebar when inside Journal Views */}
        {isJournalView && (
          <Sidebar
            entries={entries}
            selectedEntryId={selectedEntryId}
            isLoading={isLoadingEntries}
            onSelectEntry={(entry) => {
              setSelectedEntryId(entry.id);
              setViewMode('view');
            }}
            onNewReflection={() => {
              setSelectedEntryId(null);
              setViewMode('write');
            }}
            onToggleFavorite={handleToggleFavorite}
            onRequestDelete={handleRequestDelete}
            isOpenMobile={false}
            onCloseMobile={() => {}}
          />
        )}

        {/* Right Main Content Area */}
        {/* Main Workspace Dynamic View Port */}
        <main className={`flex-1 overflow-y-auto bg-[var(--bg-primary)] relative transition-colors duration-300 ${viewMode === 'chat' ? 'p-1 sm:p-2 md:p-3 h-[calc(100vh-3.5rem)] flex flex-col' : 'p-4 sm:p-6'}`}>
          
          {/* 1. COMMAND DASHBOARD VIEW */}
          {viewMode === 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              <Dashboard
                user={currentUser}
                entries={entries}
                activityLogs={activityLogs}
                onNavigate={handleNavigate}
                onNewReflection={() => {
                  setSelectedEntryId(null);
                  setViewMode('write');
                }}
                onOpenProfile={() => setIsProfileModalOpen(true)}
              />
            </div>
          )}

          {/* 2. JOURNAL WRITE VIEW */}
          {viewMode === 'write' && (
            <div className="max-w-5xl mx-auto">
              <ReflectionEditor
                isSubmitting={isSubmittingAI}
                onSubmit={handleCreateOrUpdateReflection}
                userName={userName}
              />
            </div>
          )}

          {/* 3. JOURNAL EDIT VIEW */}
          {viewMode === 'edit' && selectedEntry && (
            <div className="max-w-5xl mx-auto">
              <ReflectionEditor
                initialTitle={selectedEntry.title}
                initialContent={selectedEntry.content}
                isSubmitting={isSubmittingAI}
                onSubmit={handleCreateOrUpdateReflection}
                onCancelEdit={() => setViewMode('view')}
                isEditMode={true}
                userName={userName}
              />
            </div>
          )}

          {/* 4. JOURNAL DETAIL VIEW */}
          {viewMode === 'view' && selectedEntry && (
            <div className="max-w-5xl mx-auto">
              <ReflectionDetail
                entry={selectedEntry}
                onEdit={() => setViewMode('edit')}
                onDelete={handleRequestDelete}
                onToggleFavorite={handleToggleFavorite}
                onNewReflection={() => {
                  setSelectedEntryId(null);
                  setViewMode('write');
                }}
                onOpenChatWithReflection={handleOpenChatWithReflection}
                onUpdateEntryArtwork={handleUpdateEntryArtwork}
              />
            </div>
          )}

          {/* Fallback if in view mode without selected entry */}
          {viewMode === 'view' && !selectedEntry && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#737373] font-mono">
              <div className="w-12 h-12 bg-black border border-[#262626] flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-[#00FF41]" />
              </div>
              <h3 className="text-sm font-bold text-[#EDEDED]">NO NOTE SELECTED</h3>
              <p className="text-xs text-[#737373] mt-1 max-w-sm font-sans">
                Select an entry from the sidebar to view details, or start a new note.
              </p>
              <button
                onClick={() => setViewMode('write')}
                className="mt-4 px-4 py-2 bg-[#00FF41] hover:bg-[#00E038] text-black font-mono font-bold text-xs shadow-[2px_2px_0px_0px_#262626] cursor-pointer"
              >
                Write New Note
              </button>
            </div>
          )}

          {/* 5. MULTIMODAL SYNTHESIS CHAT VIEW */}
          {viewMode === 'chat' && (
            <div className="h-full flex-1 flex flex-col min-h-0">
              <ChatCompanion
                initialReflection={chatReflectionAnchor}
                initialMode={activeChatMode}
                onSaveToJournal={handleSaveChatToJournal}
                onActivityLog={(mode, action, tokens) => logActivity(mode, action, tokens)}
              />
            </div>
          )}

          {/* 6. WISDOM SEARCH EXPLORER VIEW */}
          {viewMode === 'wisdom' && (
            <div className="max-w-6xl mx-auto">
              <WisdomExplorer />
            </div>
          )}

          {/* 7. NEURAL SOUNDSCAPES & 432HZ SYNTH PLAYER */}
          {viewMode === 'soundscapes' && (
            <div className="max-w-5xl mx-auto">
              <SoundscapePlayer />
            </div>
          )}
        </main>
      </div>

      {/* Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onShowToast={addToast}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        entryTitle={deleteModal.entry?.title || ''}
        isDeleting={deleteModal.isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, entry: null, isDeleting: false })}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
