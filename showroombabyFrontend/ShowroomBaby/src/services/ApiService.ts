import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { API_URL, API_TIMEOUT } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service API générique pour l'application ShowroomBaby
 * Gère les requêtes HTTP avec Axios
 */
class ApiService {
  private api: AxiosInstance;
  
  constructor() {
    // Création de l'instance Axios avec la configuration de base
    this.api = axios.create({
      baseURL: API_URL || 'http://192.168.1.68:8000/api',
      timeout: parseInt(API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Intercepteur pour gérer les réponses et les erreurs
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Gestion des erreurs globales (ex: 401, 500, etc.)
        if (error.response && error.response.status === 401) {
          // Redirection vers la page de login ou notification
          console.error('Session expirée, veuillez vous reconnecter');
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Exécute une requête GET
   * @param url - Endpoint API
   * @param params - Paramètres de requête
   * @param config - Configuration Axios supplémentaire
   */
  async get<T>(url: string, params = {}, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, { ...config, params });
  }
  
  /**
   * Exécute une requête POST
   * @param url - Endpoint API
   * @param data - Données à envoyer
   * @param config - Configuration Axios supplémentaire
   */
  async post<T>(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }
  
  /**
   * Exécute une requête PUT
   * @param url - Endpoint API
   * @param data - Données à envoyer
   * @param config - Configuration Axios supplémentaire
   */
  async put<T>(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }
  
  /**
   * Exécute une requête DELETE
   * @param url - Endpoint API
   * @param config - Configuration Axios supplémentaire
   */
  async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }
  
  /**
   * Crée une instance spécifique pour les uploads multi-part
   * Utilisé pour l'envoi de fichiers
   */
  getMultipartInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: API_URL || 'http://192.168.1.68:8000/api',
      timeout: parseInt(API_TIMEOUT || '30000'), // Timeout plus long pour les uploads
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    });
    
    return instance;
  }
}

// Export d'une instance unique du service
export default new ApiService(); 