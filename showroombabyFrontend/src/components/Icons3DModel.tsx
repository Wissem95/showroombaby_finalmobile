import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  cancelAnimation,
  Easing
} from 'react-native-reanimated';

// Importation des assets 3D en PNG
const personIcon = require('../../assets/icons/3dicons-boy-front-clay.png');
const heartIcon = require('../../assets/icons/3dicons-heart-front-clay.png');
const chatIcon = require('../../assets/icons/3dicons-chat-text-front-clay.png');
const searchIcon = require('../../assets/icons/3dicons-zoom-front-clay.png');
const addIcon = require('../../assets/icons/3dicons-plus-front-clay.png');
const callIcon = require('../../assets/icons/3dicons-call-only-front-clay.png');

interface Icons3DModelProps {
  name: 'person' | 'heart' | 'chat' | 'search' | 'call' | 'add';
  color?: string;
  size?: number;
  isActive?: boolean;
  onPress?: () => void;
}

const Icons3DModel: React.FC<Icons3DModelProps> = ({
  name,
  color = '#888888',
  size = 40,
  isActive = false,
  onPress
}) => {
  // Animation
  const scale = useSharedValue(1);
  const glow = useSharedValue(isActive ? 0.5 : 0);
  
  useEffect(() => {
    // Animation selon l'état actif
    if (isActive) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1.1, { duration: 300 })
      );
      glow.value = withTiming(0.8, { duration: 300 });
    } else {
      scale.value = withTiming(1, { duration: 300 });
      glow.value = withTiming(0, { duration: 300 });
    }
    
    // Nettoyage
    return () => {
      cancelAnimation(scale);
      cancelAnimation(glow);
    };
  }, [isActive]);

  // Déterminer quelle icône charger
  const getIconSource = () => {
    switch (name) {
      case 'person':
        return personIcon;
      case 'heart':
        return heartIcon;
      case 'chat':
        return chatIcon;
      case 'search':
        return searchIcon;
      case 'add':
        return addIcon;
      case 'call':
        return callIcon;
      default:
        return personIcon;
    }
  };

  // Style animé
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      ...(Platform.OS === 'ios' ? {
        shadowOpacity: glow.value,
        shadowRadius: 8,
      } : {
        elevation: glow.value * 10,
      }),
    };
  });

  return (
    <View style={styles.outerContainer}>
      {isActive && (
        <View style={[styles.glow, { backgroundColor: '#ff6b9b' }]} />
      )}
      <Animated.View style={[
        styles.container, 
        animatedContainerStyle,
        name === 'add' && { backgroundColor: 'transparent' }
      ]}>
        <Image 
          source={getIconSource()} 
          style={{ 
            width: size, 
            height: size,
            // Ne pas appliquer de tintColor pour préserver les effets 3D des PNG
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'transparent',
    shadowColor: '#ff6b9b',
    shadowOffset: { width: 0, height: 0 },
  },
  glow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.2,
    zIndex: 0,
  },
});

export default Icons3DModel; 