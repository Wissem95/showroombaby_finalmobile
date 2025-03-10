/**
 * Modèle de données pour un utilisateur
 */
export interface User {
  id: number;
  email: string;
  username: string;
  avatar?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  isProfessional?: boolean;
  isSeller?: boolean;
  [key: string]: any; // Pour toute propriété supplémentaire
}

/**
 * Modèle de données pour la création d'un utilisateur (inscription)
 */
export interface RegisterUser {
  email: string;
  password: string;
  password_confirmation: string;
  username: string;
  phone?: string;
  isProfessional?: boolean;
}

/**
 * Modèle de données pour la connexion d'un utilisateur
 */
export interface LoginUser {
  email: string;
  password: string;
}

/**
 * Modèle de données pour la mise à jour d'un profil utilisateur
 */
export interface UpdateUser {
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string | null;
  [key: string]: any; // Pour toute propriété supplémentaire
}

/**
 * Modèle de données pour le changement de mot de passe
 */
export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Modèle de données pour la réponse d'authentification
 */
export interface AuthResponse {
  user: User;
  access_token: string;
  message: string;
} 