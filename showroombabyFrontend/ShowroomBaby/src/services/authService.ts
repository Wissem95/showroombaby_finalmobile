import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface pour les données d'inscription
export interface RegisterData {
  email: string;
  password: string;
  password_confirmation: string;
  username: string;
}

// Interface pour les données de connexion
export interface LoginData {
  email: string;
  password: string;
}

// Interface pour la réponse de l'utilisateur
export interface User {
  id: number;
  email: string;
  username: string;
  [key: string]: any; // Pour les propriétés supplémentaires que nous pourrions recevoir
}

// Interface pour la réponse de connexion
export interface LoginResponse {
  access_token: string;
  message: string;
  user: User;
}

/**
 * Service d'authentification pour gérer l'inscription, la connexion et la déconnexion
 */
const authService = {
  /**
   * Inscrit un nouvel utilisateur
   * @param data Données d'inscription
   * @returns Promesse avec la réponse du serveur
   */
  register: async (data: RegisterData) => {
    try {
      console.log('Tentative d\'inscription avec les données:', data);
      // S'assurer que le chemin d'API est correct selon la documentation
      const response = await api.post('/auth/register', data);
      console.log('Réponse d\'inscription:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur brute lors de l\'inscription:', error);
      
      // Gestion améliorée des erreurs
      if (error.response) {
        // Erreur avec réponse du serveur
        console.error('Détails de l\'erreur serveur:', {
          status: error.response.status,
          data: error.response.data
        });
        throw error;
      } else if (error.request) {
        // Erreur sans réponse du serveur (problème réseau)
        console.error('Problème de connexion au serveur. Aucune réponse reçue.');
        throw new Error('Problème de connexion au serveur. Veuillez vérifier votre connexion internet.');
      } else {
        // Autre type d'erreur
        console.error('Erreur de configuration de la requête:', error.message);
        throw new Error('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    }
  },

  /**
   * Connecte un utilisateur
   * @param data Données de connexion
   * @returns Promesse avec la réponse du serveur
   */
  login: async (data: LoginData) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', data);
      
      // Stocker le token d'authentification
      if (response.data.access_token) {
        await AsyncStorage.setItem('auth_token', response.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      // Gestion améliorée des erreurs
      if (error.response) {
        // Erreur avec réponse du serveur
        throw error;
      } else if (error.request) {
        // Erreur sans réponse du serveur (problème réseau)
        throw new Error('Problème de connexion au serveur. Veuillez vérifier votre connexion internet.');
      } else {
        // Autre type d'erreur
        throw new Error('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    }
  },

  /**
   * Déconnecte l'utilisateur actuel
   * @returns Promesse avec la réponse du serveur
   */
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      
      // Supprimer le token d'authentification
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      
      return response.data;
    } catch (error: any) {
      // Même en cas d'erreur, on supprime les données locales
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      
      // Gestion améliorée des erreurs
      if (error.response) {
        // Erreur avec réponse du serveur
        throw error;
      } else if (error.request) {
        // Erreur sans réponse du serveur (problème réseau)
        throw new Error('Problème de connexion au serveur. Veuillez vérifier votre connexion internet.');
      } else {
        // Autre type d'erreur
        throw new Error('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    }
  },

  /**
   * Vérifie si l'utilisateur est connecté
   * @returns Booléen indiquant si l'utilisateur est connecté
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  },

  /**
   * Récupère l'utilisateur connecté
   * @returns Objet utilisateur ou null
   */
  getCurrentUser: async (): Promise<User | null> => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
};

export default authService; 