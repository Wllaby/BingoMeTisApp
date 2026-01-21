
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

export default function AdminUploadScreen() {
  console.log('AdminUploadScreen: Component mounted');
  
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<string[]>([]);

  const pickExcelFile = async () => {
    console.log('AdminUploadScreen: Picking Excel file');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('AdminUploadScreen: File picker canceled');
        return;
      }

      const file = result.assets[0];
      console.log('AdminUploadScreen: File selected', file.name);
      
      setUploading(true);
      await processExcelFile(file.uri);
      setUploading(false);
      
    } catch (error) {
      console.error('AdminUploadScreen: Error picking file', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const processExcelFile = async (fileUri: string) => {
    try {
      console.log('AdminUploadScreen: Processing Excel file', fileUri);
      
      // Read the file
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Parse the Excel file
      const workbook = XLSX.read(fileContent, { type: 'base64' });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('AdminUploadScreen: Excel data parsed', jsonData.length, 'rows');
      
      // Extract options (assuming first column contains the options)
      const options: string[] = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row && row[0]) {
          const value = String(row[0]).trim();
          if (value && value.length > 0) {
            options.push(value);
          }
        }
      }
      
      console.log('AdminUploadScreen: Extracted options', options.length);
      
      if (options.length === 0) {
        Alert.alert('Error', 'No valid options found in the Excel file. Make sure the first column contains the bingo card options.');
        return;
      }
      
      setPreviewData(options);
      
      Alert.alert(
        'Preview Data',
        `Found ${options.length} options. Would you like to update the Kids theme with these options?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('AdminUploadScreen: Update canceled'),
          },
          {
            text: 'Update',
            onPress: () => updateKidsOptions(options),
          },
        ]
      );
      
    } catch (error) {
      console.error('AdminUploadScreen: Error processing Excel file', error);
      Alert.alert('Error', 'Failed to process Excel file. Make sure it is a valid Excel file (.xlsx, .xls) or CSV file.');
    }
  };

  const updateKidsOptions = async (options: string[]) => {
    try {
      console.log('AdminUploadScreen: Updating Kids options', options.length);
      
      // Generate the new KidsOptions.ts file content
      const fileContent = `// Kid-friendly bingo card options
export const KidsOptions = ${JSON.stringify(options, null, 2)};
`;
      
      // In a real app, you would save this to the file system or send to backend
      // For now, we'll just show a success message with instructions
      
      Alert.alert(
        'Success!',
        `Found ${options.length} options from your Excel file.\n\nTo update the app, please share this data with the developer or use the backend API to update the Kids theme options.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('AdminUploadScreen: Update confirmed');
              router.back();
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('AdminUploadScreen: Error updating options', error);
      Alert.alert('Error', 'Failed to update options. Please try again.');
    }
  };

  const headerTitle = 'Upload Kids Options';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="doc.text.fill"
            android_material_icon_name="description"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.title}>Upload Excel File</Text>
          <Text style={styles.subtitle}>
            Upload an Excel file (.xlsx, .xls) or CSV file with the Kids theme bingo card options
          </Text>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>File Format Instructions:</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              Put each bingo card option in the first column (Column A)
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              One option per row
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              You can include a header row (it will be included as an option)
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.instructionText}>
              Recommended: 25-50 options for variety
            </Text>
          </View>
        </View>

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Example Excel Format:</Text>
          <View style={styles.exampleTable}>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleCell}>Unicorn</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleCell}>Dinosaur</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleCell}>Rainbow</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleCell}>Butterfly</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleCell}>Ice Cream</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickExcelFile}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <>
              <IconSymbol
                ios_icon_name="arrow.up.doc.fill"
                android_material_icon_name="upload"
                size={24}
                color={colors.card}
              />
              <Text style={styles.uploadButtonText}>Choose Excel File</Text>
            </>
          )}
        </TouchableOpacity>

        {previewData.length > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              Preview Data
            </Text>
            <Text style={styles.previewSubtitle}>
              ({previewData.length} options found)
            </Text>
            <ScrollView style={styles.previewList} nestedScrollEnabled>
              {previewData.slice(0, 20).map((option, index) => (
                <View key={index} style={styles.previewItem}>
                  <Text style={styles.previewNumber}>{index + 1}</Text>
                  <Text style={styles.previewText}>{option}</Text>
                </View>
              ))}
              {previewData.length > 20 && (
                <Text style={styles.previewMore}>
                  ... and {previewData.length - 20} more options
                </Text>
              )}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  exampleTable: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  exampleRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  exampleCell: {
    fontSize: 14,
    color: colors.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  previewList: {
    maxHeight: 300,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  previewNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    width: 40,
  },
  previewText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  previewMore: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});
