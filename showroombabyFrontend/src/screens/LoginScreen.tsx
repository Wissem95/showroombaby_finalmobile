import React, { useState } from 'react';
import { StyleSheet, View, ImageBackground, KeyboardAvoidingView, Platform, TouchableOpacity, Animated, Alert } from 'react-native';
import { TextInput, Button, Text, IconButton } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BlurView } from 'expo-blur';
import AuthService from '../services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      
      // Vérifier s'il y a une redirection à faire après connexion
      const redirectScreen = await AsyncStorage.getItem('redirectAfterLogin');
      await AsyncStorage.removeItem('redirectAfterLogin'); // Nettoyer après utilisation
      
      // Afficher un message de confirmation
      Alert.alert(
        'Connexion réussie',
        'Bienvenue sur Showroombaby!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Rediriger vers l'écran sauvegardé ou vers l'accueil par défaut
              if (redirectScreen) {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: redirectScreen
                  })
                );
              } else {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  })
                );
              }
            }
          }
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setDebugInfo('Erreur: ' + JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPress = () => {
    navigation.navigate('Register');
  };

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
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
            <Text style={[styles.tab, styles.activeTab]}>Connection</Text>
            <TouchableOpacity onPress={handleRegisterPress}>
              <Text style={styles.tab}>Inscription</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            mode="outlined"
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            theme={{
              colors: { primary: '#ff6b9b' },
              roundness: 10,
            }}
          />

          <TextInput
            mode="outlined"
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            theme={{
              colors: { primary: '#ff6b9b' },
              roundness: 10,
            }}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
                forceTextInputFocus={false}
              />
            }
          />

          <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>

          <View style={styles.formContainer}>
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Se connecter
            </Button>

            <Button
              mode="outlined"
              onPress={handleRegisterPress}
              style={[styles.button, styles.registerButton]}
              disabled={loading}
            >
              S'inscrire
            </Button>

            <Button
              mode="text"
              onPress={() => {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  })
                );
              }}
              style={styles.homeButton}
            >
              Retour à l'accueil
            </Button>
          </View>

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
              <Text style={styles.debugText}>Backend URL: http://192.168.0.34:8000/api</Text>
              <Text style={styles.debugText}>Données d'utilisateur test:</Text>
              <Text style={styles.debugText}>- Email: vendeur@test.com</Text>
              <Text style={styles.debugText}>- Mot de passe: password123</Text>
              <Text style={styles.debugText}>Réponse API:</Text>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          )}
          
          {loading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Connexion en cours...</Text>
            </View>
          )}
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
    paddingHorizontal: wp('10%'),
  },
  activeTab: {
    color: '#ff6b9b',
    borderBottomWidth: 2,
    borderBottomColor: '#ff6b9b',
  },
  input: {
    marginBottom: hp('2%'),
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#666',
    marginBottom: hp('3%'),
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
  linkButton: {
    marginTop: 10,
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
  closeButton: {
    position: 'absolute',
    top: hp('2%'),
    left: wp('2%'),
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    marginBottom: hp('2%'),
  },
  registerButton: {
    backgroundColor: 'white',
    borderColor: '#ff6b9b',
    borderWidth: 2,
  },
  homeButton: {
    marginTop: 8,
  },
}); 