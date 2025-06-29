import { StyleSheet } from 'react-native';
import theme from './index';

// 🎨 SYSTÈME DE COULEURS COMPLET - CENTRALISÉ
export const colors = {
  // ========== COULEURS PRINCIPALES ==========
  PRIMARY: '#ff6b9b',
  PRIMARY_LIGHT: '#ffb3cb',
  PRIMARY_DARK: '#e75480',
  PRIMARY_SHADOW: '#ff3b7b',
  
  // ========== BACKGROUNDS ==========
  BACKGROUND_MAIN: '#fff',
  BACKGROUND_SECONDARY: '#f8f9fa',
  BACKGROUND_LIGHT: '#fafafa',
  BACKGROUND_GRAY: '#f5f5f5',
  BACKGROUND_CARD: '#ffffff',
  
  // ========== TEXTES ==========
  TEXT_PRIMARY: '#333',
  TEXT_SECONDARY: '#666',
  TEXT_LIGHT: '#777',
  TEXT_MUTED: '#999',
  TEXT_DARK: '#000',
  TEXT_WHITE: '#fff',
  
  // ========== BORDURES ==========
  BORDER_LIGHT: '#f0f0f0',
  BORDER_MEDIUM: '#e0e0e0',
  BORDER_DARK: '#ddd',
  BORDER_ERROR: '#FF5252',
  
  // ========== COULEURS SYSTÈME ==========
  SUCCESS: '#4CAF50',
  ERROR: '#e74c3c',
  ERROR_LIGHT: '#ff4444',
  WARNING: '#ff3b30',
  INFO: '#6B3CE9',
  
  // ========== COULEURS AVEC TRANSPARENCE (RGBA) ==========
  // Overlays et modales
  OVERLAY_DARK: 'rgba(0,0,0,0.5)',
  OVERLAY_LIGHT: 'rgba(0,0,0,0.3)',
  OVERLAY_HEAVY: 'rgba(0,0,0,0.8)',
  
  // Backgrounds avec transparence
  WHITE_TRANSPARENT_LIGHT: 'rgba(255,255,255,0.6)',
  WHITE_TRANSPARENT_MEDIUM: 'rgba(255,255,255,0.7)',
  WHITE_TRANSPARENT_HEAVY: 'rgba(255,255,255,0.9)',
  
  // Primary avec transparence
  PRIMARY_TRANSPARENT_LIGHT: 'rgba(255,107,155,0.1)',
  PRIMARY_TRANSPARENT_MEDIUM: 'rgba(255,107,155,0.2)',
  PRIMARY_TRANSPARENT_HEAVY: 'rgba(255,107,155,0.8)',
  
  // Textes avec transparence
  TEXT_TRANSPARENT_LIGHT: 'rgba(85,85,85,0.6)',
  TEXT_TRANSPARENT_MEDIUM: 'rgba(85,85,85,0.8)',
  
  // Shadows avec transparence
  SHADOW_LIGHT: 'rgba(0,0,0,0.1)',
  SHADOW_MEDIUM: 'rgba(0,0,0,0.2)',
  SHADOW_TEXT: 'rgba(0,0,0,0.3)',
  SHADOW_TEXT_LIGHT: 'rgba(0,0,0,0.4)',
  
  // Couleurs spécifiques
  GRAY_LIGHT: '#ccc',
  GRAY_MEDIUM: '#888',
  GRAY_DARK: '#555',
  GRAY_BACKGROUND: '#eee',
  
  // Couleurs d'icônes
  ICON_LIGHT: '#bbb',
  ICON_MEDIUM: '#777',
  ICON_DARK: '#aaa',
};

