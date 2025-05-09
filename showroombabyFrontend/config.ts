export const API_URL = 'http://192.168.1.68:8000';

// Configuration par environnement
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_PROD = process.env.NODE_ENV === 'production';

// Constantes pour l'upload d'images
export const MAX_IMAGES_PER_PRODUCT = 5;
export const IMAGE_QUALITY = 0.8;

// Configuration des timeouts
export const API_TIMEOUT = 15000; // 15 secondes
