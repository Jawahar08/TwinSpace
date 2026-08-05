import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Note, Attachment, AuthTokenResponse, HandoffState, DeviceActivity } from '@syncnotes/types';
import { getStoredTheme, setStoredTheme, applyTheme, type ThemeMode } from '@syncnotes/utils';
import { db } from './sync/db';
import { syncEngine, type SyncState, type TwinSpaceMetrics } from './sync/syncEngine';
import { Header } from './components/Header';
import { NotesList, type ViewFilter } from './components/NotesList';
import { Editor } from './components/Editor';
import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { LiveHandoffBanner } from './components/LiveHandoffBanner';
import { RightDrawer } from './components/RightDrawer';
import { TwinSpacePanel } from './components/TwinSpacePanel';
import { NotionSettingsModal } from './components/NotionSettingsModal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ViewFilter>('ALL');
  const [syncState, setSyncState] = useState<SyncState>('OFFLINE');
  const [metrics, setMetrics] = useState<TwinSpaceMetrics>(syncEngine.getMetrics());
  const [updatedJustNow, setUpdatedJustNow] = useState(false);
  const [updatedFromDevice, setUpdatedFromDevice] = useState<'Windows' | 'iPhone' | 'Device'>('iPhone');
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme());
  const [authError, setAuthError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isTwinSpacePanelOpen, setIsTwinSpacePanelOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [handoffState, setHandoffState] = useState<HandoffState | null>(null);
  const [deviceActivities, setDeviceActivities] = useState<DeviceActivity[]>([]);

  // Load theme & auth token on startup
  useEffect(() => {
    const mode = getStoredTheme();
    setThemeMode(mode);
    applyTheme(mode);

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

  // Listen to system theme changes if themeMode === 'system'
  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Subscribe to syncEngine state, metrics, remote updates & device activity stream
  useEffect(() => {
    const unsubState = syncEngine.subscribeState(setSyncState);
    const unsubMetrics = syncEngine.subscribeMetrics(setMetrics);

    const unsubRemote = syncEngine.subscribeRemoteUpdate((updatedNote, originDeviceType) => {
      setUpdatedJustNow(true);
      setUpdatedFromDevice(originDeviceType);

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
      unsubMetrics();
      unsubRemote();
      unsubActivity();
    };
  }, []);

  // Fetch reactive notes list from IndexedDB using Dexie live query
  const allNotes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray()) || [];

  // Filter notes by search query
  const displayedNotes = allNotes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
  });

  // Automatically select first note if none is selected
  useEffect(() => {
    if (!selectedNoteId && displayedNotes.length > 0) {
      setSelectedNoteId(displayedNotes[0].id);
    }
  }, [displayedNotes.length, selectedNoteId]);

  // Fetch attachments when selected note changes
  useEffect(() => {
    if (selectedNoteId) {
      db.attachments.where('noteId').equals(selectedNoteId).toArray().then(setAttachments);
    } else {
      setAttachments([]);
    }
  }, [selectedNoteId]);

  // Global Keyboard Shortcuts (Ctrl+K for Command Palette, Ctrl+N for New Note)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeNote = displayedNotes.find((n) => n.id === selectedNoteId) || null;

  const fetchMe = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserEmail(data.email);
      }
    } catch (e) {
      console.error('Fetch me failed', e);
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed');
      }
      const data: AuthTokenResponse = await res.json();
      setToken(data.accessToken);
      setUserEmail(email);
      localStorage.setItem('syncnotes_access_token', data.accessToken);
      if (window.electronAPI) {
        await window.electronAPI.secureStoreSet('access_token', data.accessToken);
      }
      syncEngine.setToken(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password');
      throw err;
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Registration failed');
      }
      const data: AuthTokenResponse = await res.json();
      setToken(data.accessToken);
      setUserEmail(email);
      localStorage.setItem('syncnotes_access_token', data.accessToken);
      if (window.electronAPI) {
        await window.electronAPI.secureStoreSet('access_token', data.accessToken);
      }
      syncEngine.setToken(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  };

  const handleSignOut = async () => {
    setToken(null);
    setUserEmail(undefined);
    localStorage.removeItem('syncnotes_access_token');
    if (window.electronAPI) {
      await window.electronAPI.secureStoreDelete('access_token');
    }
    syncEngine.setToken(null);
  };

  const handleNewNote = async () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      deviceId: syncEngine.getDeviceId(),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      archived: false,
      deleted: false,
    };
    await db.notes.put(newNote);
    setSelectedNoteId(newNote.id);
    await syncEngine.trackLocalChange('NOTE', newNote.id, 'CREATE', newNote, 0);
  };

  const handleSaveNote = async (id: string, title: string, content: string) => {
    const existing = await db.notes.get(id);
    if (!existing) return;

    const updated: Note = {
      ...existing,
      title,
      content,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };

    await db.notes.put(updated);
    await syncEngine.trackLocalChange('NOTE', updated.id, 'UPDATE', updated, existing.version);
  };

  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = await db.notes.get(id);
    if (!existing) return;
    const updated = { ...existing, pinned: !existing.pinned, updatedAt: new Date().toISOString() };
    await db.notes.put(updated);
    await syncEngine.trackLocalChange('NOTE', id, 'UPDATE', updated, existing.version);
  };

  const handleToggleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = await db.notes.get(id);
    if (!existing) return;
    const updated = { ...existing, archived: !existing.archived, updatedAt: new Date().toISOString() };
    await db.notes.put(updated);
    await syncEngine.trackLocalChange('NOTE', id, 'UPDATE', updated, existing.version);
  };

  const handleSoftDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = await db.notes.get(id);
    if (!existing) return;
    const updated = { ...existing, deleted: true, updatedAt: new Date().toISOString() };
    await db.notes.put(updated);
    await syncEngine.trackLocalChange('NOTE', id, 'DELETE', updated, existing.version);
  };

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = await db.notes.get(id);
    if (!existing) return;
    const updated = { ...existing, deleted: false, archived: false, updatedAt: new Date().toISOString() };
    await db.notes.put(updated);
    await syncEngine.trackLocalChange('NOTE', id, 'UPDATE', updated, existing.version);
  };

  const handleUploadFile = async (file: File) => {
    if (!selectedNoteId) return;

    const newAtt: Attachment = {
      id: crypto.randomUUID(),
      noteId: selectedNoteId,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      byteSize: file.size,
      storageKey: `mock/${selectedNoteId}/${file.name}`,
      createdAt: new Date().toISOString(),
      downloadUrl: URL.createObjectURL(file),
    };

    await db.attachments.put(newAtt);
    setAttachments((prev) => [newAtt, ...prev]);
    await syncEngine.trackLocalChange('ATTACHMENT', newAtt.id, 'CREATE', newAtt, 0);
  };

  const handleDeleteAttachment = async (attId: string) => {
    await db.attachments.delete(attId);
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    await syncEngine.trackLocalChange('ATTACHMENT', attId, 'DELETE', { id: attId }, 0);
  };

  const cycleTheme = () => {
    let next: ThemeMode = 'dark';
    if (themeMode === 'dark') next = 'light';
    else if (themeMode === 'light') next = 'system';
    else next = 'dark';

    setThemeMode(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-continuum-bgLight dark:bg-continuum-bgDark font-sans text-continuum-textLight dark:text-continuum-textDark">
      {/* Top Header Command Bar (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewNote={handleNewNote}
          metrics={metrics}
          onOpenTwinSpacePanel={() => setIsTwinSpacePanelOpen(true)}
          updatedJustNow={updatedJustNow}
          updatedFromDevice={updatedFromDevice}
          themeMode={themeMode}
          onCycleTheme={cycleTheme}
          onSignOut={handleSignOut}
          userEmail={userEmail}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleFocusMode={() => setIsFocusMode(true)}
          isRightDrawerOpen={isRightDrawerOpen}
          onToggleRightDrawer={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
          onOpenPairingModal={() => setIsPairingModalOpen(true)}
          onOpenNotionModal={() => setIsNotionModalOpen(true)}
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

      {/* TwinSpace Live Details Modal */}
      <TwinSpacePanel
        isOpen={isTwinSpacePanelOpen}
        onClose={() => setIsTwinSpacePanelOpen(false)}
        metrics={metrics}
        onForceSync={() => syncEngine.flushOutbox()}
      />

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={allNotes}
        onSelectNote={(noteId) => {
          setSelectedNoteId(noteId);
          setIsCommandPaletteOpen(false);
        }}
        onNewNote={() => {
          handleNewNote();
          setIsCommandPaletteOpen(false);
        }}
        onToggleFocusMode={() => {
          setIsFocusMode(true);
          setIsCommandPaletteOpen(false);
        }}
        onToggleTheme={cycleTheme}
      />

      {/* Auth & Device Pairing Modal */}
      <AuthModal
        isOpen={!token || isPairingModalOpen}
        onLogin={async (email, pass) => {
          await handleLogin(email, pass);
          setIsPairingModalOpen(false);
        }}
        onRegister={async (email, pass) => {
          await handleRegister(email, pass);
          setIsPairingModalOpen(false);
        }}
        error={authError}
      />

      {/* Notion Database Integration Settings Modal */}
      <NotionSettingsModal
        isOpen={isNotionModalOpen}
        onClose={() => setIsNotionModalOpen(false)}
      />
    </div>
  );
}
