import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import AuthService from '../services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await AuthService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (err) {
      setError('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        label="Nom"
        value={name}
        onChangeText={setName}
      />

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

      <TextInput
        style={styles.input}
        label="Confirmation du mot de passe"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        secureTextEntry
      />

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        style={styles.button}
      >
        S'inscrire
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.linkButton}
      >
        Déjà un compte ? Se connecter
      </Button>
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
}); 