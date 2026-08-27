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
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logoutUser, cleanForFirestore } from './lib/firebase';
import { JournalEntry, UserProfile, ViewMode, AIReflectionResponse } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { ReflectionEditor } from './components/ReflectionEditor';
import { ReflectionDetail } from './components/ReflectionDetail';
import { ChatCompanion } from './components/ChatCompanion';
import { WisdomExplorer } from './components/WisdomExplorer';
import { SoundscapePlayer } from './components/SoundscapePlayer';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Sparkles, Loader2, BookOpen, Terminal } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [isSubmittingAI, setIsSubmittingAI] = useState<boolean>(false);
  const [chatReflectionAnchor, setChatReflectionAnchor] = useState<JournalEntry | null>(null);

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
      (user: User | null) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
          setAuthError(null);
        } else {
          setCurrentUser(null);
          setEntries([]);
          setSelectedEntryId(null);
          setViewMode('write');
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

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      addToast('success', 'Welcome to Somotoz', 'Successfully authenticated with Google.');
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
    setViewMode('chat');
  };

  // Current Selected Entry
  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || null;

  // Render Skeleton while checking initial auth status
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10 animate-pulse">
          <Terminal className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-cyan-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          BOOTING SOMOTOZ NEURAL KERNEL...
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
          isAuthenticating={isAuthenticating}
          authError={authError}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const showSidebar = viewMode === 'write' || viewMode === 'view' || viewMode === 'edit';
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Engineer';

  // Render Authenticated Dashboard
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col h-screen overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        entryCount={entries.length}
        currentView={viewMode}
        onSelectView={(v) => setViewMode(v)}
        onNewReflection={() => {
          setSelectedEntryId(null);
          setViewMode('write');
        }}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        isSidebarOpen={isSidebarOpenMobile}
      />

      {/* Main Workspace Layout (Sidebar + Main Area) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar for Journal views */}
        {showSidebar && (
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
            isOpenMobile={isSidebarOpenMobile}
            onCloseMobile={() => setIsSidebarOpenMobile(false)}
          />
        )}

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#090d16] relative">
          {viewMode === 'write' && (
            <ReflectionEditor
              isSubmitting={isSubmittingAI}
              onSubmit={handleCreateOrUpdateReflection}
              userName={userName}
            />
          )}

          {viewMode === 'edit' && selectedEntry && (
            <ReflectionEditor
              initialTitle={selectedEntry.title}
              initialContent={selectedEntry.content}
              isSubmitting={isSubmittingAI}
              onSubmit={handleCreateOrUpdateReflection}
              onCancelEdit={() => setViewMode('view')}
              isEditMode={true}
              userName={userName}
            />
          )}

          {viewMode === 'view' && selectedEntry && (
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
          )}

          {/* Fallback if in view mode without selected entry */}
          {viewMode === 'view' && !selectedEntry && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono">
              <BookOpen className="w-12 h-12 mb-3 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-300">NO RECORD SELECTED</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm font-sans">
                Select an entry from the sidebar to inspect its synthesized analysis, or initialize a new reflection stream.
              </p>
              <button
                onClick={() => setViewMode('write')}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-mono font-semibold hover:from-cyan-400 hover:to-indigo-500 transition-colors cursor-pointer"
              >
                Synthesize New Reflection
              </button>
            </div>
          )}

          {/* Multimodal Chat Workspace */}
          {viewMode === 'chat' && (
            <ChatCompanion
              contextEntry={chatReflectionAnchor || undefined}
              onClearContext={() => setChatReflectionAnchor(null)}
            />
          )}

          {/* Wisdom Search Explorer View */}
          {viewMode === 'wisdom' && (
            <WisdomExplorer />
          )}

          {/* Soundscapes & Meditation Player View */}
          {viewMode === 'soundscapes' && (
            <SoundscapePlayer />
          )}
        </main>
      </div>

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
