const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter la prise en charge des fichiers d'asset supplémentaires
config.resolver.assetExts.push('fbx', 'obj', 'mtl', 'gltf', 'glb', 'bin');
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// S'assurer que les PNG sont bien gérés
if (!config.resolver.assetExts.includes('png')) {
  config.resolver.assetExts.push('png');
}

module.exports = config; 