import React from 'react';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  StyledView, 
  StyledText, 
  StyledTouchableOpacity, 
  StyledImage 
} from '../ui/StyledComponents';

/**
 * Interface représentant un produit
 */
export interface Product {
  id: number;
  title: string;
  price: number;
  images: string[];
  category: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    username: string;
  };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 colonnes avec un padding total de 48

/**
 * Composant affichant un produit dans une grille
 */
const ProductItem = ({ product, onFavoriteToggle }: { 
  product: Product; 
  onFavoriteToggle?: (id: number) => void;
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('ProductDetails', { id: product.id });
  };

  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(product.id);
    }
  };

  return (
    <StyledTouchableOpacity 
      className="mb-4" 
      style={{ width: CARD_WIDTH }}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <StyledView className="rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Image du produit */}
        <StyledView className="relative">
          <StyledImage 
            source={{ uri: product.images[0] || 'https://via.placeholder.com/200x200' }} 
            className="w-full aspect-square"
            resizeMode="cover"
          />
          
          {/* Bouton favori */}
          {onFavoriteToggle && (
            <StyledTouchableOpacity 
              className="absolute top-2 right-2 bg-white/80 rounded-full p-1"
              onPress={handleFavoriteToggle}
            >
              <Ionicons name="heart-outline" size={20} color="#FF7043" />
            </StyledTouchableOpacity>
          )}
        </StyledView>
        
        {/* Informations du produit */}
        <StyledView className="p-2">
          <StyledText className="text-primary font-bold text-lg">
            {product.price.toFixed(2)} €
          </StyledText>
          
          <StyledText className="text-text text-sm mt-1" numberOfLines={2}>
            {product.title}
          </StyledText>
          
          <StyledText className="text-placeholder text-xs mt-1">
            {product.category.name}
          </StyledText>
        </StyledView>
      </StyledView>
    </StyledTouchableOpacity>
  );
};

export default ProductItem; 