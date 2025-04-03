import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ImageSourcePropType } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence 
} from 'react-native-reanimated';

// Images des icônes 3D (à remplacer par vos propres icônes 3D)
const ICONS_3D = {
  search: require('../../assets/icons3d/search.png'),
  heart: require('../../assets/icons3d/heart.png'),
  add: require('../../assets/icons3d/add.png'),
  chat: require('../../assets/icons3d/chat.png'),
  person: require('../../assets/icons3d/person.png'),
  category: require('../../assets/icons3d/category.png'),
  // Ajoutez d'autres icônes selon vos besoins
};

interface Icon3DProps {
  type: keyof typeof ICONS_3D;
  size?: number;
  isActive?: boolean;
  onPress?: () => void;
  badgeCount?: number;
}

/**
 * Composant d'icône 3D utilisant des images pré-rendues
 * avec effets d'animation au toucher
 */
const Icon3D: React.FC<Icon3DProps> = ({
  type,
  size = 40,
  isActive = false,
  onPress,
  badgeCount
}) => {
  // Valeurs d'animation
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  
  // Style animé pour l'icône
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotateY: `${rotate.value}deg` }
      ]
    };
  });
  
  // Animation au toucher
  const handlePress = () => {
    // Animation d'échelle
    scale.value = withSequence(
      withTiming(0.85, { duration: 150 }),
      withSpring(1.1, { damping: 10 }),
      withTiming(1, { duration: 200 })
    );
    
    // Animation de rotation pour un effet 3D
    rotate.value = withSequence(
      withTiming(15, { duration: 100 }),
      withTiming(-15, { duration: 200 }),
      withTiming(0, { duration: 150 })
    );
    
    // Appeler la fonction onPress
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Image 
          source={ICONS_3D[type]} 
          style={[
            styles.icon, 
            { 
              width: size, 
              height: size, 
              opacity: isActive ? 1 : 0.8 
            }
          ]}
          resizeMode="contain"
        />
        
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <Animated.Text style={styles.badgeText}>
              {badgeCount}
            </Animated.Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
  },
  iconContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    width: 40,
    height: 40,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b9b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default Icon3D; 