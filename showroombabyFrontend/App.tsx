import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';

// Création du client React Query
const queryClient = new QueryClient();

export default function App() {
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
