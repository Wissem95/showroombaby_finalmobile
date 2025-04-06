import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Utiliser l'adresse IP du réseau local plutôt que localhost pour les tests sur appareil physique
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
// Exemple: "http://192.168.1.X:8000/api" où X est votre numéro d'IP
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.2:8000/api'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com/api';  // URL de production

// Configuration d'Axios pour déboguer les requêtes
// Désactivation des logs en production
const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

// Intercepteur des requêtes
axios.interceptors.request.use(request => {
  if (isDevelopment) {
    console.log('Request:', request.method, request.url, request.data);
  }
  return request;
});

// Intercepteur des réponses
axios.interceptors.response.use(
  response => {
    if (isDevelopment) {
      console.log('Response:', response.status, response.data);
    }
    return response;
  },
  error => {
    if (isDevelopment) {
      console.log('Error Response:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

// Configuration globale axios avec intercepteur pour ajouter automatiquement le token
axios.interceptors.request.use(
  async (config) => {
    // Ne pas ajouter de token pour les requêtes d'authentification
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      return config;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur récupération token dans intercepteur:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  device_name?: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  password_confirmation: string;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private token: string | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async init() {
    if (this.initialized) return;
    
    this.token = await AsyncStorage.getItem('token');
    console.log('Auth init - Token récupéré:', this.token ? 'Token présent' : 'Aucun token');
    
    if (this.token) {
      try {
        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 5000 // Ajouter un timeout
        });
        this.user = response.data;
        console.log('Auth init - Profil récupéré:', this.user);
      } catch (error) {
        console.error('Auth init - Erreur récupération profil:', error);
        // Ne pas se déconnecter automatiquement en cas d'erreur réseau
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await this.logout();
        } else {
          console.log('Erreur réseau - garder le token actif');
        }
      }
    }
    
    this.initialized = true;
  }

  async login(credentials: LoginCredentials): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });

      if (response.data.access_token) {
        this.token = response.data.access_token;
        this.user = response.data.user;
        
        await AsyncStorage.setItem('token', response.data.access_token);
        await AsyncStorage.setItem('userId', response.data.user.id.toString());
        
        console.log('Login réussi - Token stocké:', this.token ? 'Token présent' : 'Aucun token');
        
        return response.data;
      }
      throw new Error('Token non reçu');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      throw new Error('Email ou mot de passe incorrect');
    }
  }

  async register(credentials: RegisterCredentials) {
    try {
      // Ajouter le device_name si non spécifié
      const registerData = {
        ...credentials,
        device_name: credentials.device_name || 'mobile'
      };
      
      const response = await axios.post(`${API_URL}/auth/register`, registerData);
      
      if (!response.data.access_token && !response.data.token) {
        console.error('Pas de token dans la réponse:', response.data);
        throw new Error('Aucun token reçu du serveur');
      }
      
      this.token = response.data.access_token || response.data.token;
      await AsyncStorage.setItem('token', this.token || '');
      
      // Si les informations utilisateur sont déjà dans la réponse, les utiliser directement
      if (response.data.user) {
        this.user = response.data.user;
        return this.user;
      }
      
      const userResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      this.user = userResponse.data;
      return this.user;
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      
      let errorMsg = 'Erreur d\'inscription';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      
      throw new Error(errorMsg);
    }
  }

  async logout() {
    if (this.token) {
      try {
        await axios.post(`${API_URL}/auth/logout`, null, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    }
    this.token = null;
    this.user = null;
    
    // Supprimer toutes les données d'authentification
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    
    // Ajouter d'autres clés à supprimer si nécessaire
    
    return { success: true, message: 'Déconnexion réussie' };
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Version asynchrone qui vérifie le token stocké si nécessaire
  async isAuthenticatedAsync(): Promise<boolean> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('token');
    }
    return !!this.token;
  }

  // Fonction pour vérifier si l'utilisateur est connecté avec un token valide
  async checkAuth(): Promise<boolean> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('token');
      if (!this.token) {
        console.log('checkAuth: Aucun token trouvé');
        return false;
      }
    }
    
    try {
      // Vérifier si le token est valide
      const response = await axios.get(`${API_URL}/auth/check`, {
        headers: { Authorization: `Bearer ${this.token}` },
        timeout: 5000 // Ajouter un timeout pour éviter les attentes infinies
      });
      
      if (response.status === 200 && response.data.user) {
        // Mettre à jour les informations de l'utilisateur
        this.user = response.data.user;
        console.log('checkAuth: Token valide, utilisateur mis à jour');
        return true;
      }
      
      console.log('checkAuth: Réponse reçue mais format inattendu', response.status);
      return false;
    } catch (error) {
      console.error('Erreur vérification token:', error);
      // Si erreur 401, le token n'est plus valide
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log('checkAuth: Token invalide (401), déconnexion');
        await this.logout();
      }
      // Éviter de se déconnecter pour les erreurs réseau
      else if (axios.isAxiosError(error) && !error.response) {
        console.log('checkAuth: Erreur réseau, considérer le token comme valide');
        return !!this.token; // Considérer le token valide en cas d'erreur réseau
      }
      return false;
    }
  }

  // Utiliser cette fonction pour les requêtes API qui nécessitent l'authentification
  async getAuthHeaders() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('token');
    }
    
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('token', token);
    try {
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.user = response.data;
      return this.user;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw new Error('Erreur lors de la récupération du profil utilisateur');
    }
  }
}

export default AuthService.getInstance(); 