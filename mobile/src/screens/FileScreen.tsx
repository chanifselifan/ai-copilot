import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import { colors } from "../theme/colors";
// Fixed import - create the fileService file or update the path
import fileService, { UploadedFile, FileQueryResponse } from "../services/fileServices";

export default function FilesScreen() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [queryModalVisible, setQueryModalVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<FileQueryResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fileService.getFiles(1, 50);
      setFiles(response.files);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const pickAndUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      if (!fileService.isFileSupported(file.mimeType || '')) {
        Alert.alert('Error', 'File type not supported');
        return;
      }

      if (file.size && file.size > 10 * 1024 * 1024) { // 10MB limit
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }

      setIsUploading(true);
      const uploadResponse = await fileService.uploadFile(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream'
      );

      setFiles(prev => [uploadResponse.file, ...prev] as UploadedFile[]);
      Alert.alert('Success', 'File uploaded successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = (file: UploadedFile) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.originalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fileService.deleteFile(file.id);
              setFiles(prev => prev.filter(f => f.id !== file.id) as UploadedFile[]);
              Alert.alert('Success', 'File deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const queryFile = async () => {
    if (!selectedFile || !query.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    try {
      setIsQuerying(true);
      const result = await fileService.queryFile({
        fileId: selectedFile.id,
        query: query.trim(),
      });
      setQueryResult(result);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to query file');
    } finally {
      setIsQuerying(false);
    }
  };

  const openQueryModal = (file: UploadedFile) => {
    if (file.status !== 'READY') {
      Alert.alert('Info', 'File is still being processed. Please wait.');
      return;
    }
    setSelectedFile(file);
    setQuery('');
    setQueryResult(null);
    setQueryModalVisible(true);
  };

  const renderFile = ({ item }: { item: UploadedFile }) => {
    const status = fileService.getFileStatus(item.status);
    
    return (
      <View style={styles.fileCard}>
        <View style={styles.fileHeader}>
          <View style={styles.fileIconContainer}>
            <Ionicons 
              name={fileService.getFileIcon(item.mimeType) as any} 
              size={24} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={2}>
              {item.originalName}
            </Text>
            <Text style={styles.fileSize}>
              {fileService.formatFileSize(item.size)}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          </View>
          <View style={styles.fileActions}>
            <TouchableOpacity
              onPress={() => openQueryModal(item)}
              style={[styles.actionButton, item.status !== 'READY' && styles.actionButtonDisabled]}
              disabled={item.status !== 'READY'}
            >
              <Ionicons name="chatbubble" size={18} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteFile(item)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        {item.metadata && (
          <View style={styles.fileMetadata}>
            {item.metadata.pages && (
              <Text style={styles.metadataText}>
                {item.metadata.pages} pages
              </Text>
            )}
            {item.metadata.wordCount && (
              <Text style={styles.metadataText}>
                {item.metadata.wordCount.toLocaleString()} words
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cloud-upload-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Files Yet</Text>
      <Text style={styles.emptySubtitle}>
        Upload documents and start chatting with your files using AI
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {files.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={renderFile}
          contentContainerStyle={styles.filesList}
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

      <TouchableOpacity
        style={[styles.fab, isUploading && styles.fabDisabled]}
        onPress={pickAndUploadFile}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Ionicons name="add" size={24} color={colors.text} />
        )}
      </TouchableOpacity>

      {/* Query Modal */}
      <Modal
        visible={queryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setQueryModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chat with File</Text>
            <TouchableOpacity
              onPress={queryFile}
              disabled={isQuerying || !query.trim()}
            >
              {isQuerying ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.askButton, !query.trim() && styles.buttonDisabled]}>
                  Ask
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {selectedFile && (
              <View style={styles.filePreview}>
                <Ionicons 
                  name={fileService.getFileIcon(selectedFile.mimeType) as any} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.filePreviewText} numberOfLines={1}>
                  {selectedFile.originalName}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.queryInput}
              placeholder="Ask a question about this file..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />

            {queryResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Answer:</Text>
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{queryResult.answer}</Text>
                </View>
                
                {queryResult.relevantChunks && queryResult.relevantChunks.length > 0 && (
                  <View style={styles.chunksContainer}>
                    <Text style={styles.chunksLabel}>Relevant sections:</Text>
                    {queryResult.relevantChunks.slice(0, 2).map((chunk: { text: string; page?: number }, index: number) => (
                      <View key={index} style={styles.chunkItem}>
                        <Text style={styles.chunkText} numberOfLines={3}>
                          {chunk.text}
                        </Text>
                        {chunk.page && (
                          <Text style={styles.pageNumber}>Page {chunk.page}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
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
  filesList: {
    padding: 16,
  },
  fileCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.surfaceVariant,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  fileMetadata: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  metadataText: {
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
  fabDisabled: {
    opacity: 0.6,
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
  askButton: {
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
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  filePreviewText: {
    color: colors.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  queryInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultContainer: {
    marginTop: 20,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  answerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  answerText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  chunksContainer: {
    marginTop: 8,
  },
  chunksLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chunkItem: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  chunkText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pageNumber: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
});