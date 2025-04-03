// Ce script aide à générer des icônes 3D temporaires pour le développement
// Il utilise React Native SVG pour créer des images avec un effet 3D
// Dans un environnement de production, ces icônes seraient remplacées par de vraies images 3D

import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

// Composants d'icônes 3D
const Icons3D = {
  search: ({ color = '#4A90E2', size = 200 }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={color} stopOpacity="1" />
      </LinearGradient>
      <Circle cx="45" cy="45" r="25" fill="url(#grad)" />
      <Circle cx="45" cy="45" r="20" fill="#FFFFFF" opacity="0.2" />
      <Path
        d="M75 75 L60 60"
        stroke="url(#grad)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <Circle cx="45" cy="45" r="25" stroke="#FFFFFF" strokeWidth="2" fill="none" />
    </Svg>
  ),
  
  heart: ({ color = '#FF6B9B', size = 200 }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={color} stopOpacity="1" />
      </LinearGradient>
      <G>
        <Path
          d="M50 80 C80 55 95 40 95 25 C95 10 80 5 70 15 C65 20 55 35 50 40 C45 35 35 20 30 15 C20 5 5 10 5 25 C5 40 20 55 50 80Z"
          fill="url(#grad)"
        />
        <Path
          d="M50 75 C75 55 85 40 85 30 C85 20 75 15 65 25 C60 30 55 40 50 45 C45 40 40 30 35 25 C25 15 15 20 15 30 C15 40 25 55 50 75Z"
          fill="#FFFFFF"
          opacity="0.3"
        />
      </G>
    </Svg>
  ),
  
  add: ({ color = '#4CD964', size = 200 }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={color} stopOpacity="1" />
      </LinearGradient>
      <Circle cx="50" cy="50" r="40" fill="url(#grad)" />
      <Circle cx="50" cy="50" r="35" fill="#FFFFFF" opacity="0.2" />
      <Rect x="30" y="45" width="40" height="10" rx="5" fill="#FFFFFF" />
      <Rect x="45" y="30" width="10" height="40" rx="5" fill="#FFFFFF" />
    </Svg>
  ),
  
  chat: ({ color = '#4A90E2', size = 200 }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={color} stopOpacity="1" />
      </LinearGradient>
      <Path
        d="M20 20 L80 20 C85 20 90 25 90 30 L90 60 C90 65 85 70 80 70 L60 70 L50 85 L40 70 L20 70 C15 70 10 65 10 60 L10 30 C10 25 15 20 20 20Z"
        fill="url(#grad)"
      />
      <Path
        d="M25 25 L75 25 C80 25 85 30 85 35 L85 55 C85 60 80 65 75 65 L55 65 L50 75 L45 65 L25 65 C20 65 15 60 15 55 L15 35 C15 30 20 25 25 25Z"
        fill="#FFFFFF"
        opacity="0.2"
      />
      <Circle cx="30" cy="45" r="5" fill="#FFFFFF" />
      <Circle cx="50" cy="45" r="5" fill="#FFFFFF" />
      <Circle cx="70" cy="45" r="5" fill="#FFFFFF" />
    </Svg>
  ),
  
  person: ({ color = '#FF9500', size = 200 }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={color} stopOpacity="1" />
      </LinearGradient>
      <Circle cx="50" cy="35" r="20" fill="url(#grad)" />
      <Path
        d="M25 85 C25 65 75 65 75 85"
        fill="url(#grad)"
      />
      <Path
        d="M30 80 C30 67 70 67 70 80"
        fill="#FFFFFF"
        opacity="0.2"
      />
      <Circle cx="50" cy="35" r="15" fill="#FFFFFF" opacity="0.2" />
    </Svg>
  ),
  
  category: ({ color = '#AF52DE', size = 200 }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={color} stopOpacity="1" />
      </LinearGradient>
      <G>
        <Rect x="20" y="20" width="25" height="25" rx="5" fill="url(#grad)" />
        <Rect x="55" y="20" width="25" height="25" rx="5" fill="url(#grad)" />
        <Rect x="20" y="55" width="25" height="25" rx="5" fill="url(#grad)" />
        <Rect x="55" y="55" width="25" height="25" rx="5" fill="url(#grad)" />
        
        <Rect x="25" y="25" width="15" height="15" rx="2" fill="#FFFFFF" opacity="0.2" />
        <Rect x="60" y="25" width="15" height="15" rx="2" fill="#FFFFFF" opacity="0.2" />
        <Rect x="25" y="60" width="15" height="15" rx="2" fill="#FFFFFF" opacity="0.2" />
        <Rect x="60" y="60" width="15" height="15" rx="2" fill="#FFFFFF" opacity="0.2" />
      </G>
    </Svg>
  ),
};

// Fonction pour générer et sauvegarder les icônes
export const generateIcons = async () => {
  try {
    // Créer le répertoire si nécessaire
    const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'icons3d');
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'icons3d');
    }
    
    // Générer chaque icône
    for (const [name, IconComponent] of Object.entries(Icons3D)) {
      const ref = React.createRef();
      
      // Capturer l'icône en PNG
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
      });
      
      // Sauvegarder l'icône
      await FileSystem.moveAsync({
        from: uri,
        to: FileSystem.documentDirectory + `icons3d/${name}.png`
      });
      
      console.log(`Icône ${name} générée avec succès`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération des icônes:', error);
    return false;
  }
};

export default Icons3D; 