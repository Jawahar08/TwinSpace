import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import type { Note } from '@syncnotes/types';

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
    }, 500);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    triggerDebouncedSave(text, content);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    triggerDebouncedSave(title, text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        {/* Navigation Toolbar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
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
            placeholder="Title"
            placeholderTextColor="#86868B"
            value={title}
            onChangeText={handleTitleChange}
          />

          <TextInput
            style={styles.contentInput}
            placeholder="Start typing..."
            placeholderTextColor="#86868B"
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
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  inner: { flex: 1 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  backBtn: { padding: 4 },
  backText: { color: '#E5A93C', fontSize: 17, fontWeight: '600' },
  rightActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 6 },
  actionText: { fontSize: 18 },
  scrollView: { flex: 1, padding: 16 },
  titleInput: { fontSize: 24, fontWeight: 'bold', color: '#F5F5F7', marginBottom: 12 },
  contentInput: { fontSize: 16, color: '#F5F5F7', minHeight: 300, lineHeight: 24 },
});
