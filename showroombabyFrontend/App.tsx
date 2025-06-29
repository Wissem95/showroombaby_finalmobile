import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRegistry } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { hideSplashScreen } from './src/utils/splashScreen';

// Création du client React Query
const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Cacher le splash screen une fois que l'app est prête
    hideSplashScreen();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('main', () => App);

export default App;
