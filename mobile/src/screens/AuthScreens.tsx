import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import notesService, { BackendNote, CreateNoteRequest, UpdateNoteRequest } from "../services/notesService";
import aiService from "../services/aiServise";

export default function NotesScreen() {
  const [notes, setNotes] = useState<BackendNote[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<BackendNote | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    loadNotes();
  }, []);

  const loadNotes = async (search?: string) => {
    try {
      setIsLoading(true);
      const response = await notesService.getNotes({ 
        search,
        limit: 50,
        page: 1 
      });
      setNotes(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes(searchQuery);
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      loadNotes();
    } else {
      loadNotes(query.trim());
    }
  };

  const saveNote = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Judul catatan tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingNote) {
        const updateData: UpdateNoteRequest = {
          title: title.trim(),
          content: content.trim(),
        };
        const updatedNote = await notesService.updateNote(editingNote.id, updateData);
        setNotes(prev => prev.map(note => 
          note.id === editingNote.id ? updatedNote : note
        ));
      } else {
        const noteData: CreateNoteRequest = {
          title: title.trim(),
          content: content.trim(),
          type: 'TEXT',
          status: 'DRAFT',
        };
        const newNote = await notesService.createNote(noteData);
        setNotes(prev => [newNote, ...prev]);
      }

      setModalVisible(false);
      resetForm();
      Alert.alert("Success", editingNote ? "Note updated successfully" : "Note created successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editNote = (note: BackendNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  };

  const deleteNote = (note: BackendNote) => {
    Alert.alert(
      "Hapus Catatan",
      `Apakah Anda yakin ingin menghapus "${note.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            try {
              await notesService.deleteNote(note.id);
              setNotes(prev => prev.filter(n => n.id !== note.id));
              Alert.alert("Success", "Note deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete note");
            }
          }
        },
      ]
    );
  };

  const summarizeNote = async (note: BackendNote) => {
    if (!note.content.trim()) {
      Alert.alert("Error", "Cannot summarize empty note");
      return;
    }

    try {
      setSummaryLoading(note.id);
      const result = await aiService.summarizeText(note.content);
      
      Alert.alert(
        "AI Summary",
        result.summary,
        [
          { text: "Close", style: "cancel" },
          { 
            text: "Save as Note", 
            onPress: async () => {
              try {
                const summaryNote: CreateNoteRequest = {
                  title: `Summary: ${note.title}`,
                  content: result.summary,
                  type: 'TEXT',
                  status: 'DRAFT',
                };
                const newNote = await notesService.createNote(summaryNote);
                setNotes(prev => [newNote, ...prev]);
                Alert.alert("Success", "Summary saved as new note");
              } catch (error: any) {
                Alert.alert("Error", "Failed to save summary");
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to summarize note");
    } finally {
      setSummaryLoading(null);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingNote(null);
  };

  const openModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderNote = ({ item }: { item: BackendNote }) => (
    <TouchableOpacity 
      style={styles.noteCard}
      onPress={() => editNote(item)}
      activeOpacity={0.8}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.noteActions}>
          <TouchableOpacity 
            onPress={() => summarizeNote(item)}
            style={styles.actionButton}
            disabled={summaryLoading === item.id}
          >
            {summaryLoading === item.id ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="sparkles" size={18} color={colors.accent} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => deleteNote(item)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content || "No content"}
      </Text>
      
      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>
          {formatDate(item.updatedAt)}
        </Text>
        <View style={styles.noteMetadata}>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'PUBLISHED' ? colors.success : colors.warning }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.authorText}>by {item.author.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No notes found' : 'Belum Ada Catatan'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try a different search term' : 'Tap tombol + untuk membuat catatan pertama'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading notes...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
                loadNotes();
              }}
              style={styles.searchClearButton}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {notes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, styles.searchFab]} 
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons name="search" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={openModal}>
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButton}>Batal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingNote ? "Edit Catatan" : "Catatan Baru"}
            </Text>
            <TouchableOpacity 
              onPress={saveNote}
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.saveButton, !title.trim() && styles.buttonDisabled]}>
                  Simpan
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Judul catatan..."
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
            />
            <TextInput
              style={styles.contentInput}
              placeholder="Tulis catatan Anda di sini..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  searchClearButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  notesList: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceVariant,
  },
  noteContent: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  noteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  authorText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchFab: {
    backgroundColor: colors.accent,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    paddingVertical: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
});