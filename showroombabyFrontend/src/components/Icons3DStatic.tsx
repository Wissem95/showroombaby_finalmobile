import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, G, LinearGradient, Stop, Defs, RadialGradient, Ellipse } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withSpring,
  withDelay,
  Easing,
  withRepeat,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated';

interface Icons3DStaticProps {
  name: 'search' | 'heart' | 'add' | 'chat' | 'person' | 'category';
  color?: string;
  size?: number;
  isActive?: boolean;
  onPress?: () => void;
}

/**
 * Composant d'icônes 3D ultra-réaliste avec effets avancés
 * et animations fluides pour une expérience utilisateur premium
 */
const Icons3DStatic: React.FC<Icons3DStaticProps> = ({
  name,
  color,
  size = 40,
  isActive = false,
  onPress
}) => {
  // Définir la couleur en fonction de l'état actif
  const iconColor = color || (isActive ? '#ff6b9b' : '#888888');
  
  // Couleurs pour les effets d'ombre et de surbrillance 3D avec plus de contraste
  const shadowColor = isActive ? `rgba(${parseInt(iconColor.slice(1, 3), 16)}, ${parseInt(iconColor.slice(3, 5), 16)}, ${parseInt(iconColor.slice(5, 7), 16)}, 0.7)` : 'rgba(136, 136, 136, 0.7)';
  const highlightColor = iconColor; 
  const baseColor = isActive ? `rgba(${parseInt(iconColor.slice(1, 3), 16)}, ${parseInt(iconColor.slice(3, 5), 16)}, ${parseInt(iconColor.slice(5, 7), 16)}, 0.8)` : 'rgba(136, 136, 136, 0.8)';
  const glowColor = isActive ? iconColor : `rgba(${parseInt(iconColor.slice(1, 3), 16)}, ${parseInt(iconColor.slice(3, 5), 16)}, ${parseInt(iconColor.slice(5, 7), 16)}, 0.3)`;
  
  // Valeurs d'animation avancées
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(isActive ? 0.7 : 0.1);
  const elevation = useSharedValue(isActive ? 10 : 5);
  
  // Effet pulsation continue pour les icônes actives
  React.useEffect(() => {
    if (isActive) {
      // Animation initiale plus dramatique
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withTiming(1.1, { duration: 300, easing: Easing.elastic(2) })
      );
      
      // Rotation 3D avec effet de rebond
      rotateY.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-3, { duration: 150 }),
        withTiming(0, { duration: 200, easing: Easing.elastic(2) })
      );
      
      // Légère élévation
      translateY.value = withTiming(-3, { duration: 200 });
      
      // Effet de pulsation continue
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1, // répéter indéfiniment
        true // inverse
      );
      
      elevation.value = withRepeat(
        withSequence(
          withTiming(12, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      // Animation de retour à l'état normal, plus subtile
      cancelAnimation(glowOpacity);
      cancelAnimation(elevation);
      
      scale.value = withTiming(1, { duration: 300 });
      rotateY.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 200 });
      glowOpacity.value = withTiming(0.1, { duration: 300 });
      elevation.value = withTiming(5, { duration: 300 });
    }
    
    // Nettoyage des animations au démontage du composant
    return () => {
      cancelAnimation(scale);
      cancelAnimation(rotateY);
      cancelAnimation(rotateX);
      cancelAnimation(translateY);
      cancelAnimation(glowOpacity);
      cancelAnimation(elevation);
    };
  }, [isActive]);
  
  // Gérer les interactions de toucher - uniquement si onPress est fourni
  const handlePressIn = useCallback(() => {
    // Effet d'enfoncement
    scale.value = withTiming(0.85, { duration: 150 });
    rotateY.value = withTiming(isActive ? 10 : 5, { duration: 150 });
    rotateX.value = withTiming(15, { duration: 150 });
    elevation.value = withTiming(2, { duration: 100 });
  }, [isActive]);
  
  const handlePressOut = useCallback(() => {
    // Effet de rebond exagéré
    scale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(isActive ? 1.1 : 1, { duration: 200, easing: Easing.elastic(2) })
    );
    
    rotateY.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 200, easing: Easing.elastic(2) })
    );
    
    rotateX.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 200, easing: Easing.elastic(2) })
    );
    
    elevation.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(isActive ? 10 : 5, { duration: 200 })
    );
  }, [isActive]);
  
  // Style animé optimisé
  const animatedStyle = useAnimatedStyle(() => {
    // On gère tous les accès aux .value ici
    return {
      transform: [
        { perspective: 800 },
        { scale: scale.value },
        { rotateY: `${rotateY.value}deg` },
        { rotateX: `${rotateX.value}deg` },
        { translateY: translateY.value }
      ],
      // On déplace les styles conditionnels ici pour éviter les accès à .value pendant le rendu
      ...(Platform.OS === 'ios' ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowOpacity.value,
        shadowRadius: elevation.value / 2,
      } : {
        elevation: elevation.value
      }),
    };
  });
  
  // Rendu de l'icône en fonction du nom avec effets 3D améliorés
  const renderIcon = () => {
    const uniqueId = `${name}-${Math.random().toString(36).substring(2, 9)}`;
    
    switch (name) {
      case 'search':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id={`grad-search-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={highlightColor} stopOpacity="1" />
                <Stop offset="50%" stopColor={baseColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={shadowColor} stopOpacity="1" />
              </LinearGradient>
              
              <RadialGradient
                id={`shine-search-${uniqueId}`}
                cx="35%"
                cy="35%"
                rx="60%"
                ry="60%"
                fx="35%"
                fy="35%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <Stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            
            {/* Ombre de base */}
            <Circle cx="48" cy="48" r="30" fill={shadowColor} opacity="0.5" />
            
            {/* Corps principal avec effet de profondeur */}
            <Circle cx="45" cy="45" r="28" fill={shadowColor} />
            <Circle cx="42" cy="42" r="25" fill={`url(#grad-search-${uniqueId})`} />
            <Circle cx="42" cy="42" r="25" fill={`url(#shine-search-${uniqueId})`} />
            
            {/* Barre de recherche avec effet 3D */}
            <Path
              d="M70 73 L58 58"
              stroke={highlightColor}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <Path
              d="M72 75 L60 60"
              stroke={shadowColor}
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.5"
            />
            
            {/* Détails et reflets */}
            <Circle cx="35" cy="35" r="8" fill="#FFFFFF" opacity="0.15" />
            <Circle cx="42" cy="42" r="23" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" fill="none" />
          </Svg>
        );
        
      case 'heart':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id={`grad-heart-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={isActive ? '#ff6b9b' : highlightColor} stopOpacity="1" />
                <Stop offset="50%" stopColor={isActive ? '#ff4081' : baseColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={isActive ? '#e91e63' : shadowColor} stopOpacity="1" />
              </LinearGradient>
              
              <RadialGradient
                id={`shine-heart-${uniqueId}`}
                cx="30%"
                cy="25%"
                rx="65%"
                ry="65%"
                fx="25%"
                fy="15%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
              
              <LinearGradient id={`contour-heart-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={isActive ? '#ff86b0' : 'rgba(255,255,255,0.6)'} stopOpacity="1" />
                <Stop offset="100%" stopColor={isActive ? '#d81b60' : 'rgba(200,200,200,0.6)'} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            
            {/* Ombre douce */}
            <Path
              d="M50 88 C25 70 12 55 8 40 C3 22 15 10 30 15 C40 18 47 25 50 33 C53 25 60 18 70 15 C85 10 97 22 92 40 C88 55 75 70 50 88Z"
              fill="rgba(0,0,0,0.1)"
              translateX="3"
              translateY="3"
            />
            
            {/* Forme principale du cœur avec courbes douces */}
            <Path
              d="M50 85 C25 67 12 52 8 37 C3 19 15 7 30 12 C40 15 47 22 50 30 C53 22 60 15 70 12 C85 7 97 19 92 37 C88 52 75 67 50 85Z"
              fill={`url(#grad-heart-${uniqueId})`}
            />
            
            {/* Reflet lumineux */}
            <Path
              d="M50 85 C25 67 12 52 8 37 C3 19 15 7 30 12 C40 15 47 22 50 30 C53 22 60 15 70 12 C85 7 97 19 92 37 C88 52 75 67 50 85Z"
              fill={`url(#shine-heart-${uniqueId})`}
            />
            
            {/* Contour amélioré */}
            <Path
              d="M50 85 C25 67 12 52 8 37 C3 19 15 7 30 12 C40 15 47 22 50 30 C53 22 60 15 70 12 C85 7 97 19 92 37 C88 52 75 67 50 85Z"
              stroke={`url(#contour-heart-${uniqueId})`}
              strokeWidth="1.5"
              fill="none"
            />
            
            {/* Détails mignons quand actif */}
            {isActive && (
              <>
                {/* Points brillants */}
                <Circle cx="25" cy="23" r="2" fill="#FFFFFF" opacity="0.8" />
                <Circle cx="75" cy="23" r="2" fill="#FFFFFF" opacity="0.8" />
                
                {/* Éclat central */}
                <Path
                  d="M45 40 C48 35 52 35 55 40"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
                
                {/* Petits accents lumineux */}
                <Circle cx="50" cy="55" r="3" fill="#FFFFFF" opacity="0.15" />
                <Circle cx="30" cy="35" r="2" fill="#FFFFFF" opacity="0.2" />
                <Circle cx="70" cy="35" r="2" fill="#FFFFFF" opacity="0.2" />
              </>
            )}
          </Svg>
        );
        
      case 'add':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id={`grad-add-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={highlightColor} stopOpacity="1" />
                <Stop offset="60%" stopColor={baseColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={shadowColor} stopOpacity="1" />
              </LinearGradient>
              
              <RadialGradient
                id={`shine-add-${uniqueId}`}
                cx="30%"
                cy="30%"
                rx="70%"
                ry="70%"
                fx="20%"
                fy="20%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            
            {/* Halo lumineux */}
            <Circle cx="50" cy="50" r="45" fill={glowColor} opacity="0.3" />
            
            {/* Ombre portée */}
            <Circle cx="53" cy="53" r="42" fill={shadowColor} opacity="0.5" />
            
            {/* Corps principal */}
            <Circle cx="50" cy="50" r="40" fill={`url(#grad-add-${uniqueId})`} />
            <Circle cx="50" cy="50" r="40" fill={`url(#shine-add-${uniqueId})`} />
            
            {/* Symbole + avec effet 3D */}
            <Rect x="26" y="45" width="48" height="10" rx="5" fill="#FFFFFF" />
            <Rect x="45" y="26" width="10" height="48" rx="5" fill="#FFFFFF" />
            
            {/* Détails et reflets */}
            <Circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" fill="none" />
            <Circle cx="35" cy="35" r="10" fill="#FFFFFF" opacity="0.1" />
          </Svg>
        );
        
      case 'chat':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id={`grad-chat-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={highlightColor} stopOpacity="1" />
                <Stop offset="60%" stopColor={baseColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={shadowColor} stopOpacity="1" />
              </LinearGradient>
              
              <RadialGradient
                id={`shine-chat-${uniqueId}`}
                cx="30%"
                cy="30%"
                rx="70%"
                ry="70%"
                fx="20%"
                fy="20%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            
            {/* Halo lumineux */}
            <Path
              d="M20 15 L80 15 C88 15 95 22 95 30 L95 65 C95 73 88 80 80 80 L60 80 L50 95 L40 80 L20 80 C12 80 5 73 5 65 L5 30 C5 22 12 15 20 15Z"
              fill={glowColor}
              opacity="0.3"
            />
            
            {/* Ombre portée */}
            <Path
              d="M22 22 L82 22 C87 22 92 27 92 32 L92 62 C92 67 87 72 82 72 L62 72 L52 88 L42 72 L22 72 C17 72 12 67 12 62 L12 32 C12 27 17 22 22 22Z"
              fill={shadowColor}
              opacity="0.5"
            />
            
            {/* Corps principal */}
            <Path
              d="M20 20 L80 20 C85 20 90 25 90 30 L90 60 C90 65 85 70 80 70 L60 70 L50 86 L40 70 L20 70 C15 70 10 65 10 60 L10 30 C10 25 15 20 20 20Z"
              fill={`url(#grad-chat-${uniqueId})`}
            />
            
            {/* Reflet lumineux */}
            <Path
              d="M20 20 L80 20 C85 20 90 25 90 30 L90 60 C90 65 85 70 80 70 L60 70 L50 86 L40 70 L20 70 C15 70 10 65 10 60 L10 30 C10 25 15 20 20 20Z"
              fill={`url(#shine-chat-${uniqueId})`}
            />
            
            {/* Points avec effet 3D */}
            <Circle cx="30" cy="45" r="6" fill="#FFFFFF" />
            <Circle cx="50" cy="45" r="6" fill="#FFFFFF" />
            <Circle cx="70" cy="45" r="6" fill="#FFFFFF" />
            
            {/* Détails supplémentaires */}
            <Path
              d="M20 20 L80 20 C85 20 90 25 90 30 L90 60"
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.4"
              fill="none"
            />
          </Svg>
        );
        
      case 'person':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id={`grad-person-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={highlightColor} stopOpacity="1" />
                <Stop offset="60%" stopColor={baseColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={shadowColor} stopOpacity="1" />
              </LinearGradient>
              
              <RadialGradient
                id={`shine-person-${uniqueId}`}
                cx="30%"
                cy="30%"
                rx="70%"
                ry="70%"
                fx="20%"
                fy="20%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            
            {/* Halo lumineux */}
            <Circle cx="50" cy="33" r="25" fill={glowColor} opacity="0.3" />
            <Path
              d="M25 95 C25 65 75 65 75 95"
              fill={glowColor}
              opacity="0.3"
            />
            
            {/* Ombres portées */}
            <Circle cx="52" cy="35" r="22" fill={shadowColor} opacity="0.5" />
            <Path
              d="M27 90 C27 65 77 65 77 90"
              fill={shadowColor}
              opacity="0.5"
            />
            
            {/* Corps principal */}
            <Circle cx="50" cy="33" r="20" fill={`url(#grad-person-${uniqueId})`} />
            <Circle cx="50" cy="33" r="20" fill={`url(#shine-person-${uniqueId})`} />
            
            <Path
              d="M25 88 C25 63 75 63 75 88"
              fill={`url(#grad-person-${uniqueId})`}
            />
            <Path
              d="M25 88 C25 63 75 63 75 88"
              fill={`url(#shine-person-${uniqueId})`}
            />
            
            {/* Détails et reflets */}
            <Circle cx="50" cy="33" r="18" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" fill="none" />
            <Circle cx="45" cy="28" r="5" fill="#FFFFFF" opacity="0.15" />
            
            <Path
              d="M30 70 C35 65 65 65 70 70"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              opacity="0.4"
              fill="none"
            />
          </Svg>
        );
        
      case 'category':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id={`grad-cat1-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={highlightColor} stopOpacity="1" />
                <Stop offset="60%" stopColor={baseColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={shadowColor} stopOpacity="1" />
              </LinearGradient>
              
              <LinearGradient id={`grad-cat2-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={highlightColor} stopOpacity="1" />
                <Stop offset="60%" stopColor={baseColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={shadowColor} stopOpacity="1" />
              </LinearGradient>
              
              <RadialGradient
                id={`shine-cat-${uniqueId}`}
                cx="30%"
                cy="30%"
                rx="70%"
                ry="70%"
                fx="20%"
                fy="20%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            
            {/* Halos lumineux */}
            <Rect x="15" y="15" width="30" height="30" rx="6" fill={glowColor} opacity="0.3" />
            <Rect x="55" y="15" width="30" height="30" rx="6" fill={glowColor} opacity="0.3" />
            <Rect x="15" y="55" width="30" height="30" rx="6" fill={glowColor} opacity="0.3" />
            <Rect x="55" y="55" width="30" height="30" rx="6" fill={glowColor} opacity="0.3" />
            
            {/* Ombres portées */}
            <Rect x="22" y="22" width="26" height="26" rx="5" fill={shadowColor} opacity="0.5" />
            <Rect x="57" y="22" width="26" height="26" rx="5" fill={shadowColor} opacity="0.5" />
            <Rect x="22" y="57" width="26" height="26" rx="5" fill={shadowColor} opacity="0.5" />
            <Rect x="57" y="57" width="26" height="26" rx="5" fill={shadowColor} opacity="0.5" />
            
            {/* Corps principaux avec variations de gradient */}
            <Rect x="20" y="20" width="25" height="25" rx="5" fill={`url(#grad-cat1-${uniqueId})`} />
            <Rect x="20" y="20" width="25" height="25" rx="5" fill={`url(#shine-cat-${uniqueId})`} />
            
            <Rect x="55" y="20" width="25" height="25" rx="5" fill={`url(#grad-cat2-${uniqueId})`} />
            <Rect x="55" y="20" width="25" height="25" rx="5" fill={`url(#shine-cat-${uniqueId})`} />
            
            <Rect x="20" y="55" width="25" height="25" rx="5" fill={`url(#grad-cat1-${uniqueId})`} />
            <Rect x="20" y="55" width="25" height="25" rx="5" fill={`url(#shine-cat-${uniqueId})`} />
            
            <Rect x="55" y="55" width="25" height="25" rx="5" fill={`url(#grad-cat2-${uniqueId})`} />
            <Rect x="55" y="55" width="25" height="25" rx="5" fill={`url(#shine-cat-${uniqueId})`} />
            
            {/* Détails et reflets */}
            <Rect x="20" y="20" width="25" height="25" rx="5" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" fill="none" />
            <Rect x="55" y="20" width="25" height="25" rx="5" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" fill="none" />
            <Rect x="20" y="55" width="25" height="25" rx="5" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" fill="none" />
            <Rect x="55" y="55" width="25" height="25" rx="5" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" fill="none" />
            
            <Circle cx="28" cy="28" r="5" fill="#FFFFFF" opacity="0.15" />
            <Circle cx="63" cy="28" r="5" fill="#FFFFFF" opacity="0.15" />
            <Circle cx="28" cy="63" r="5" fill="#FFFFFF" opacity="0.15" />
            <Circle cx="63" cy="63" r="5" fill="#FFFFFF" opacity="0.15" />
          </Svg>
        );
        
      default:
        return null;
    }
  };
  
  // Version non-interactive - l'icône est juste un affichage, le parent gère le toucher
  return (
    <View style={styles.outerContainer}>
      {/* Effet de halo lumineux sous l'icône */}
      {isActive && (
        <View style={[styles.glow, { backgroundColor: glowColor }]} />
      )}
      
      {/* Container animé avec l'icône */}
      <Animated.View style={[
        styles.iconContainer, 
        animatedStyle
      ]}>
        {renderIcon()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    // Container externe sans overflow hidden
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  glow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.2,
    zIndex: 0,
    transform: [{ scale: 1.2 }],
  },
});

export default Icons3DStatic; 