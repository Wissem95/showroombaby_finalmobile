import axios from 'axios';
import { Alert } from 'react-native';

// URL de l'API
const API_URL = process.env.NODE_ENV === 'development' || __DEV__
  ? 'http://192.168.0.34:8000/api'
  : 'https://api.showroombaby.com';

// Image placeholder - à utiliser avec require dans les composants
const DEFAULT_IMAGE_URL = ''; // Défini à l'extérieur pour éviter des références circulaires

const imageService = {
  /**
   * Traiter une URL d'image pour s'assurer qu'elle est complète
   * @param imagePath - Chemin relatif ou URL complète de l'image
   * @returns URL complète de l'image
   */
  getFullImageUrl: (imagePath: string | null): string => {
    if (!imagePath) {
      console.log('[DEBUG-IMG-SERVICE] URL image vide');
      return '';
    }
    
    console.log('[DEBUG-IMG-SERVICE] Traitement URL image:', imagePath);
    
    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http')) {
      console.log('[DEBUG-IMG-SERVICE] URL déjà complète:', imagePath);
      return imagePath;
    }
    
    // Si c'est un chemin relatif commençant par /storage/
    if (imagePath.startsWith('/storage/')) {
      const fullUrl = `${API_URL.replace('/api', '')}${imagePath}`;
      console.log('[DEBUG-IMG-SERVICE] Chemin /storage/ -> URL complète:', fullUrl);
      return fullUrl;
    }
    
    // Cas spécial pour les chemins commençant par "storage/"
    if (imagePath.startsWith('storage/')) {
      const fullUrl = `${API_URL.replace('/api', '')}/${imagePath}`;
      console.log('[DEBUG-IMG-SERVICE] Chemin storage/ -> URL complète:', fullUrl);
      return fullUrl;
    }
    
    // Autre cas - on ajoute /storage/ au chemin
    const fullUrl = `${API_URL.replace('/api', '')}/storage/${imagePath}`;
    console.log('[DEBUG-IMG-SERVICE] Chemin relatif -> URL complète:', fullUrl);
    return fullUrl;
  },

  /**
   * Extraire les URLs d'images d'un produit sous différents formats
   * @param product - Objet produit contenant des images
   * @returns Tableau d'URLs d'images
   */
  getProductImages: (product: any): string[] => {
    console.log('[DEBUG-IMG-SERVICE] Traitement des images pour produit ID:', product?.id);
    console.log('[DEBUG-IMG-SERVICE] Type d\'images:', typeof product?.images);
    
    if (!product || !product.images) {
      console.log(`[DEBUG-IMG-SERVICE] Produit ${product?.id} sans images, retourne tableau vide`);
      return [];
    }

    try {
      // Si les images sont stockées sous forme de chaîne JSON
      if (typeof product.images === 'string') {
        console.log('[DEBUG-IMG-SERVICE] Format string pour les images:', product.images.substring(0, 100) + (product.images.length > 100 ? '...' : ''));
        try {
          // Tentative de parse JSON
          const parsedImages = JSON.parse(product.images);
          console.log('[DEBUG-IMG-SERVICE] Images JSON parsées:', parsedImages);
          
          if (Array.isArray(parsedImages)) {
            const result = parsedImages.map((img: any) => {
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
            
            console.log('[DEBUG-IMG-SERVICE] Images extraites du tableau JSON:', result);
            return result;
          }
          // Si c'est une chaîne JSON mais pas un tableau (peut-être un objet unique)
          if (typeof parsedImages === 'object' && parsedImages !== null) {
            console.log('[DEBUG-IMG-SERVICE] JSON parsé comme un objet unique');
            if (parsedImages.path) {
              console.log('[DEBUG-IMG-SERVICE] Utilisé le chemin path:', parsedImages.path);
              return [parsedImages.path];
            }
            if (parsedImages.url) {
              console.log('[DEBUG-IMG-SERVICE] Utilisé le chemin url:', parsedImages.url);
              return [parsedImages.url];
            }
          }
          // Si c'est une autre forme de JSON, essayer de l'utiliser comme URL
          console.log('[DEBUG-IMG-SERVICE] Utilisé la chaîne JSON directement comme URL');
          return [product.images];
        } catch (e) {
          // Si ce n'est pas un JSON valide, essayer d'utiliser directement comme une URL
          console.log('[DEBUG-IMG-SERVICE] Échec du parse JSON pour les images:', e);
          if (product.images.includes('.jpg') || 
              product.images.includes('.jpeg') || 
              product.images.includes('.png')) {
            console.log('[DEBUG-IMG-SERVICE] Détection d\'extension image dans la chaîne, utilisation comme URL directe');
            return [product.images];
          }
          console.log('[DEBUG-IMG-SERVICE] Format d\'image non reconnu (chaîne):', product.images);
          return [];
        }
      }

      // Si c'est déjà un tableau
      if (Array.isArray(product.images)) {
        console.log('[DEBUG-IMG-SERVICE] Format tableau pour les images, longueur:', product.images.length);
        
        if (product.images.length === 0) {
          console.log('[DEBUG-IMG-SERVICE] Tableau d\'images vide');
          return [];
        }
        
        const result = product.images.map((img: any) => {
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
        
        console.log('[DEBUG-IMG-SERVICE] Images extraites du tableau:', result);
        return result;
      }

      // Si c'est un objet avec une propriété path ou url
      if (typeof product.images === 'object' && product.images !== null) {
        console.log('[DEBUG-IMG-SERVICE] Format objet pour les images');
        const img = product.images;
        if (img.path) {
          console.log('[DEBUG-IMG-SERVICE] Utilisé le chemin path de l\'objet:', img.path);
          return [img.path];
        }
        if (img.url) {
          console.log('[DEBUG-IMG-SERVICE] Utilisé le chemin url de l\'objet:', img.url);
          return [img.url];
        }
      }

      console.log('[DEBUG-IMG-SERVICE] Format d\'images non reconnu:', product.images);
      return [];
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
    const images = imageService.getProductImages(product);
    
    if (images.length === 0) {
      console.log(`[DEBUG-IMG-SERVICE] Produit ${product?.id} sans images, utilisation du placeholder`);
      return placeholderImage;
    }
    
    // Test avec une URL d'image statique
    if (__DEV__ && product?.id) {
      // Tester avec une image statique connue pour fonctionner
      const testUrl = 'https://via.placeholder.com/400';
      console.log(`[DEBUG-IMG-SERVICE] TEST: Utilisation d'une URL statique pour le produit ${product.id}:`, testUrl);
      
      // Décommenter pour tester avec l'URL statique
      // return { uri: testUrl };
    }
    
    const imageUrl = imageService.getFullImageUrl(images[0]);
    if (!imageUrl) {
      console.log(`[DEBUG-IMG-SERVICE] URL d'image vide après traitement, utilisation du placeholder`);
      return placeholderImage;
    }
    
    console.log(`[DEBUG-IMG-SERVICE] Source d'image finale pour le produit ${product?.id}:`, imageUrl);
    return { uri: imageUrl };
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
      
      // Ajouter des headers spécifiques pour l'upload
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      };
      
      const response = await axios.post(`${API_URL}/upload-image`, formData, config);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      if (error.response) {
        console.error('Réponse d\'erreur:', error.response.data);
      }
      throw error;
    }
  }
};

export default imageService; 