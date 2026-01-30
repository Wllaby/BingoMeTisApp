
import 'expo-router/entry';

// Initialize Natively console log capture after imports
// Wrapped in try-catch to prevent any initialization crashes
try {
  require('./utils/errorLogger');
} catch (error) {
  console.error('Failed to initialize error logger:', error);
}
