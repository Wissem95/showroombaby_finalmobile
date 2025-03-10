import ApiService from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface pour les données d'inscription
export interface RegisterData {
  email: string;
  password: string;
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
 * Service gérant l'authentification des utilisateurs
 */
class AuthService {
  /**
   * Inscrit un nouvel utilisateur
   * @param data - Données d'inscription
   */
  async register(data: RegisterData) {
    try {
      const response = await ApiService.post('/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  /**
   * Connecte un utilisateur
   * @param data - Données de connexion
   */
  async login(data: LoginData) {
    try {
      const response = await ApiService.post('/auth/login', data);
      
      // Stocke le token dans AsyncStorage
      if (response.data.access_token) {
        await AsyncStorage.setItem('auth_token', response.data.access_token);
        
        // Stocke également les données utilisateur
        if (response.data.user) {
          await AsyncStorage.setItem('auth_user', JSON.stringify(response.data.user));
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout() {
    try {
      // Appel API pour la déconnexion
      await ApiService.post('/auth/logout');
      
      // Supprime le token et les données utilisateur localement
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      // Même en cas d'erreur API, on supprime les données locales
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  }

  /**
   * Récupère le token d'authentification
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  /**
   * Récupère l'utilisateur actuellement connecté depuis le stockage local
   */
  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('auth_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        return null;
      }
    }
    return null;
  }
}

export default new AuthService(); 