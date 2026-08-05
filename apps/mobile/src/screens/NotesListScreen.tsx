import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, SafeAreaView, Modal } from 'react-native';
import type { Note } from '@syncnotes/types';
import type { SyncState } from '../sync/mobileSyncEngine';
import { getReadableDeviceName } from '@syncnotes/utils';

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
  const [showTwinSpaceSheet, setShowTwinSpaceSheet] = useState(false);

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
      {/* Mobile Header Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>TwinSpace</Text>
            <Text style={styles.subtitle}>CONTINUUM • IPHONE</Text>
          </View>

          <TouchableOpacity onPress={onSignOut} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Prominent TwinSpace Live Status Chip */}
        <TouchableOpacity
          style={styles.twinSpaceChip}
          onPress={() => setShowTwinSpaceSheet(true)}
          activeOpacity={0.8}
        >
          <View style={styles.chipNode}>
            <Text style={styles.chipNodeText}>💻 Windows</Text>
          </View>
          <Text style={styles.chipBridge}>⚡ bridge</Text>
          <View style={styles.chipNode}>
            <Text style={styles.chipNodeText}>📱 iPhone</Text>
          </View>
          <View style={[styles.statusBadge, syncState === 'CONNECTED' ? styles.statusConnected : styles.statusOffline]}>
            <Text style={styles.statusText}>{syncState === 'CONNECTED' ? 'Synced' : 'Offline'}</Text>
          </View>
        </TouchableOpacity>

        {/* Search Bar Input */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search notes across devices..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Category Filters Pill Group */}
        <View style={styles.filterRow}>
          {(['ALL', 'PINNED', 'ARCHIVED', 'TRASH'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'Notes' : f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes FlatList Stream */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const originDevice = getReadableDeviceName(item.deviceId);

          return (
            <TouchableOpacity style={styles.noteCard} onPress={() => onSelectNote(item)} activeOpacity={0.7}>
              <View style={styles.noteTitleRow}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {item.title || 'Untitled Note'}
                </Text>
                {item.pinned && <Text style={styles.pinBadge}>📌</Text>}
              </View>

              <Text style={styles.noteSnippet} numberOfLines={2}>
                {item.content.replace(/<[^>]*>?/gm, '') || 'No additional content'}
              </Text>

              <View style={styles.noteMetaRow}>
                <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
                <View style={styles.deviceTag}>
                  <Text style={styles.deviceTagText}>
                    {originDevice === 'Windows' ? '💻 Windows' : '📱 iPhone'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Action Button (New Note) */}
      <TouchableOpacity style={styles.fab} onPress={onNewNote} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* TwinSpace Live Bottom Sheet Modal */}
      <Modal visible={showTwinSpaceSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>TwinSpace Live Device Bridge</Text>
            <Text style={styles.sheetDesc}>
              Private real-time synchronization between your personal Windows workstation and iPhone.
            </Text>

            <View style={styles.sheetCardRow}>
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardIcon}>💻</Text>
                <Text style={styles.sheetCardTitle}>Windows PC</Text>
                <Text style={styles.sheetCardStatus}>Active Node</Text>
              </View>

              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardIcon}>📱</Text>
                <Text style={styles.sheetCardTitle}>iPhone</Text>
                <Text style={styles.sheetCardStatus}>Linked Node</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowTwinSpaceSheet(false)}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1013' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#232630' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  subtitle: { fontSize: 9, fontWeight: '700', color: '#f59e0b', letterSpacing: 1, marginTop: 2 },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  iconBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  twinSpaceChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#17191e', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#232630', marginBottom: 12 },
  chipNode: { backgroundColor: '#232630', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chipNodeText: { color: '#f1f5f9', fontSize: 11, fontWeight: '700' },
  chipBridge: { color: '#f59e0b', fontSize: 11, fontStyle: 'italic', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusConnected: { backgroundColor: 'rgba(52, 199, 89, 0.2)' },
  statusOffline: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  statusText: { fontSize: 10, fontWeight: '800', color: '#f1f5f9' },
  searchBar: { backgroundColor: '#17191e', color: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, fontSize: 14, borderBottomWidth: 1, borderColor: '#232630', marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: '#17191e', borderWidth: 1, borderColor: '#232630' },
  filterBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#FFF', fontWeight: '800' },
  listContent: { padding: 16, gap: 10 },
  noteCard: { backgroundColor: '#17191e', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#232630' },
  noteTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', flex: 1 },
  pinBadge: { fontSize: 12, marginLeft: 6 },
  noteSnippet: { fontSize: 13, color: '#94a3b8', lineHeight: 18, marginBottom: 10 },
  noteMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteDate: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  deviceTag: { backgroundColor: '#232630', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  deviceTagText: { fontSize: 10, color: '#f59e0b', fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { color: '#FFF', fontSize: 32, fontWeight: '300', marginTop: -3 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: '#17191e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#f1f5f9', marginBottom: 6 },
  sheetDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  sheetCardRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sheetCard: { flex: 1, backgroundColor: '#232630', padding: 14, borderRadius: 16, alignItems: 'center' },
  sheetCardIcon: { fontSize: 24, marginBottom: 6 },
  sheetCardTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  sheetCardStatus: { fontSize: 11, color: '#f59e0b', marginTop: 2 },
  sheetCloseBtn: { backgroundColor: '#f59e0b', padding: 14, borderRadius: 14, alignItems: 'center' },
  sheetCloseText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
