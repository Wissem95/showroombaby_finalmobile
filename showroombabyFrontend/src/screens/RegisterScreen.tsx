import React, { useState } from 'react';
import { StyleSheet, View, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, IconButton } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BlurView } from 'expo-blur';
import AuthService from '../services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.2:8000'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';

type Props = NativeStackScreenProps<any, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [userType, setUserType] = useState('particulier');
  const [name, setName] = useState('');
  const [siret, setSiret] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    navigation.goBack();
  };

  const handleRegister = async () => {
    if (!email || !password || !passwordConfirmation || !name) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (name.length < 3) {
      setError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (userType === 'professionnel' && !siret) {
      setError('Le numéro de SIRET est obligatoire pour les professionnels');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const userData = {
        email,
        password,
        username: name,
        name: name, // Ajout du champ name pour le backend
        password_confirmation: passwordConfirmation,
        ...(userType === 'professionnel' && { siret }),
        user_type: userType
      };

      const response = await axios.post(`${API_URL}/api/auth/register`, userData);

      if (response.data.access_token) {
        // Connexion automatique après inscription
        await AuthService.setToken(response.data.access_token);
        navigation.replace('Home');
      }
    } catch (err: any) {
      console.error('Erreur inscription:', err.response?.data || err.message);
      
      // Gestion détaillée des erreurs de validation
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/IMG_3139-Photoroom.png')}
      style={styles.background}
    >
      <BlurView intensity={20} style={styles.container}>
        <IconButton
          icon="close"
          size={24}
          onPress={handleClose}
          style={styles.closeButton}
        />
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <Text style={styles.title}>Showroombaby</Text>
          <Text style={styles.subtitle}>PARIS</Text>

          <View style={styles.tabs}>
            <Text style={styles.tab} onPress={() => navigation.navigate('Login')}>Connection</Text>
            <Text style={[styles.tab, styles.activeTab]}>Inscription</Text>
          </View>

          <SegmentedButtons
            value={userType}
            onValueChange={setUserType}
            buttons={[
              { value: 'particulier', label: 'Particulier' },
              { value: 'professionnel', label: 'Professionnel' },
            ]}
            style={styles.segmentedButton}
          />

          <TextInput
            mode="outlined"
            label={userType === 'professionnel' ? "Nom de société" : "Nom complet"}
            value={name}
            onChangeText={setName}
            style={styles.input}
            theme={{ colors: { primary: '#ff6b9b' }, roundness: 10 }}
          />

          {userType === 'professionnel' && (
            <TextInput
              mode="outlined"
              label="Numéro de siret"
              value={siret}
              onChangeText={setSiret}
              style={styles.input}
              theme={{ colors: { primary: '#ff6b9b' }, roundness: 10 }}
            />
          )}

          <TextInput
            mode="outlined"
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            theme={{ colors: { primary: '#ff6b9b' }, roundness: 10 }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            mode="outlined"
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            theme={{ colors: { primary: '#ff6b9b' }, roundness: 10 }}
          />

          <TextInput
            mode="outlined"
            label="Confirmer le mot de passe"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            style={styles.input}
            theme={{ colors: { primary: '#ff6b9b' }, roundness: 10 }}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            contentStyle={styles.buttonContent}
            loading={loading}
          >
            S'inscrire
          </Button>

          <Text style={styles.orText}>ou</Text>

          <View style={styles.socialButtons}>
            <Button
              mode="outlined"
              icon="google"
              onPress={() => {}}
              style={styles.socialButton}
            >
              Continuer avec Google
            </Button>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </KeyboardAvoidingView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
    padding: wp('5%'),
    justifyContent: 'center',
  },
  title: {
    fontSize: wp('8%'),
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: wp('4%'),
    textAlign: 'center',
    color: '#666',
    marginBottom: hp('5%'),
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: hp('3%'),
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: hp('1%'),
    fontSize: wp('4%'),
    color: '#666',
  },
  activeTab: {
    color: '#ff6b9b',
    borderBottomWidth: 2,
    borderBottomColor: '#ff6b9b',
  },
  segmentedButton: {
    marginBottom: hp('3%'),
  },
  input: {
    marginBottom: hp('2%'),
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  button: {
    backgroundColor: '#ff6b9b',
    borderRadius: 25,
    marginBottom: hp('2%'),
  },
  buttonContent: {
    height: hp('6%'),
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: hp('2%'),
  },
  socialButtons: {
    marginTop: hp('2%'),
  },
  socialButton: {
    borderRadius: 25,
    marginBottom: hp('1%'),
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: hp('2%'),
    left: wp('2%'),
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
}); 