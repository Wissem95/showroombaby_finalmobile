import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/Ionicons';
import { Product } from '../../models/Product';

// Types pour les routes et la navigation
type ProductDetailsScreenRouteProp = RouteProp<HomeStackParamList, 'ProductDetails'>;
type ProductDetailsScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

// Données temporaires de produit (à remplacer par une API)
const MOCK_PRODUCT: Product = {
  id: 1,
  title: 'Poussette légère',
  description: 'Poussette légère et pliable, idéale pour les voyages. Facilement transportable et confortable pour votre bébé. Comprend un pare-soleil ajustable et un panier de rangement spacieux. Convient aux bébés dès la naissance jusqu\'à 22 kg.',
  price: 120,
  images: [
    'https://via.placeholder.com/400x300',
    'https://via.placeholder.com/400x300',
    'https://via.placeholder.com/400x300',
  ],
  category: {
    id: 3,
    name: 'Poussettes',
    description: 'Poussettes et accessoires',
  },
  user: {
    id: 1,
    email: 'user@example.com',
    username: 'user1',
    phone: '0123456789',
  },
  createdAt: '2023-01-01T12:00:00Z',
  condition: 'excellent',
  location: 'Paris',
};

/**
 * Écran de détails d'un produit
 */
const ProductDetailsScreen = () => {
  const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Simuler un appel API pour récupérer les détails du produit
    const timer = setTimeout(() => {
      // Dans une vraie app, nous ferions un appel API en utilisant productId
      setProduct(MOCK_PRODUCT);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [productId]);

  // Gérer le retour à l'écran précédent
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Gérer l'ajout/suppression des favoris
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Dans une vraie app, appel API pour ajouter/supprimer des favoris
  };

  // Gérer l'ouverture de la conversation avec le vendeur
  const handleContactSeller = () => {
    // Dans une vraie app, navigation vers l'écran de messagerie
    console.log('Contacter le vendeur', product?.user.id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7043" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#FF7043" />
        <Text style={styles.errorText}>Produit non trouvé</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Formatter la date
  const formattedDate = new Date(product.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du produit</Text>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF7043' : '#333'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Carrousel d'images */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[activeImageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          
          {/* Indicateurs de pagination */}
          {product.images.length > 1 && (
            <View style={styles.pagination}>
              {product.images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeImageIndex && styles.activePaginationDot,
                  ]}
                  onPress={() => setActiveImageIndex(index)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Informations du produit */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{product.price} €</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Icon name="location-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{product.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="pricetag-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{product.condition}</Text>
            </View>
          </View>

          <View style={styles.categoryContainer}>
            <Text style={styles.sectionTitle}>Catégorie</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => navigation.navigate('CategoryProducts', {
                categoryId: product.category.id,
                categoryName: product.category.name,
              })}
            >
              <Text style={styles.categoryText}>{product.category.name}</Text>
              <Icon name="chevron-forward" size={16} color="#FF7043" />
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.sellerContainer}>
            <Text style={styles.sectionTitle}>Vendeur</Text>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatarContainer}>
                <Text style={styles.sellerAvatar}>{product.user.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{product.user.username}</Text>
                <Text style={styles.sellerJoinDate}>Membre depuis 2023</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de contact */}
      <View style={styles.contactContainer}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContactSeller}>
          <Icon name="chatbubble-outline" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Contacter le vendeur</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF7043',
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  pagination: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activePaginationDot: {
    backgroundColor: '#FF7043',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF7043',
    marginBottom: 15,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  categoryContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 14,
    color: '#444',
  },
  descriptionContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  sellerContainer: {
    marginBottom: 20,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF7043',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sellerAvatar: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  sellerJoinDate: {
    fontSize: 12,
    color: '#888',
  },
  contactContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  contactButton: {
    backgroundColor: '#FF7043',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProductDetailsScreen; 