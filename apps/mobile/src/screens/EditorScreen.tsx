import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import type { Note } from '@syncnotes/types';
import { extractAutoTitle } from '@syncnotes/utils';

interface EditorScreenProps {
  note: Note;
  onBack: () => void;
  onSaveNote: (id: string, title: string, content: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  note,
  onBack,
  onSaveNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  const triggerDebouncedSave = (newTitle: string, newContent: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onSaveNote(note.id, newTitle, newContent);
    }, 400);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    triggerDebouncedSave(text, content);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    const autoTitle = extractAutoTitle(text, title);
    if (autoTitle !== title && (title === 'Untitled Note' || !title)) {
      setTitle(autoTitle);
    }
    triggerDebouncedSave(autoTitle || title, text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Notes</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity onPress={() => onTogglePin(note.id)} style={styles.actionBtn}>
              <Text style={styles.actionText}>{note.pinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onToggleArchive(note.id)} style={styles.actionBtn}>
              <Text style={styles.actionText}>{note.archived ? '📥' : '📦'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteNote(note.id)} style={styles.actionBtn}>
              <Text style={styles.actionText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Editor Body */}
        <ScrollView style={styles.scrollView} keyboardDismissMode="interactive">
          <TextInput
            style={styles.titleInput}
            placeholder="Untitled Note"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={handleTitleChange}
          />

          <TextInput
            style={styles.contentInput}
            placeholder="Start typing... changes sync in real-time"
            placeholderTextColor="#64748b"
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={handleContentChange}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1013' },
  inner: { flex: 1 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#232630' },
  backBtn: { paddingVertical: 4 },
  backText: { color: '#f59e0b', fontSize: 17, fontWeight: '700' },
  rightActions: { flexDirection: 'row', gap: 14 },
  actionBtn: { padding: 4 },
  actionText: { fontSize: 18 },
  scrollView: { flex: 1, padding: 16 },
  titleInput: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', marginBottom: 14, letterSpacing: -0.5 },
  contentInput: { fontSize: 16, color: '#f1f5f9', minHeight: 350, lineHeight: 24 },
});
