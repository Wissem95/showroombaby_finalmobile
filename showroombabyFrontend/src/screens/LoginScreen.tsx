import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Button, TextInput, Text, Snackbar } from 'react-native-paper';
import AuthService from '../services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('test@example.com'); // Valeur prérémplie
  const [password, setPassword] = useState('password'); // Valeur prérémplie
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Tentative de connexion...');
      
      const response = await AuthService.login({ email, password });
      
      setDebugInfo('Connexion réussie! User: ' + JSON.stringify(response));
      
      // Rediriger vers la page d'accueil
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setDebugInfo('Erreur: ' + JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
        disabled={loading}
      >
        Se connecter
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        style={styles.linkButton}
        disabled={loading}
      >
        Créer un compte
      </Button>
      
      <Button
        mode="text"
        onPress={() => setDebugVisible(!debugVisible)}
        style={styles.linkButton}
      >
        {debugVisible ? 'Masquer debug' : 'Afficher debug'}
      </Button>
      
      {debugVisible && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Informations de débogage:</Text>
          <Text style={styles.debugText}>Backend URL: http://127.0.0.1:8000/api</Text>
          <Text style={styles.debugText}>Données d'utilisateur test:</Text>
          <Text style={styles.debugText}>- Email: test@example.com</Text>
          <Text style={styles.debugText}>- Nom: Test User</Text>
          <Text style={styles.debugText}>- Username: monahan.tressa</Text>
          <Text style={styles.debugText}>Réponse API:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Connexion en cours...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  linkButton: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loadingText: {
    marginTop: 10,
  },
}); 