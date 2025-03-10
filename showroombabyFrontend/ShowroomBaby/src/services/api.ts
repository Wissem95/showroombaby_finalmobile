import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Utiliser l'adresse IP locale de votre machine au lieu de localhost ou 10.0.2.2
// Pour trouver votre IP locale, utilisez `ifconfig` (Mac/Linux) ou `ipconfig` (Windows)
// Par exemple: 192.168.1.X - Remplacez X par votre numéro
const API_URL = 'http://192.168.1.68:8000/api';

console.log('API URL utilisée:', API_URL);

// Création d'une instance axios avec la configuration de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Augmentation du timeout à 30 secondes
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Journaliser l'erreur pour le débogage
    console.log('Erreur API interceptée:', error);
    
    if (!error.response) {
      console.log('Pas de réponse du serveur - problème réseau probable');
      // Créer une erreur avec un message explicite pour les problèmes réseau
      const networkError = new Error(
        'Impossible de contacter le serveur. Veuillez vérifier votre connexion internet.'
      );
      return Promise.reject(networkError);
    }
    
    const originalRequest = error.config;
    
    // Gérer l'expiration du token (code 401)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Rediriger vers la page de connexion
      // Nous implémenterons cette logique plus tard avec la navigation
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      // navigation.navigate('Login') sera implémenté plus tard
    }
    
    return Promise.reject(error);
  }
);

export default api; 