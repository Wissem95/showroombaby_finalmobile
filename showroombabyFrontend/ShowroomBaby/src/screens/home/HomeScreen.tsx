import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { Product, Category } from '../../models/Product';
import LogoPlaceholder from '../../components/LogoPlaceholder';

// Type pour la navigation
type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

// Données temporaires de catégories
const CATEGORIES: Category[] = [
  { id: 1, name: 'Vêtements', description: 'Vêtements pour bébés et enfants' },
  { id: 2, name: 'Jouets', description: 'Jouets pour tous les âges' },
  { id: 3, name: 'Poussettes', description: 'Poussettes et accessoires' },
  { id: 4, name: 'Mobilier', description: 'Meubles pour chambre d\'enfant' },
  { id: 5, name: 'Chaussures', description: 'Chaussures pour bébés et enfants' },
];

// Données temporaires de produits
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    title: 'Poussette légère',
    description: 'Poussette légère et pliable, idéale pour les voyages',
    price: 120,
    images: ['https://via.placeholder.com/150'],
    category: CATEGORIES[2],
    user: { id: 1, email: 'user@example.com', username: 'user1' },
    createdAt: '2023-01-01T12:00:00Z',
    condition: 'excellent',
    location: 'Paris',
  },
  {
    id: 2,
    title: 'Lot de vêtements 3-6 mois',
    description: 'Lot de 10 vêtements pour bébé 3-6 mois',
    price: 45,
    images: ['https://via.placeholder.com/150'],
    category: CATEGORIES[0],
    user: { id: 2, email: 'user2@example.com', username: 'user2' },
    createdAt: '2023-01-05T14:30:00Z',
    condition: 'good',
    location: 'Lyon',
  },
  {
    id: 3,
    title: 'Chaise haute évolutive',
    description: 'Chaise haute évolutive pour enfant de 6 mois à 3 ans',
    price: 85,
    images: ['https://via.placeholder.com/150'],
    category: CATEGORIES[3],
    user: { id: 3, email: 'user3@example.com', username: 'user3' },
    createdAt: '2023-01-10T09:15:00Z',
    condition: 'used',
    location: 'Marseille',
  },
];

// Composant pour un élément de catégorie
const CategoryItem = ({ category, onPress }: { category: Category; onPress: () => void }) => (
  <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
    <View style={styles.categoryIcon}>
      <Text style={styles.categoryIconText}>{category.name.charAt(0)}</Text>
    </View>
    <Text style={styles.categoryName}>{category.name}</Text>
  </TouchableOpacity>
);

// Composant pour un élément de produit
const ProductItem = ({ product, onPress }: { product: Product; onPress: () => void }) => (
  <TouchableOpacity style={styles.productItem} onPress={onPress}>
    <View style={styles.productImageContainer}>
      {product.images && product.images.length > 0 ? (
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>Pas d'image</Text>
        </View>
      )}
    </View>
    <View style={styles.productInfo}>
      <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
      <Text style={styles.productPrice}>{product.price} €</Text>
      <Text style={styles.productLocation} numberOfLines={1}>{product.location}</Text>
      <View style={styles.productMetaInfo}>
        <Text style={styles.productCondition}>{product.condition}</Text>
        <Text style={styles.productDate}>
          {new Date(product.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

/**
 * Écran d'accueil de l'application
 */
const HomeScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Simuler le chargement des données
  useEffect(() => {
    // Dans une vraie application, nous ferions un appel API ici
    const timer = setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Simuler le rafraîchissement des données
  const onRefresh = () => {
    setRefreshing(true);
    // Dans une vraie application, nous ferions un appel API ici
    setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setRefreshing(false);
    }, 1000);
  };

  // Navigation vers les détails d'un produit
  const handleProductPress = (productId: number) => {
    navigation.navigate('ProductDetails', { productId });
  };

  // Navigation vers les produits d'une catégorie
  const handleCategoryPress = (categoryId: number, categoryName: string) => {
    navigation.navigate('CategoryProducts', { categoryId, categoryName });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7043" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <LogoPlaceholder width={40} height={40} />
        <Text style={styles.headerTitle}>ShowroomBaby</Text>
      </View>

      {/* Liste des produits */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductItem
            product={item}
            onPress={() => handleProductPress(item.id)}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Texte d'introduction */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Bienvenue sur ShowroomBaby</Text>
              <Text style={styles.welcomeText}>
                Achetez et vendez des articles pour bébés et enfants près de chez vous.
              </Text>
            </View>

            {/* Liste des catégories */}
            <Text style={styles.sectionTitle}>Catégories</Text>
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <CategoryItem
                  category={item}
                  onPress={() => handleCategoryPress(item.id, item.name)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesList}
            />

            {/* Titre de la section produits */}
            <Text style={styles.sectionTitle}>Produits récents</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun produit disponible</Text>
          </View>
        }
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF7043']} />
        }
      />
    </View>
  );
};

const { width } = Dimensions.get('window');
const PRODUCT_WIDTH = width / 2 - 15;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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
  welcomeContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 15,
    marginBottom: 10,
    color: '#333',
  },
  categoriesList: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 5,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7043',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryIconText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  productsList: {
    paddingBottom: 20,
  },
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noImageText: {
    color: '#999',
    fontSize: 14,
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7043',
    marginBottom: 4,
  },
  productLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productCondition: {
    fontSize: 12,
    color: '#777',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen; 