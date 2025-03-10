import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Types pour les paramètres des écrans d'authentification
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: { isProfessional?: boolean };
  ForgotPassword: undefined;
};

/**
 * Types pour les paramètres des onglets principaux
 */
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  AddProduct: undefined;
  Messages: undefined;
  Profile: undefined;
};

/**
 * Types pour les paramètres de la pile d'écrans d'accueil
 */
export type HomeStackParamList = {
  HomeScreen: undefined;
  ProductDetails: { productId: number };
  CategoryProducts: { categoryId: number; categoryName: string };
};

/**
 * Types pour les paramètres de la pile d'écrans de recherche
 */
export type SearchStackParamList = {
  SearchScreen: undefined;
  SearchResults: { query?: string; categoryId?: number };
  Filters: { currentFilters?: any };
};

/**
 * Types pour les paramètres de la pile d'écrans de messages
 */
export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: { userId: number; username: string };
};

/**
 * Types pour les paramètres de la pile d'écrans de profil
 */
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  MyProducts: undefined;
  Favorites: undefined;
  Settings: undefined;
};

/**
 * Types pour les paramètres de la navigation principale
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetails: { productId: number };
  UserProfile: { userId: number };
}; 