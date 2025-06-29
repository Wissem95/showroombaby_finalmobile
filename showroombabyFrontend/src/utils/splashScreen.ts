import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

// Empêcher le splash screen de se fermer automatiquement
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

// Fonction pour cacher le splash screen
export const hideSplashScreen = async () => {
  try {
    // Attendre un peu plus longtemps sur iOS pour s'assurer que le splash screen est bien affiché
    if (Platform.OS === 'ios') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await SplashScreen.hideAsync();
  } catch (error) {
    console.warn('Erreur lors de la fermeture du splash screen:', error);
  }
}; 