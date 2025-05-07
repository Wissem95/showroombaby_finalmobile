import axios from 'axios';
import { Alert } from 'react-native';
import { SERVER_IP } from '../../config/ip';

// URL de l'API avec l'adresse IP importée du fichier de config
const API_URL = process.env.NODE_ENV === 'development' || __DEV__
  ? `http://${SERVER_IP}:8000/api`
  : 'https://api.showroombaby.com/api';

// Base URL pour les images (sans le /api)
const IMAGE_BASE_URL = process.env.NODE_ENV === 'development' || __DEV__
  ? `http://${SERVER_IP}:8000`
  : 'https://api.showroombaby.com';

// Cache pour stocker les URL d'images déjà traitées
const imageUrlCache: Record<string, string> = {};
// Cache pour stocker les sources d'images déjà traitées
const imageSourceCache: Record<string, any> = {};

// Configuration des logs
const LOG_THRESHOLD = 10; // Réduit le seuil pour éviter de surcharger la console
let logCount = 0;
let totalImageLoads = 0; // Compteur global d'images traitées

// Image placeholder - à utiliser avec require dans les composants
const DEFAULT_IMAGE_URL = ''; // Défini à l'extérieur pour éviter des références circulaires

// Fonction utilitaire pour vérifier si une URL est valide
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const imageService = {
  /**
   * Traiter une URL d'image pour s'assurer qu'elle est complète
   * @param imagePath - Chemin relatif ou URL complète de l'image
   * @returns URL complète de l'image
   */
  getFullImageUrl: (imagePath: string | null): string => {
    if (!imagePath) {
      console.log('[DEBUG-IMG-SERVICE] Chemin d\'image NULL ou vide');
      return '';
    }
    
    // Incrémente le compteur total
    totalImageLoads++;
    
    // Vérifier si l'URL est déjà dans le cache
    if (imageUrlCache[imagePath]) {
      return imageUrlCache[imagePath];
    }
    
    // Toujours logger le premier lot d'images pour le débogage
    if (totalImageLoads < LOG_THRESHOLD) {
      console.log(`[DEBUG-IMG-SERVICE] (${totalImageLoads}) Traitement URL image:`, imagePath);
      console.log(`[DEBUG-IMG-SERVICE] SERVER_IP utilisé:`, SERVER_IP);
    }
    
    let result = '';
    
    try {
      // Si c'est déjà une URL complète et valide
      if (isValidUrl(imagePath)) {
        result = imagePath;
      }
      // Si c'est un chemin relatif commençant par /storage/
      else if (imagePath.startsWith('/storage/')) {
        result = `${IMAGE_BASE_URL}${imagePath}`;
      }
      // Cas spécial pour les chemins commençant par "storage/"
      else if (imagePath.startsWith('storage/')) {
        result = `${IMAGE_BASE_URL}/${imagePath}`;
      }
      // Autre cas - on ajoute /storage/ au chemin
      else {
        result = `${IMAGE_BASE_URL}/storage/${imagePath}`;
      }
      
      // Vérification supplémentaire
      if (!isValidUrl(result)) {
        console.warn(`[DEBUG-IMG-SERVICE] URL générée invalide: ${result}`);
        result = '';
      }
    } catch (error) {
      console.error('[DEBUG-IMG-SERVICE] Erreur lors du traitement de l\'URL:', error);
      result = '';
    }
    
    // Mettre en cache l'URL traitée
    imageUrlCache[imagePath] = result;
    
    return result;
  },

  /**
   * Extraire les URLs d'images d'un produit sous différents formats
   * @param product - Objet produit contenant des images
   * @returns Tableau d'URLs d'images
   */
  getProductImages: (product: any): string[] => {
    if (!product || !product.images) {
      console.log('[DEBUG-IMG-SERVICE] Produit sans images:', product?.id);
      return [];
    }

    console.log('[DEBUG-IMG-SERVICE] Structure des images du produit:', JSON.stringify(product.images));
    
    // Identifiant unique pour ce produit et ses images
    const cacheKey = `product_${product.id}_images`;
    
    // Vérifier si le résultat est déjà dans le cache
    if (imageUrlCache[cacheKey]) {
      // Retourner le résultat mis en cache sous forme de tableau
      return JSON.parse(imageUrlCache[cacheKey]);
    }

    try {
      let result: string[] = [];
      
      // Si les images sont stockées sous forme de chaîne JSON
      if (typeof product.images === 'string') {
        try {
          // Tentative de parse JSON
          const parsedImages = JSON.parse(product.images);
          console.log('[DEBUG-IMG-SERVICE] Images JSON parsées:', parsedImages);
          
          if (Array.isArray(parsedImages)) {
            result = parsedImages.map((img: any) => {
              if (typeof img === 'string') {
                return img;
              }
              if (img && typeof img === 'object') {
                if (img.path) {
                  return img.path;
                }
                if (img.url) {
                  return img.url;
                }
              }
              return '';
            }).filter(Boolean);
          }
          // Si c'est une chaîne JSON mais pas un tableau (peut-être un objet unique)
          else if (typeof parsedImages === 'object' && parsedImages !== null) {
            if (parsedImages.path) {
              result = [parsedImages.path];
            } else if (parsedImages.url) {
              result = [parsedImages.url];
            }
          }
          // Si c'est une autre forme de JSON, essayer de l'utiliser comme URL
          else {
            result = [product.images];
          }
        } catch (e) {
          console.log('[DEBUG-IMG-SERVICE] Erreur de parsing JSON, traitement comme chaîne:', e);
          // Si ce n'est pas un JSON valide, essayer d'utiliser directement comme une URL
          if (product.images.includes('.jpg') || 
              product.images.includes('.jpeg') || 
              product.images.includes('.png')) {
            result = [product.images];
          }
        }
      }
      // Si c'est déjà un tableau
      else if (Array.isArray(product.images)) {
        console.log('[DEBUG-IMG-SERVICE] Images en format tableau:', product.images);
        result = product.images.map((img: any) => {
          if (typeof img === 'string') {
            return img;
          }
          if (img && typeof img === 'object') {
            if (img.path) {
              return img.path;
            }
            if (img.url) {
              return img.url;
            }
          }
          return '';
        }).filter(Boolean);
      }
      // Si c'est un objet avec une propriété path ou url
      else if (typeof product.images === 'object' && product.images !== null) {
        console.log('[DEBUG-IMG-SERVICE] Images en format objet:', product.images);
        const img = product.images;
        if (img.path) {
          result = [img.path];
        } else if (img.url) {
          result = [img.url];
        }
      }
      
      console.log('[DEBUG-IMG-SERVICE] Résultat final du traitement des images:', result);
      
      // Mettre en cache le résultat
      imageUrlCache[cacheKey] = JSON.stringify(result);
      
      return result;
    } catch (error) {
      console.error('[DEBUG-IMG-SERVICE] Erreur lors du traitement des images:', error);
      return [];
    }
  },

  /**
   * Obtenir la source d'image pour l'affichage dans un composant React Native
   * Compatible avec le format requis par le composant Image
   * @param product - Objet produit contenant des images
   * @param placeholderImage - Image par défaut à utiliser
   * @returns Source d'image au format { uri: string } ou source locale
   */
  getProductImageSource: (product: any, placeholderImage: any) => {
    if (!product) {
      console.log('[DEBUG-IMG-SERVICE] Produit null dans getProductImageSource');
      return placeholderImage;
    }
    
    // Identifiant unique pour ce produit
    const cacheKey = `product_source_${product.id}`;
    
    // Vérifier si la source est déjà dans le cache
    if (imageSourceCache[cacheKey]) {
      return imageSourceCache[cacheKey];
    }
    
    try {
      const images = imageService.getProductImages(product);
      
      if (images.length === 0) {
        console.log('[DEBUG-IMG-SERVICE] Aucune image trouvée pour le produit', product.id);
        return placeholderImage;
      }
      
      const imageUrl = imageService.getFullImageUrl(images[0]);
      if (!imageUrl) {
        console.log('[DEBUG-IMG-SERVICE] URL d\'image vide pour le produit', product.id);
        return placeholderImage;
      }
      
      if (totalImageLoads < LOG_THRESHOLD) {
        console.log('[DEBUG-IMG-SERVICE] URL finale de l\'image:', imageUrl);
      }
      
      // Mettre en cache la source d'image
      const source = { uri: imageUrl };
      imageSourceCache[cacheKey] = source;
      
      return source;
    } catch (error) {
      console.error('[DEBUG-IMG-SERVICE] Erreur dans getProductImageSource:', error);
      return placeholderImage;
    }
  },

  /**
   * Créer un FormData pour l'upload d'image
   * @param imageUri - URI de l'image à uploader
   * @param fieldName - Nom du champ pour l'upload
   * @returns FormData prêt pour l'upload
   */
  createImageFormData: (imageUri: string, fieldName: string = 'image'): FormData => {
    // Extraire le nom du fichier de l'URI
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Déterminer le type MIME en fonction de l'extension
    let type = 'image/jpeg'; // Par défaut
    if (fileName.toLowerCase().endsWith('.png')) {
      type = 'image/png';
    } else if (fileName.toLowerCase().endsWith('.gif')) {
      type = 'image/gif';
    }
    
    // Créer le FormData
    const formData = new FormData();
    formData.append(fieldName, {
      uri: imageUri,
      name: fileName || 'image.jpg',
      type: type,
    } as any);
    
    return formData;
  },

  /**
   * Télécharger une image sur le serveur
   * @param imageUri - URI de l'image à télécharger
   * @param token - Token d'authentification
   * @param fieldName - Nom du champ pour l'upload
   * @returns Promesse avec la réponse du serveur
   */
  uploadImage: async (imageUri: string, token: string, fieldName: string = 'image') => {
    try {
      if (!imageUri) {
        throw new Error('Aucune image à télécharger');
      }
      
      const formData = imageService.createImageFormData(imageUri, fieldName);
      
      const response = await axios.post(`${API_URL}/images/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      throw error;
    }
  },
  
  // Méthode pour réinitialiser les compteurs de log pour le débogage
  resetLogCounters: () => {
    logCount = 0;
    totalImageLoads = 0;
  },
  
  // Méthode pour vider le cache d'images
  clearImageCache: () => {
    Object.keys(imageUrlCache).forEach(key => delete imageUrlCache[key]);
    Object.keys(imageSourceCache).forEach(key => delete imageSourceCache[key]);
    console.log('[DEBUG-IMG-SERVICE] Cache d\'images vidé');
    // Réinitialiser les compteurs
    imageService.resetLogCounters();
  }
};

export default imageService; 