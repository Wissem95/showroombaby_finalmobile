import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Chip, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Home'>;

// Catégories à afficher
const categories = [
  { id: 0, name: 'Tendance' },
  { id: 1, name: 'Siège auto' },
  { id: 2, name: 'Chambre' },
  { id: 3, name: 'Chaussure' },
];

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  category_id: number;
  user_id: number;
  city?: string;
  location?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  images?: string | string[] | null;
  is_trending?: boolean;
  is_featured?: boolean;
}

export default function HomeScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/products');
      console.log('Request:', 'get', 'http://127.0.0.1:8000/api/products', undefined);
      console.log('Response:', response.status, response.data);
      
      // Traiter les différents formats de réponse possibles
      let productsData: Product[] = [];
      if (response.data.items) {
        console.log('Réponse API produits:', response.data);
        productsData = response.data.items;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }
      
      setProducts(productsData);
      // Filtrer les produits tendance pour l'affichage principal
      setTrendingProducts(
        productsData.filter(product => product.is_trending || product.is_featured)
      );
      
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des produits:', err);
      setError('Impossible de charger les produits. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (selectedId: number) => {
    setSelectedCategory(selectedId);
    // Ici, vous pourriez filtrer les produits en fonction de la catégorie sélectionnée
    // Par exemple:
    // if (selectedId > 0) {
    //   const filteredProducts = products.filter(product => product.category_id === selectedId);
    //   setTrendingProducts(filteredProducts);
    // } else {
    //   setTrendingProducts(products.filter(product => product.is_trending));
    // }
  };

  const renderCategories = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map(category => (
          <Chip
            key={category.id}
            selected={selectedCategory === category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id ? styles.selectedCategoryChip : {}
            ]}
            textStyle={selectedCategory === category.id ? styles.selectedCategoryText : {}}
            onPress={() => handleCategorySelect(category.id)}
          >
            {category.name}
          </Chip>
        ))}
      </ScrollView>
    );
  };

  const getProductImage = (product: Product) => {
    // Image par défaut
    const defaultImage = { uri: 'https://placehold.co/300' };

    if (!product.images) return defaultImage;

    try {
      // Si images est une chaîne JSON, on essaie de l'analyser
      if (typeof product.images === 'string') {
        try {
          const parsedImages = JSON.parse(product.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            return { uri: parsedImages[0] };
          }
        } catch (e) {
          // Si ce n'est pas un JSON valide, on utilise directement la chaîne
          return { uri: product.images };
        }
      } 
      // Si c'est déjà un tableau
      else if (Array.isArray(product.images) && product.images.length > 0) {
        return { uri: product.images[0] };
      }
    } catch (e) {
      // En cas d'erreur, on utilise l'image par défaut
      console.log('Erreur de traitement des images:', e);
    }

    return defaultImage;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const renderTrendingItem = ({ item }: { item: Product }) => (
    <Card
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Card.Cover 
        source={getProductImage(item)} 
        style={styles.productImage} 
        resizeMode="cover"
      />
      <Card.Content style={styles.productContent}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {item.title || ""}
        </Text>
        <Text style={styles.productPrice}>
          {formatPrice(item.price)}
        </Text>
        {item.city ? (
          <Text style={styles.productLocation} numberOfLines={1}>
            {item.city || item.location || ""}
          </Text>
        ) : null}
        {(item.is_trending || item.is_featured) ? (
          <View style={styles.badgeContainer}>
            {item.is_trending ? (
              <View style={[styles.badge, styles.trendingBadge]}>
                <Text style={styles.badgeText}>Tendance</Text>
              </View>
            ) : null}
            {item.is_featured ? (
              <View style={[styles.badge, styles.featuredBadge]}>
                <Text style={styles.badgeText}>Favoris</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );

  const renderContent = () => {
    // Afficher un indicateur de chargement
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b9b" />
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      );
    }

    // Afficher un message d'erreur si nécessaire
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Afficher un message si aucun produit n'est disponible
    if (trendingProducts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun produit tendance trouvé.</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchProducts}
          >
            <Text style={styles.retryButtonText}>Rafraîchir</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {/* Bannière principale */}
        <View style={styles.bannerContainer}>
          <Image 
            source={{ uri: 'https://placehold.co/600x400/87CEEB/FFC0CB?text=Chambre+de+bébé' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerText}>Surfer sur les tendances!</Text>
          </View>
        </View>

        {/* Grille de produits tendance */}
        <Text style={styles.sectionTitle}>Produits tendance</Text>
        <FlatList
          data={trendingProducts}
          renderItem={renderTrendingItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsGrid}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Rechercher"
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={() => <Ionicons name="search-outline" size={24} color="#ffffff" />}
        />
      </View>

      {/* Catégories */}
      {renderCategories()}

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchBarContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    borderRadius: 25,
    height: 45,
    backgroundColor: '#ff6b9b',
    elevation: 0,
  },
  searchInput: {
    color: '#ffffff',
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryChip: {
    marginRight: 8,
    borderRadius: 20,
    paddingHorizontal: 3,
  },
  selectedCategoryChip: {
    backgroundColor: '#ff6b9b',
  },
  selectedCategoryText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bannerContainer: {
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
    height: 180,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  productsGrid: {
    paddingHorizontal: 7.5,
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    margin: 7.5,
    borderRadius: 10,
  },
  productImage: {
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productContent: {
    padding: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b9b',
  },
  productLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  trendingBadge: {
    backgroundColor: '#ffcce0',
  },
  featuredBadge: {
    backgroundColor: '#e0f7ff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff6b9b',
    marginTop: 2,
  },
  // États de chargement et d'erreur
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff6b9b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
}); 