import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import type { Note } from '@syncnotes/types';
import { mobileSyncEngine, type SyncState } from './src/sync/mobileSyncEngine';
import { AuthScreen } from './src/screens/AuthScreen';
import { NotesListScreen } from './src/screens/NotesListScreen';
import { EditorScreen } from './src/screens/EditorScreen';

const API_BASE = 'http://localhost:8080';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('OFFLINE');

  useEffect(() => {
    // Check saved session in SecureStore
    mobileSyncEngine.loadStoredToken().then((t) => {
      if (t) setToken(t);
    });

    const unsubState = mobileSyncEngine.subscribeState(setSyncState);
    const unsubNotes = mobileSyncEngine.subscribeNotes(setNotes);

    return () => {
      unsubState();
      unsubNotes();
    };
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    setToken(data.accessToken);
    await mobileSyncEngine.setToken(data.accessToken);
  };

  const handleRegister = async (email: string, pass: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }
    const data = await res.json();
    setToken(data.accessToken);
    await mobileSyncEngine.setToken(data.accessToken);
  };

  const handleSignOut = async () => {
    setToken(null);
    setSelectedNote(null);
    await mobileSyncEngine.setToken(null);
  };

  const handleNewNote = async () => {
    const newId = 'note_' + Date.now();
    const created = await mobileSyncEngine.queueMutation(newId, 'CREATE', {
      title: 'Untitled Note',
      content: '',
      pinned: false,
      archived: false,
      deleted: false,
    });
    setSelectedNote(created);
  };

  const handleSaveNote = async (id: string, title: string, content: string) => {
    const updated = await mobileSyncEngine.queueMutation(id, 'UPDATE', { title, content });
    setSelectedNote(updated);
  };

  const handleTogglePin = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      const updated = await mobileSyncEngine.queueMutation(id, 'UPDATE', { pinned: !note.pinned });
      if (selectedNote?.id === id) setSelectedNote(updated);
    }
  };

  const handleToggleArchive = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      const updated = await mobileSyncEngine.queueMutation(id, 'UPDATE', { archived: !note.archived });
      if (selectedNote?.id === id) setSelectedNote(updated);
    }
  };

  const handleDeleteNote = async (id: string) => {
    await mobileSyncEngine.queueMutation(id, 'DELETE', { deleted: true });
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />
      </View>
    );
  }

  if (selectedNote) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <EditorScreen
          note={selectedNote}
          onBack={() => setSelectedNote(null)}
          onSaveNote={handleSaveNote}
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onDeleteNote={handleDeleteNote}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <NotesListScreen
        notes={notes}
        onSelectNote={setSelectedNote}
        onNewNote={handleNewNote}
        syncState={syncState}
        onSignOut={handleSignOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
});
