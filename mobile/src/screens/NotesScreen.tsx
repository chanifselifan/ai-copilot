import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { Note } from "../types";

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const saveNote = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Judul catatan tidak boleh kosong");
      return;
    }

    if (editingNote) {
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { ...note, title, content, updatedAt: new Date() }
          : note
      ));
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setModalVisible(false);
    setTitle("");
    setContent("");
    setEditingNote(null);
  };

  const editNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  };

  const deleteNote = (id: string) => {
    Alert.alert(
      "Hapus Catatan",
      "Apakah Anda yakin ingin menghapus catatan ini?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: () => {
          setNotes(prev => prev.filter(note => note.id !== id));
        }},
      ]
    );
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity 
      style={styles.noteCard}
      onPress={() => editNote(item)}
      activeOpacity={0.8}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <TouchableOpacity 
          onPress={() => deleteNote(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content || "Tidak ada konten"}
      </Text>
      <Text style={styles.noteDate}>
        {item.updatedAt.toLocaleDateString('id-ID')}
      </Text>
    </TouchableOpacity>
  );

  const openModal = () => {
    setTitle("");
    setContent("");
    setEditingNote(null);
    setModalVisible(true);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Belum Ada Catatan</Text>
          <Text style={styles.emptySubtitle}>Tap tombol + untuk membuat catatan pertama</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Ionicons name="add" size={24} color={colors.text} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Batal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingNote ? "Edit Catatan" : "Catatan Baru"}
            </Text>
            <TouchableOpacity onPress={saveNote}>
              <Text style={styles.saveButton}>Simpan</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Judul catatan..."
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.contentInput}
              placeholder="Tulis catatan Anda di sini..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
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
  deleteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  noteDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
