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
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    } else {
      return `${API_URL.replace('/api', '')}/storage/${imagePath}`;
    }
  },

  /**
   * Extraire les URLs d'images d'un produit sous différents formats
   * @param product - Objet produit contenant des images
   * @returns Tableau d'URLs d'images
   */
  getProductImages: (product: any): string[] => {
    if (!product || !product.images) {
      console.log(`Produit ${product?.id} sans images, retourne tableau vide`);
      return [];
    }

    try {
      // Si les images sont stockées sous forme de chaîne JSON
      if (typeof product.images === 'string') {
        try {
          // Tentative de parse JSON
          const parsedImages = JSON.parse(product.images);
          if (Array.isArray(parsedImages)) {
            return parsedImages.map((img: any) => {
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
          if (typeof parsedImages === 'object' && parsedImages !== null) {
            if (parsedImages.path) {
              return [parsedImages.path];
            }
            if (parsedImages.url) {
              return [parsedImages.url];
            }
          }
          // Si c'est une autre forme de JSON, essayer de l'utiliser comme URL
          return [product.images];
        } catch (e) {
          // Si ce n'est pas un JSON valide, essayer d'utiliser directement comme une URL
          if (product.images.includes('.jpg') || 
              product.images.includes('.jpeg') || 
              product.images.includes('.png')) {
            return [product.images];
          }
          console.log('Format d\'image non reconnu (chaîne):', product.images);
          return [];
        }
      }

      // Si c'est déjà un tableau
      if (Array.isArray(product.images)) {
        if (product.images.length === 0) {
          return [];
        }
        
        return product.images.map((img: any) => {
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
      if (typeof product.images === 'object' && product.images !== null) {
        const img = product.images;
        if (img.path) {
          return [img.path];
        }
        if (img.url) {
          return [img.url];
        }
      }

      console.log('Format d\'images non reconnu:', product.images);
      return [];
    } catch (error) {
      console.error('Erreur lors du traitement des images:', error);
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
      console.log(`Produit ${product?.id} sans images, utilisation du placeholder`);
      return placeholderImage;
    }
    
    const imageUrl = imageService.getFullImageUrl(images[0]);
    if (!imageUrl) {
      return placeholderImage;
    }
    
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