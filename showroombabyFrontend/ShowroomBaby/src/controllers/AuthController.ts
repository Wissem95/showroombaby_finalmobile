import authService from '../services/authService';
import { RegisterUser, LoginUser, AuthResponse, User } from '../models/User';

/**
 * Contrôleur gérant les actions liées à l'authentification
 */
class AuthController {
  /**
   * Inscrit un nouvel utilisateur
   * @param userData Données d'inscription de l'utilisateur
   * @returns Promesse avec les données de l'utilisateur créé
   */
  async register(userData: RegisterUser): Promise<{ user: User; message: string }> {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error.message || 'Erreur inconnue');
      throw error;
    }
  }

  /**
   * Connecte un utilisateur
   * @param credentials Données de connexion
   * @returns Promesse avec la réponse d'authentification
   */
  async login(credentials: LoginUser): Promise<AuthResponse> {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error.message || 'Erreur inconnue');
      throw error;
    }
  }

  /**
   * Déconnecte l'utilisateur actuel
   * @returns Promesse avec le message de déconnexion
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await authService.logout();
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error.message || 'Erreur inconnue');
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns Booléen indiquant si l'utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return await authService.isAuthenticated();
    } catch (error: any) {
      console.error('Erreur lors de la vérification d\'authentification:', error.message || 'Erreur inconnue');
      return false;
    }
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   * @returns L'utilisateur connecté ou null
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await authService.getCurrentUser();
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error.message || 'Erreur inconnue');
      return null;
    }
  }
}

export default new AuthController(); 