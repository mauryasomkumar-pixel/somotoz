import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, onIdTokenChanged, User } from 'firebase/auth';
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
import { NavigationRail } from './components/NavigationRail';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ReflectionEditor } from './components/ReflectionEditor';
import { ReflectionDetail } from './components/ReflectionDetail';
import { ChatCompanion } from './components/ChatCompanion';
import { Somochat } from './components/Somochat';
import { DiscoverView } from './components/DiscoverView';
import { ProfileView } from './components/ProfileView';
import { FirstTimeTour } from './components/FirstTimeTour';
import { OnboardingModal } from './components/OnboardingModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Loader2, Terminal, BookOpen, ShieldAlert, LogOut } from 'lucide-react';
import { checkIsAdmin, checkUserIsDisabled, recordAdminActivity } from './lib/adminService';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUserDisabled, setIsUserDisabled] = useState<boolean>(false);

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
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

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

  // 1. Auth Listener & URL Synchronizer
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setViewMode('admin');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, []);

  useEffect(() => {
    // Silent background token refresh: refreshes token silently if session is near expiry
    const unsubscribeToken = onIdTokenChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          await user.getIdToken();
        } catch (e) {
          console.warn('Silent token background refresh notice:', e);
        }
      }
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (user) {
          // Check if custom user profile document exists in Firestore (users/{uid} or users/{uid}/profile/main)
          let customProfile: Partial<UserProfile> = {};
          try {
            const userSnap = await getDoc(doc(db, 'users', user.uid));
            if (userSnap.exists()) {
              customProfile = userSnap.data() as Partial<UserProfile>;
            } else {
              const profileDocRef = doc(db, 'users', user.uid, 'profile', 'main');
              const profileSnap = await getDoc(profileDocRef);
              if (profileSnap.exists()) {
                customProfile = profileSnap.data() as Partial<UserProfile>;
              }
            }
          } catch (e) {
            console.warn('Could not read user profile from firestore:', e);
          }

          // Check if this account has been disabled by Somotoz administrator
          try {
            const disabled = await checkUserIsDisabled(user.uid);
            setIsUserDisabled(disabled);
          } catch (e) {
            console.warn('Could not verify user status:', e);
          }

          // Verify admin role via server/token custom claim
          let userIsAdmin = false;
          try {
            userIsAdmin = checkIsAdmin({ email: user.email });
          } catch (e) {
            console.warn('Could not verify admin status:', e);
          }

          // Check onboarding: If user completed onboarding, never ask again.
          const isUserOnboarded = customProfile.isOnboarded === true;
          setShowOnboarding(!isUserOnboarded);

          setCurrentUser({
            uid: user.uid,
            username: customProfile.username,
            displayName: customProfile.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Somotoz User'),
            email: customProfile.email || user.email || '',
            photoURL: customProfile.photoURL || user.photoURL,
            phoneNumber: customProfile.phoneNumber || null,
            bio: customProfile.bio || '',
            dateOfBirth: customProfile.dateOfBirth,
            isAdult: customProfile.isAdult,
            isOnboarded: isUserOnboarded,
            mood: customProfile.mood || 'peaceful',
            theme: customProfile.theme,
            gender: customProfile.gender,
            interests: customProfile.interests,
            usernameLastChangedAt: customProfile.usernameLastChangedAt,
            status: customProfile.status || 'active',
            isAdmin: userIsAdmin,
            role: userIsAdmin ? 'admin' : 'member',
          });
          setAuthError(null);
        } else {
          setCurrentUser(null);
          setIsUserDisabled(false);
          setShowOnboarding(false);
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

    return () => {
      unsubscribe();
      unsubscribeToken();
    };
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

      // Record to Somotoz Admin Audit collection
      recordAdminActivity({
        userId: currentUser.uid,
        userEmail: currentUser.email || 'user@somotoz.ai',
        userName: currentUser.displayName || 'Somotoz User',
        activityType: mode === 'text' ? 'ai_query' : 'media_gen',
        query: action,
        feature: mode === 'text' ? 'Chat Companion' : `Multimodal Generator (${mode})`,
        status: 'success',
        tokens: tokens || 120,
        metadata,
      });
    },
    [currentUser]
  );

  // Handle Profile Updates from ProfileModal
  const handleUpdateProfile = async (
    updatedData: Partial<UserProfile>,
    passwordData?: { currentPass: string; newPass: string }
  ) => {
    if (!currentUser?.uid) return;

    // Simulate network delay for real-world feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Save to Firestore (strip base theme; persist only mood/accent)
    try {
      const dataToSave = { ...updatedData };
      delete (dataToSave as any).theme;
      delete (dataToSave as any).baseMode;

      const profileDocRef = doc(db, 'users', currentUser.uid, 'profile', 'main');
      await setDoc(
        profileDocRef,
        cleanForFirestore({
          ...dataToSave,
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
    if (view === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } else {
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
    }
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
      // Step 1: Call Gemini API proxy endpoint with verified token
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (auth.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          reqHeaders['Authorization'] = `Bearer ${idToken}`;
        } catch (tokErr) {
          console.warn('Could not retrieve fresh token for reflection:', tokErr);
        }
      }

      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          content,
          promptType,
          userId: currentUser.uid,
          userEmail: currentUser.email,
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

      // Record Activity in user's personal logs
      logActivity(
        'text',
        isEditing ? `Updated reflection: "${finalTitle}"` : `Created reflection: "${finalTitle}"`,
        Math.round(wordCount * 1.3)
      );

      // Step 3: Record to Somotoz Admin Audit collection
      recordAdminActivity({
        userId: currentUser.uid,
        userEmail: currentUser.email || 'user@somotoz.ai',
        userName: currentUser.displayName || 'Somotoz User',
        activityType: 'reflection',
        query: isEditing ? `Updated reflection: "${finalTitle}"` : `Created reflection: "${finalTitle}"`,
        feature: 'Reflection Studio',
        status: 'success',
        tokens: Math.round(wordCount * 1.3),
        metadata: { wordCount, moodTags },
      });

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

  // Render Loading Skeleton while checking persistent auth status and profile
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 space-y-4 font-sans select-none">
        <div className="w-14 h-14 rounded-3xl bg-[var(--accent-color)]/20 text-[var(--accent-color)] flex items-center justify-center animate-pulse">
          <div className="w-8 h-8 rounded-2xl bg-[var(--accent-color)] text-black flex items-center justify-center font-bold text-sm shadow-sm">
            S
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Loading Somotoz</h2>
          <p className="text-xs text-[var(--text-secondary)]">Checking authentication and syncing your profile...</p>
        </div>
        <div className="w-48 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div className="h-full bg-[var(--accent-color)] w-1/2 animate-pulse rounded-full" />
        </div>
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

  // Render Suspended / Access Disabled Screen if user is marked disabled
  if (isUserDisabled && currentUser) {
    return (
      <div className="min-h-screen bg-[#070712] text-white flex flex-col items-center justify-center p-6 font-mono selection:bg-rose-500 selection:text-white">
        <div className="max-w-md w-full p-8 bg-[#090916] border-2 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.3)] clip-cyber-card text-center space-y-5">
          <div className="w-16 h-16 mx-auto bg-rose-950/40 border border-rose-500 flex items-center justify-center text-rose-400 clip-badge-poly">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-rose-400">
              Account Access Suspended
            </h2>
            <p className="mt-2 text-xs text-[#A1A1AA] font-sans leading-relaxed">
              Your access to the Somotoz intelligence suite and messaging has been disabled by the system administrator.
            </p>
          </div>
          <div className="p-3 bg-black/60 border border-[#25253D] text-[11px] text-[#737373]">
            UID: <span className="text-[#A1A1AA] font-mono">{currentUser.uid}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-black/80 hover:bg-rose-950/40 border border-[#25253D] hover:border-rose-500/60 text-xs text-rose-300 font-bold uppercase clip-badge-poly flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  const isJournalView = viewMode === 'write' || viewMode === 'view' || viewMode === 'edit';
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Somotoz User';

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
        onOpenProfile={() => setViewMode('profile')}
      />

      {/* Main Workspace Layout (Single Navigation Rail + Content Area) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ONE Navigation: Left rail on laptop, 5-item bottom bar on mobile */}
        <NavigationRail
          currentView={viewMode}
          onSelectView={handleNavigate}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* Journal Entry List Sidebar when inside Journal Views */}
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
        <main className={`flex-1 bg-[var(--bg-primary)] relative transition-colors duration-300 ${viewMode === 'chat' ? 'chat-viewport-container overflow-hidden' : viewMode === 'somochat' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-4 sm:p-6'}`}>
          
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

          {/* 2. SOMOCHAT REAL-TIME HUMAN MESSAGING VIEW (18+ ONLY) */}
          {viewMode === 'somochat' && (
            currentUser?.isAdult === false ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Adults Only (18+)</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
                  SomoChat and social features are available only for adults aged 18 and older. Your account does not meet the minimum age requirement.
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('dashboard')}
                  className="px-4 py-2 bg-[var(--accent-color)] text-black font-semibold rounded-xl text-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <Somochat
                currentUser={currentUser}
                onShowToast={addToast}
                onLogActivity={(mode, action, tokens) => logActivity(mode as any, action, tokens)}
              />
            )
          )}

          {/* 3. JOURNAL WRITE VIEW */}
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

          {/* Fallback if in view mode without selected entry: friendly message and ONE button */}
          {viewMode === 'view' && !selectedEntry && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-secondary)] font-sans">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-color)] flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No note selected</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                Select a journal note from the sidebar list, or write a new reflection.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('write')}
                className="mt-4 px-4 py-2 bg-[var(--accent-color)] text-black font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                Write New Note
              </button>
            </div>
          )}

          {/* 5. ASK AI VIEW */}
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

          {/* 6. DISCOVER VIEW (Knowledge Hub + Soundscapes + Quotes) */}
          {(viewMode === 'discover' || viewMode === 'wisdom' || viewMode === 'soundscapes') && (
            <div className="max-w-6xl mx-auto">
              <DiscoverView />
            </div>
          )}

          {/* 7. PROFILE & SETTINGS VIEW */}
          {viewMode === 'profile' && (
            <div className="max-w-4xl mx-auto">
              <ProfileView
                user={currentUser}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                onOpenTour={() => setIsTourOpen(true)}
                onProfileUpdated={(updated) => {
                  setCurrentUser(updated);
                  addToast('success', 'Profile Updated', 'Your settings have been saved.');
                }}
              />
            </div>
          )}

          {/* 8. MASTER ADMIN DASHBOARD VIEW */}
          {viewMode === 'admin' && (
            <div className="max-w-7xl mx-auto">
              <AdminDashboard
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onShowToast={addToast}
              />
            </div>
          )}
        </main>
      </div>

      {/* 4-Step Onboarding Modal for New / Incomplete Users */}
      <OnboardingModal
        currentUser={currentUser}
        isOpen={showOnboarding}
        onComplete={(updatedProfile) => {
          setCurrentUser(updatedProfile);
          setShowOnboarding(false);
          addToast('success', 'Profile Created', `Welcome to Somotoz, @${updatedProfile.username}!`);
        }}
        onLogout={handleLogout}
      />

      {/* First-Time Feature Tour (Chats, Ask AI, Journal) */}
      <FirstTimeTour
        forceOpen={isTourOpen}
        onComplete={() => setIsTourOpen(false)}
      />

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
