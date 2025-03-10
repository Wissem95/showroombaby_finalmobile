import ApiService from './ApiService';

/**
 * Interface pour les options de filtrage des produits
 */
export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  sortBy?: 'date' | 'price_asc' | 'price_desc';
}

/**
 * Service gérant les opérations liées aux produits
 */
class ProductService {
  /**
   * Récupère la liste des produits avec filtres
   * @param filters - Options de filtrage
   */
  async getProducts(filters: ProductFilters = {}) {
    try {
      const response = await ApiService.get('/products', filters);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  }

  /**
   * Récupère les détails d'un produit
   * @param id - ID du produit
   */
  async getProductDetails(id: number) {
    try {
      const response = await ApiService.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les produits similaires
   * @param id - ID du produit de référence
   */
  async getSimilarProducts(id: number) {
    try {
      const response = await ApiService.get(`/products/${id}/similar`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des produits similaires à ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les produits tendance
   */
  async getTrendingProducts() {
    try {
      const response = await ApiService.get('/products/trending');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits tendance:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau produit
   * @param data - Données du produit
   * @param images - Images du produit
   */
  async createProduct(data: any, images: any[]) {
    try {
      // Préparation du FormData pour l'envoi des images
      const formData = new FormData();
      
      // Ajout des données du produit
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      // Ajout des images
      images.forEach((image, index) => {
        formData.append('images[]', {
          uri: image.uri,
          name: `image_${index}.jpg`,
          type: 'image/jpeg',
        } as any);
      });
      
      // Utilisation de l'instance multipart pour l'upload
      const multipartInstance = ApiService.getMultipartInstance();
      const response = await multipartInstance.post('/products', formData);
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }
}

export default new ProductService(); 