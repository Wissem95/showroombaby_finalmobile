import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Utiliser l'adresse IP du réseau local plutôt que localhost pour les tests sur appareil physique
const API_URL = 'http://127.0.0.1:8000/api';

// Configuration d'Axios pour déboguer les requêtes
axios.interceptors.request.use(request => {
  console.log('Request:', request.method, request.url, request.data);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  error => {
    console.log('Error Response:', error.response?.status, error.response?.data);
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

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async init() {
    this.token = await AsyncStorage.getItem('token');
    if (this.token) {
      try {
        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.user = response.data;
      } catch (error) {
        await this.logout();
      }
    }
  }

  async login(credentials: LoginCredentials) {
    try {
      // Ajouter le device_name si non spécifié
      const loginData = {
        ...credentials,
        device_name: credentials.device_name || 'mobile'
      };

      console.log('Tentative de connexion avec:', loginData);
      
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      
      // Vérifier si la réponse contient un token (access_token ou token)
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
      
      // Sinon récupérer les informations de l'utilisateur
      try {
        const userResponse = await axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.user = userResponse.data;
        return this.user;
      } catch (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw new Error('Erreur lors de la récupération du profil utilisateur');
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      // Message d'erreur plus détaillé
      let errorMsg = 'Erreur de connexion';
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Email ou mot de passe incorrect';
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      
      throw new Error(errorMsg);
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
    await AsyncStorage.removeItem('token');
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }
}

export default AuthService.getInstance(); 