import { User } from './User';

/**
 * Modèle de données pour une catégorie
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
}

/**
 * Modèle de données pour un produit
 */
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  user: User;
  createdAt: string;
  updatedAt?: string;
  condition?: 'new' | 'used' | 'good' | 'excellent';
  location?: string;
  isSold?: boolean;
  viewCount?: number;
  [key: string]: any; // Pour toute propriété supplémentaire
}

/**
 * Modèle de données pour la création d'un produit
 */
export interface CreateProduct {
  title: string;
  description: string;
  price: number;
  category_id: number;
  condition?: 'new' | 'used' | 'good' | 'excellent';
  location?: string;
  images?: File[] | string[];
}

/**
 * Modèle de données pour la mise à jour d'un produit
 */
export interface UpdateProduct {
  title?: string;
  description?: string;
  price?: number;
  category_id?: number;
  condition?: 'new' | 'used' | 'good' | 'excellent';
  location?: string;
  images?: File[] | string[];
  isSold?: boolean;
}

/**
 * Interface pour les paramètres de recherche et de filtrage des produits
 */
export interface ProductSearchParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  condition?: string;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}

/**
 * Interface pour la pagination
 */
export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Interface pour la réponse paginée des produits
 */
export interface ProductsResponse {
  data: Product[];
  meta: Pagination;
} 