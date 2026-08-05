import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Note, Attachment, AuthTokenResponse, HandoffState, DeviceActivity } from '@syncnotes/types';
import { db } from './sync/db';
import { syncEngine, type SyncState } from './sync/syncEngine';
import { Header } from './components/Header';
import { NotesList, type ViewFilter } from './components/NotesList';
import { Editor } from './components/Editor';
import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { LiveHandoffBanner } from './components/LiveHandoffBanner';
import { RightDrawer } from './components/RightDrawer';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ViewFilter>('ALL');
  const [syncState, setSyncState] = useState<SyncState>('OFFLINE');
  const [updatedJustNow, setUpdatedJustNow] = useState(false);
  const [updatedFromDevice, setUpdatedFromDevice] = useState<'Windows' | 'iPhone' | 'Device'>('iPhone');
  const [darkMode, setDarkMode] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [handoffState, setHandoffState] = useState<HandoffState | null>(null);
  const [deviceActivities, setDeviceActivities] = useState<DeviceActivity[]>([]);

  // Load theme & auth token on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('syncnotes_theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const loadToken = async () => {
      let storedToken = localStorage.getItem('syncnotes_access_token');
      if (window.electronAPI) {
        const secureTok = await window.electronAPI.secureStoreGet('access_token');
        if (secureTok) storedToken = secureTok;
      }
      if (storedToken) {
        setToken(storedToken);
        syncEngine.setToken(storedToken);
        fetchMe(storedToken);
      }
    };
    loadToken();
  }, []);

  // Subscribe to syncEngine state, remote updates & device activity stream
  useEffect(() => {
    const unsubState = syncEngine.subscribeState(setSyncState);

    const unsubRemote = syncEngine.subscribeRemoteUpdate((updatedNote, originDeviceType) => {
      setUpdatedJustNow(true);
      setUpdatedFromDevice(originDeviceType);

      // Trigger Live Handoff banner if update comes from another device (e.g. iPhone)
      if (originDeviceType === 'iPhone') {
        setHandoffState({
          noteId: updatedNote.id,
          noteTitle: updatedNote.title || 'Untitled Note',
          originDeviceId: updatedNote.deviceId || 'iPhone',
          originDeviceType: 'iPhone',
          timestamp: new Date().toISOString(),
        });
      }

      setTimeout(() => setUpdatedJustNow(false), 4000);
    });

    const unsubActivity = syncEngine.subscribeDeviceActivity(setDeviceActivities);

    return () => {
      unsubState();
      unsubRemote();
      unsubActivity();
    };
  }, []);

  // Fetch current notes from Dexie local IndexedDB
  const allNotes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []) || [];

  // Filter notes by search query
  const displayedNotes = allNotes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
  });

  // Select first note automatically if none selected
  useEffect(() => {
    if (!selectedNoteId && displayedNotes.length > 0) {
      const active = displayedNotes.find((n) => !n.deleted && !n.archived);
      if (active) setSelectedNoteId(active.id);
    }
  }, [displayedNotes, selectedNoteId]);

  const activeNote = allNotes.find((n) => n.id === selectedNoteId) || null;

  // Fetch attachments for active note
  useEffect(() => {
    if (activeNote && token) {
      fetch(`${API_BASE}/api/attachments/note/${activeNote.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then(setAttachments)
        .catch(() => setAttachments([]));
    } else {
      setAttachments([]);
    }
  }, [activeNote?.id, token]);

  const fetchMe = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserEmail(data.email);
      }
    } catch {
      // Ignore
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Login failed');
      }
      const data: AuthTokenResponse = await res.json();
      saveAuthSession(data);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }
      const data: AuthTokenResponse = await res.json();
      saveAuthSession(data);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const saveAuthSession = (data: AuthTokenResponse) => {
    setToken(data.accessToken);
    setUserEmail(data.user.email);
    localStorage.setItem('syncnotes_access_token', data.accessToken);
    if (window.electronAPI) {
      window.electronAPI.secureStoreSet('access_token', data.accessToken);
    }
    syncEngine.setToken(data.accessToken);
  };

  const handleSignOut = () => {
    setToken(null);
    setUserEmail(undefined);
    localStorage.removeItem('syncnotes_access_token');
    if (window.electronAPI) {
      window.electronAPI.secureStoreDelete('access_token');
    }
    syncEngine.setToken(null);
  };

  const handleNewNote = async () => {
    const newNoteId = crypto.randomUUID();
    const created = await syncEngine.queueMutation(newNoteId, 'CREATE', {
      title: 'Untitled Note',
      content: '',
      pinned: false,
      archived: false,
      deleted: false,
    });
    setSelectedNoteId(created.id);
  };

  const handleSaveNote = async (id: string, title: string, content: string) => {
    await syncEngine.queueMutation(id, 'UPDATE', { title, content });
  };

  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = allNotes.find((n) => n.id === id);
    if (note) {
      await syncEngine.queueMutation(id, 'UPDATE', { pinned: !note.pinned });
    }
  };

  const handleToggleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = allNotes.find((n) => n.id === id);
    if (note) {
      await syncEngine.queueMutation(id, 'UPDATE', { archived: !note.archived });
    }
  };

  const handleSoftDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await syncEngine.queueMutation(id, 'DELETE', { deleted: true });
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await syncEngine.queueMutation(id, 'UPDATE', { deleted: false });
  };

  const handleUploadFile = async (file: File) => {
    if (!activeNote || !token) return;
    try {
      const initRes = await fetch(`${API_BASE}/api/attachments/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noteId: activeNote.id,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          byteSize: file.size,
        }),
      });
      if (!initRes.ok) return;
      const initData = await initRes.json();

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${API_BASE}${initData.uploadUrl}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (uploadRes.ok) {
        const newAtt = await uploadRes.json();
        setAttachments((prev) => [...prev, newAtt]);
      }
    } catch (err) {
      console.error('Attachment upload error', err);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error('Attachment delete error', err);
    }
  };

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('syncnotes_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('syncnotes_theme', 'light');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-continuum-bgLight dark:bg-continuum-bgDark font-sans text-continuum-textLight dark:text-continuum-textDark">
      {/* Top Header Command Bar (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewNote={handleNewNote}
          syncState={syncState}
          updatedJustNow={updatedJustNow}
          updatedFromDevice={updatedFromDevice}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          onSignOut={handleSignOut}
          userEmail={userEmail}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleFocusMode={() => setIsFocusMode(true)}
          isRightDrawerOpen={isRightDrawerOpen}
          onToggleRightDrawer={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
        />
      )}

      {/* Live Handoff Alert Banner */}
      {!isFocusMode && (
        <LiveHandoffBanner
          handoffState={handoffState}
          onOpenHandoffNote={(noteId) => {
            setSelectedNoteId(noteId);
            setHandoffState(null);
          }}
          onDismiss={() => setHandoffState(null)}
        />
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation & Notes Stream Rail (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <NotesList
            notes={displayedNotes}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            filter={filter}
            onFilterChange={setFilter}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
            onSoftDelete={handleSoftDelete}
            onRestore={handleRestore}
          />
        )}

        {/* Center Editor Canvas */}
        <Editor
          note={activeNote}
          onSaveNote={handleSaveNote}
          attachments={attachments}
          onUploadFile={handleUploadFile}
          onDeleteAttachment={handleDeleteAttachment}
          isFocusMode={isFocusMode}
          onExitFocusMode={() => setIsFocusMode(false)}
        />

        {/* Contextual Right Drawer for Metadata & Attachments */}
        {!isFocusMode && (
          <RightDrawer
            isOpen={isRightDrawerOpen}
            onClose={() => setIsRightDrawerOpen(false)}
            note={activeNote}
            attachments={attachments}
            onUploadFile={handleUploadFile}
            onDeleteAttachment={handleDeleteAttachment}
            deviceActivities={deviceActivities}
          />
        )}
      </div>

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={allNotes}
        onSelectNote={setSelectedNoteId}
        onNewNote={handleNewNote}
        onToggleFocusMode={() => setIsFocusMode(true)}
        onToggleTheme={toggleTheme}
        darkMode={darkMode}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={!token}
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={authError}
      />
    </div>
  );
}
