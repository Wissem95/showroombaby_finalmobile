const fs = require('fs');
const path = require('path');

// 🎨 MAPPING DES COULEURS À REMPLACER
const colorMappings = {
  // ========== COULEURS RGBA ==========
  'rgba(0,0,0,0.8)': 'colors.OVERLAY_HEAVY',
  'rgba(0,0,0,0.5)': 'colors.OVERLAY_DARK',
  'rgba(0,0,0,0.3)': 'colors.OVERLAY_LIGHT',
  'rgba(0,0,0,0.2)': 'colors.SHADOW_MEDIUM',
  'rgba(0,0,0,0.1)': 'colors.SHADOW_LIGHT',
  'rgba(0, 0, 0, 0.8)': 'colors.OVERLAY_HEAVY',
  'rgba(0, 0, 0, 0.5)': 'colors.OVERLAY_DARK',
  'rgba(0, 0, 0, 0.3)': 'colors.OVERLAY_LIGHT',
  'rgba(0, 0, 0, 0.2)': 'colors.SHADOW_MEDIUM',
  'rgba(0, 0, 0, 0.1)': 'colors.SHADOW_LIGHT',
  'rgba(0, 0, 0, 0.05)': 'colors.SHADOW_LIGHT',
  'rgba(0, 0, 0, 0.4)': 'colors.SHADOW_TEXT_LIGHT',
  
  // Backgrounds blancs avec transparence
  'rgba(255,255,255,0.9)': 'colors.WHITE_TRANSPARENT_HEAVY',
  'rgba(255,255,255,0.8)': 'colors.WHITE_TRANSPARENT_HEAVY',
  'rgba(255,255,255,0.7)': 'colors.WHITE_TRANSPARENT_MEDIUM',
  'rgba(255,255,255,0.6)': 'colors.WHITE_TRANSPARENT_LIGHT',
  'rgba(255,255,255,0.4)': 'colors.WHITE_TRANSPARENT_LIGHT',
  'rgba(255,255,255,0.3)': 'colors.WHITE_TRANSPARENT_LIGHT',
  'rgba(255,255,255,0.2)': 'colors.WHITE_TRANSPARENT_LIGHT',
  'rgba(255, 255, 255, 0.9)': 'colors.WHITE_TRANSPARENT_HEAVY',
  'rgba(255, 255, 255, 0.8)': 'colors.WHITE_TRANSPARENT_HEAVY',
  'rgba(255, 255, 255, 0.7)': 'colors.WHITE_TRANSPARENT_MEDIUM',
  'rgba(255, 255, 255, 0.6)': 'colors.WHITE_TRANSPARENT_LIGHT',
  'rgba(255, 255, 255, 0.4)': 'colors.WHITE_TRANSPARENT_LIGHT',
  'rgba(255, 255, 255, 0.3)': 'colors.WHITE_TRANSPARENT_LIGHT',
  'rgba(255, 255, 255, 0.2)': 'colors.WHITE_TRANSPARENT_LIGHT',
  
  // Primary avec transparence
  'rgba(255,107,155,0.8)': 'colors.PRIMARY_TRANSPARENT_HEAVY',
  'rgba(255,107,155,0.2)': 'colors.PRIMARY_TRANSPARENT_MEDIUM',
  'rgba(255,107,155,0.15)': 'colors.PRIMARY_TRANSPARENT_LIGHT',
  'rgba(255,107,155,0.1)': 'colors.PRIMARY_TRANSPARENT_LIGHT',
  'rgba(255, 107, 155, 0.8)': 'colors.PRIMARY_TRANSPARENT_HEAVY',
  'rgba(255, 107, 155, 0.2)': 'colors.PRIMARY_TRANSPARENT_MEDIUM',
  'rgba(255, 107, 155, 0.1)': 'colors.PRIMARY_TRANSPARENT_LIGHT',
  
  // Textes avec transparence
  'rgba(85,85,85,0.8)': 'colors.TEXT_TRANSPARENT_MEDIUM',
  'rgba(85,85,85,0.6)': 'colors.TEXT_TRANSPARENT_LIGHT',
  'rgba(85, 85, 85, 0.8)': 'colors.TEXT_TRANSPARENT_MEDIUM',
  'rgba(85, 85, 85, 0.6)': 'colors.TEXT_TRANSPARENT_LIGHT',
  
  // Couleurs spécifiques
  'rgba(231,90,140,0.7)': 'colors.PRIMARY_DARK + "B3"', // Ajout alpha hex
  'rgba(231,90,140,0.9)': 'colors.PRIMARY_DARK + "E6"',
  'rgba(231, 84, 128, 0.85)': 'colors.PRIMARY_DARK + "D9"',
  'rgba(244, 245, 255, 0.5)': 'colors.INFO + "80"',
  'rgba(107, 60, 233, 0.75)': 'colors.INFO + "BF"',
  'rgba(107, 60, 233, 0.85)': 'colors.INFO + "D9"',
  'rgba(107, 60, 233, 0.12)': 'colors.INFO + "1F"',
  'rgba(107, 60, 233, 0.1)': 'colors.INFO + "1A"',
  'rgba(107, 60, 233, 0.07)': 'colors.INFO + "12"',
  
  // ========== COULEURS HEXADÉCIMALES ==========
  // Couleurs principales
  '#ff6b9b': 'colors.PRIMARY',
  '#ffb3cb': 'colors.PRIMARY_LIGHT',
  '#e75480': 'colors.PRIMARY_DARK',
  '#ff3b7b': 'colors.PRIMARY_SHADOW',
  '#E75A7C': 'colors.PRIMARY_DARK',
  
  // Backgrounds
  '#fff': 'colors.BACKGROUND_MAIN',
  '#ffffff': 'colors.BACKGROUND_MAIN',
  '#f8f9fa': 'colors.BACKGROUND_SECONDARY',
  '#fafafa': 'colors.BACKGROUND_LIGHT',
  '#f5f5f5': 'colors.BACKGROUND_GRAY',
  
  // Textes
  '#333': 'colors.TEXT_PRIMARY',
  '#666': 'colors.TEXT_SECONDARY',
  '#777': 'colors.TEXT_LIGHT',
  '#999': 'colors.TEXT_MUTED',
  '#000': 'colors.TEXT_DARK',
  '#555': 'colors.GRAY_DARK',
  '#888': 'colors.GRAY_MEDIUM',
  '#aaa': 'colors.ICON_DARK',
  '#bbb': 'colors.ICON_LIGHT',
  '#ccc': 'colors.GRAY_LIGHT',
  
  // Bordures
  '#f0f0f0': 'colors.BORDER_LIGHT',
  '#e0e0e0': 'colors.BORDER_MEDIUM',
  '#ddd': 'colors.BORDER_DARK',
  '#ececec': 'colors.BORDER_MEDIUM',
  '#eee': 'colors.GRAY_BACKGROUND',
  
  // Couleurs système
  '#4CAF50': 'colors.SUCCESS',
  '#e74c3c': 'colors.ERROR',
  '#ff4444': 'colors.ERROR_LIGHT',
  '#FF5252': 'colors.BORDER_ERROR',
  '#ff3b30': 'colors.WARNING',
  '#6B3CE9': 'colors.INFO',
  '#6200ee': 'colors.INFO',
  
  // Couleurs spécifiques à nettoyer
  '#3e4652': 'colors.TEXT_PRIMARY',
  '#ffcce0': 'colors.PRIMARY_TRANSPARENT_LIGHT',
  '#e0f7ff': 'colors.INFO + "20"',
};

