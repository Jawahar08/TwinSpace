import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import type { Note } from '@syncnotes/types';
import type { SyncState } from '../sync/mobileSyncEngine';

interface NotesListScreenProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  syncState: SyncState;
  onSignOut: () => void;
}

export const NotesListScreen: React.FC<NotesListScreenProps> = ({
  notes,
  onSelectNote,
  onNewNote,
  syncState,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PINNED' | 'ARCHIVED' | 'TRASH'>('ALL');

  const filteredNotes = notes.filter((note) => {
    if (filter === 'PINNED') return note.pinned && !note.archived && !note.deleted;
    if (filter === 'ARCHIVED') return note.archived && !note.deleted;
    if (filter === 'TRASH') return note.deleted;
    const matchSearch =
      !searchQuery.trim() ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return !note.archived && !note.deleted && matchSearch;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobile Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notes</Text>
          <View style={styles.actions}>
            <View style={[styles.badge, syncState === 'CONNECTED' ? styles.badgeSuccess : styles.badgeWarn]}>
              <Text style={styles.badgeText}>{syncState === 'CONNECTED' ? 'Synced' : 'Offline'}</Text>
            </View>
            <TouchableOpacity onPress={onSignOut} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search"
          placeholderTextColor="#86868B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filters */}
        <View style={styles.filterRow}>
          {(['ALL', 'PINNED', 'ARCHIVED', 'TRASH'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'All Notes' : f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.noteCard} onPress={() => onSelectNote(item)}>
            <View style={styles.noteTitleRow}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {item.title || 'Untitled Note'}
              </Text>
              {item.pinned && <Text style={styles.pinIcon}>📌</Text>}
            </View>
            <View style={styles.noteMetaRow}>
              <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
              <Text style={styles.noteSnippet} numberOfLines={1}>
                {item.content.replace(/<[^>]*>?/gm, '') || 'No additional text'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Note Button */}
      <TouchableOpacity style={styles.fab} onPress={onNewNote}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F5F5F7' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: 'rgba(52, 199, 89, 0.2)' },
  badgeWarn: { backgroundColor: 'rgba(255, 149, 0, 0.2)' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#34C759' },
  iconBtn: { padding: 6 },
  iconBtnText: { color: '#E5A93C', fontSize: 13, fontWeight: '600' },
  searchBar: { backgroundColor: '#2C2C2E', color: '#F5F5F7', padding: 10, borderRadius: 10, fontSize: 14, marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#252528' },
  filterBtnActive: { backgroundColor: '#E5A93C' },
  filterText: { color: '#98989D', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#FFF', fontWeight: 'bold' },
  listContent: { padding: 16, gap: 10 },
  noteCard: { backgroundColor: '#2C2C2E', padding: 14, borderRadius: 14 },
  noteTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  noteTitle: { fontSize: 16, fontWeight: '600', color: '#F5F5F7', flex: 1 },
  pinIcon: { fontSize: 12, marginLeft: 6 },
  noteMetaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  noteDate: { fontSize: 12, color: '#98989D', fontWeight: '500' },
  noteSnippet: { fontSize: 13, color: '#86868B', flex: 1 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5A93C', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#FFF', fontSize: 32, fontWeight: '300', marginTop: -2 },
});