// 🎨 Styles globaux centralisés pour éliminer les duplications
export const globalStyles = StyleSheet.create({
  // ========== CONTAINERS ==========
  // Container principal flex (utilisé 80+ fois dans l'app)
  flexContainer: {
    flex: 1,
  },
  
  // Container avec background principal
  mainContainer: {
    flex: 1,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  
  // Container de contenu avec padding standard
  contentContainer: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  
  // ========== CARDS & SECTIONS ==========
  // Card standard (remplace 50+ duplications)
  standardCard: {
    backgroundColor: colors.BACKGROUND_CARD,
    borderRadius: theme.borderRadii.m,
    padding: theme.spacing.m,
    shadowColor: colors.SHADOW_LIGHT,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Section avec title
  section: {
    backgroundColor: colors.BACKGROUND_CARD,
    borderRadius: 20,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: theme.spacing.m,
    elevation: 2,
    shadowColor: colors.SHADOW_LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // ========== HEADERS ==========
  // Header standard avec shadow
  standardHeader: {
    backgroundColor: colors.BACKGROUND_CARD,
    borderBottomWidth: 1,
    borderBottomColor: colors.BORDER_LIGHT,
    elevation: 2,
    shadowColor: colors.SHADOW_LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // ========== BUTTONS ==========
  // Bouton primaire (remplace les variations de #ff6b9b)
  primaryButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  // Bouton secondaire avec bordure
  secondaryButton: {
    borderColor: colors.PRIMARY,
    borderWidth: 1.5,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  // ========== SEARCH BARS ==========
  // Barre de recherche standard
  searchContainer: {
    backgroundColor: colors.WHITE_TRANSPARENT_HEAVY,
    borderRadius: 25,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    marginHorizontal: theme.spacing.m,
    elevation: 3,
    shadowColor: colors.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  // ========== LOADING & ERROR STATES ==========
  // Container de chargement centralisé
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  
  // Container d'erreur centralisé
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  
  // Container vide centralisé
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  
  // ========== IMAGES ==========
  // Container d'image standard
  imageContainer: {
    backgroundColor: colors.BACKGROUND_GRAY,
    borderRadius: theme.borderRadii.s,
    overflow: 'hidden',
  },
  
  // Placeholder d'image
  imagePlaceholder: {
    backgroundColor: colors.BACKGROUND_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // ========== TEXT STYLES ==========
  // Titre principal
  mainTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: theme.spacing.s,
  },
  
  // Titre de section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: theme.spacing.s,
  },
  
  // Prix principal
  priceText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.PRIMARY,
  },
  
  // Texte de description
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.TEXT_SECONDARY,
  },
  
  // ========== SHADOWS STANDARDISÉES ==========
  // Shadow légère (elevation 2)
  lightShadow: {
    elevation: 2,
    shadowColor: colors.SHADOW_LIGHT,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  // Shadow medium (elevation 4)
  mediumShadow: {
    elevation: 4,
    shadowColor: colors.SHADOW_LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  
  // Shadow forte (elevation 8)
  strongShadow: {
    elevation: 8,
    shadowColor: colors.SHADOW_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  
  // ========== MODALES ==========
  // Overlay de modale
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.OVERLAY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  // Contenu de modale
  modalContent: {
    backgroundColor: colors.BACKGROUND_MAIN,
    borderRadius: 12,
    padding: theme.spacing.l,
    margin: theme.spacing.l,
    maxHeight: '80%',
  },
  
  // ========== SPACING HELPERS ==========
  // Marges standardisées
  marginS: { margin: theme.spacing.s },
  marginM: { margin: theme.spacing.m },
  marginL: { margin: theme.spacing.l },
  
  // Padding standardisé
  paddingS: { padding: theme.spacing.s },
  paddingM: { padding: theme.spacing.m },
  paddingL: { padding: theme.spacing.l },
  
});

// 🎨 Constantes de spacing (évite les valeurs magiques)
export const spacing = {
  TINY: 4,
  SMALL: 8,
  MEDIUM: 16,
  LARGE: 24,
  XLARGE: 40,
  XXLARGE: 48,
};

// 🎨 Constantes de border radius
export const borderRadius = {
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 20,
  XLARGE: 25,
  ROUND: 50,
};

export default globalStyles; 