// 🔧 FONCTION POUR NETTOYER UN FICHIER
function cleanupColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Remplacer toutes les couleurs
    Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
      const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldColor)) {
        content = content.replace(regex, newColor);
        hasChanges = true;
        console.log(`✅ ${path.basename(filePath)}: ${oldColor} → ${newColor}`);
      }
    });
    
    // Sauvegarder si des changements ont été faits
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`🎨 ${path.basename(filePath)} nettoyé avec succès!`);
    } else {
      console.log(`✨ ${path.basename(filePath)} déjà propre!`);
    }
    
    return hasChanges;
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de ${filePath}:`, error.message);
    return false;
  }
}

// 🎯 FONCTION PRINCIPALE
function cleanupAllScreens() {
  const screensDir = path.join(__dirname, 'src', 'screens');
  
  if (!fs.existsSync(screensDir)) {
    console.error('❌ Dossier screens non trouvé:', screensDir);
    return;
  }
  
  const files = fs.readdirSync(screensDir)
    .filter(file => file.endsWith('.tsx'))
    .map(file => path.join(screensDir, file));
  
  console.log('🚀 Début du nettoyage des couleurs...\n');
  
  let totalChanges = 0;
  files.forEach(file => {
    console.log(`\n📁 Traitement: ${path.basename(file)}`);
    if (cleanupColorsInFile(file)) {
      totalChanges++;
    }
  });
  
  console.log(`\n🎉 Nettoyage terminé!`);
  console.log(`📊 ${totalChanges}/${files.length} fichiers modifiés`);
  console.log(`\n💡 N'oubliez pas de vérifier que tous les imports incluent:`);
  console.log(`   import { globalStyles, colors } from '../theme/globalStyles';`);
}

// 🚀 EXÉCUTION
if (require.main === module) {
  cleanupAllScreens();
}

module.exports = { cleanupColorsInFile, cleanupAllScreens }; 