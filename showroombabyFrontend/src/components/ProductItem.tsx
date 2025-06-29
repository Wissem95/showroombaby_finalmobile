import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SERVER_IP } from '../config/ip';
import imageService from '../services/api/imageService';
import { globalStyles, colors } from '../theme/globalStyles';

// Image placeholder
const placeholderImage = require('../../assets/placeholder.png');

// API URL
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? `http://${SERVER_IP}:8000/api`  // Adresse IP locale chargée depuis la configuration avec préfixe /api
  : 'https://api.showroombaby.com/api';  // URL de production

// Largeur de l'écran
const { width } = Dimensions.get('window');

interface ProductItemProps {
  item: {
    id: number;
    title: string;
    price: number;
    condition?: string;
    images?: string | string[] | { path: string; url?: string }[] | any[] | null;
    city?: string;
    created_at: string;
    user_type?: string;
    user?: {
      id: number;
      name?: string;
      is_professional?: boolean;
    };
  };
  navigation: any;
}

const ProductItem: React.FC<ProductItemProps> = ({ item, navigation }) => {
  // Fonction pour extraire l'URL de l'image en utilisant imageService
  const getImageUrl = () => {
    // Utiliser imageService pour obtenir la source de l'image
    const imageSource = imageService.getProductImageSource(item, placeholderImage);
    return imageSource;
  };
  
  // Format de la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    }
  };
  
  // Obtenir la classe de condition
  const getConditionStyle = () => {
    switch (item.condition) {
      case 'NEW':
        return styles.conditionNew;
      case 'LIKE_NEW':
        return styles.conditionLikeNew;
      case 'GOOD':
        return styles.conditionGood;
      case 'FAIR':
        return styles.conditionFair;
      default:
        return {};
    }
  };
  
  // Obtenir le label de condition
  const getConditionLabel = () => {
    switch (item.condition) {
      case 'NEW':
        return 'Neuf';
      case 'LIKE_NEW':
        return 'Très bon état';
      case 'GOOD':
        return 'Bon état';
      case 'FAIR':
        return 'État satisfaisant';
      default:
        return '';
    }
  };

  // Vérifier si le vendeur est professionnel
  const isProfessional = () => {
    return item.user_type === 'professional' || 
           item.user?.is_professional === true;
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Surface style={styles.surface}>
        <View style={styles.surfaceContent}>
          <View style={styles.imageContainer}>
            <Image
              source={getImageUrl()}
              style={styles.image}
              resizeMode="cover"
            />
            {item.condition && (
              <View style={[styles.conditionBadge, getConditionStyle()]}>
                <Text style={styles.conditionText}>{getConditionLabel()}</Text>
              </View>
            )}
            
            {/* Badge Pro/Particulier */}
            <View style={[styles.sellerBadge, isProfessional() ? styles.proBadge : styles.particulierBadge]}>
              <Text style={styles.sellerBadgeText}>
                {isProfessional() ? 'Pro' : 'Part.'}
              </Text>
            </View>
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.price}>{item.price}€</Text>
            <Text numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>
            
            <View style={styles.footer}>
              {item.city && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={12} color={colors.ICON_MEDIUM} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.city}
                  </Text>
                </View>
              )}
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 4,
  },
  surface: {
    elevation: 2,
  },
  surfaceContent: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.BORDER_LIGHT,
  },
  contentContainer: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    marginBottom: 5,
    color: colors.TEXT_PRIMARY,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.TEXT_PRIMARY,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: colors.ICON_MEDIUM,
    marginLeft: 2,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: colors.ICON_MEDIUM,
  },
  conditionBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.TEXT_WHITE,
  },
  conditionNew: {
    backgroundColor: colors.SUCCESS,
  },
  conditionLikeNew: {
    backgroundColor: colors.SUCCESS,
  },
  conditionGood: {
    backgroundColor: colors.WARNING,
  },
  conditionFair: {
    backgroundColor: colors.WARNING,
  },
  // Styles pour les badges vendeur Pro/Particulier
  sellerBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.BACKGROUND_CARD,
  },
  proBadge: {
    backgroundColor: colors.INFO,
  },
  particulierBadge: {
    backgroundColor: colors.GRAY_MEDIUM,
  },
  sellerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.TEXT_WHITE,
  },
});

export default ProductItem; 