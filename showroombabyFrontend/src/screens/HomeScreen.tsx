import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Text, Searchbar, Chip, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type Props = NativeStackScreenProps<any, 'Home'>;

// URL de l'API
const API_URL = 'http://127.0.0.1:8000';

// URL des images par défaut
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x300/f8bbd0/ffffff?text=Showroom+Baby';
const BANNER_IMAGE_URL = require('../../assets/images/IMG_3139-Photoroom.png');

// Catégories à afficher
const categories = [
  { id: 0, name: 'Tendance' },
  { id: -1, name: 'Tous les produits' },
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
  images?: string | string[] | { path: string; url?: string }[] | any[] | null;
  is_trending?: boolean | number;
  is_featured?: boolean | number;
}

// Composant d'élément de produit indépendant
const ProductItem = React.memo(({ item, navigation }: { item: Product; navigation: any }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const getProductImage = (product: Product) => {
    // Image par défaut
    if (!product.images) {
      return { uri: DEFAULT_IMAGE_URL };
    }

    try {
      // Si images est une chaîne JSON, on essaie de l'analyser
      if (typeof product.images === 'string') {
        try {
          const parsedImages = JSON.parse(product.images);
          
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            // Vérifier si l'image contient un chemin complet ou juste un nom de fichier
            const imageUrl = parsedImages[0].includes('http') 
              ? parsedImages[0] 
              : `${API_URL}/storage/${parsedImages[0]}`;
            
            return { uri: imageUrl };
          }
        } catch (e) {
          // Si ce n'est pas un JSON valide, on utilise directement la chaîne
          const imageUrl = product.images.includes('http') 
            ? product.images 
            : `${API_URL}/storage/${product.images}`;
          
          return { uri: imageUrl };
        }
      } 
      // Si c'est déjà un tableau d'objets avec propriété "path"
      else if (Array.isArray(product.images) && product.images.length > 0) {
        // Vérifier si c'est un tableau d'objets avec une propriété path
        if (typeof product.images[0] === 'object' && product.images[0] !== null) {
          // Si l'objet contient un champ path ou url
          if (product.images[0].path) {
            const imageUrl = product.images[0].path.includes('http') 
              ? product.images[0].path 
              : `${API_URL}/storage/${product.images[0].path}`;
            
            return { uri: imageUrl };
          } else if (product.images[0].url) {
            return { uri: product.images[0].url };
          } else {
            // Essayer de récupérer directement la première valeur
            const firstImage = product.images[0];
            
            if (typeof firstImage === 'string') {
              const imageUrl = firstImage.includes('http') 
                ? firstImage 
                : `${API_URL}/storage/${firstImage}`;
              
              return { uri: imageUrl };
            }
          }
        } else if (typeof product.images[0] === 'string') {
          // Si c'est un tableau de chaînes
          const imageUrl = product.images[0].includes('http') 
            ? product.images[0] 
            : `${API_URL}/storage/${product.images[0]}`;
          
          return { uri: imageUrl };
        }
      }
    } catch (e) {
      // En cas d'erreur, on utilise l'image par défaut
    }

    return { uri: DEFAULT_IMAGE_URL };
  };
  
  useEffect(() => {
    const checkIfFavorite = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(`${API_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let favorites = Array.isArray(response.data) ? response.data : response.data.data;
        setIsFavorite(favorites.some((fav: any) => fav.product_id === item.id));
      } catch (error) {
        console.error('Erreur vérification favoris:', error);
      }
    };
    checkIfFavorite();
  }, [item.id]);

  const handleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Connexion requise', 'Vous devez être connecté pour gérer vos favoris');
        navigation.navigate('Auth');
        return;
      }

      if (isFavorite) {
        await axios.delete(`${API_URL}/api/favorites/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
      } else {
        await axios.post(`${API_URL}/api/favorites/${item.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Erreur favoris:', error);
      Alert.alert('Erreur', 'Impossible de gérer les favoris');
    }
  };

  return (
    <Card
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <View style={styles.productImageContainer}>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleFavorite}
        >
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavorite ? '#ff6b9b' : '#ffffff'} 
          />
        </TouchableOpacity>
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="small" color="#ff6b9b" />
          </View>
        )}
        <Image 
          source={getProductImage(item)} 
          style={styles.productImage}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
        {imageError && (
          <View style={styles.imageErrorContainer}>
            <Ionicons name="image-outline" size={24} color="#ff6b9b" />
            <Text style={styles.imageErrorText}>Image indisponible</Text>
          </View>
        )}
      </View>
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
});

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    handleCategorySelect(0); // Ajout du chargement initial
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      let productsData = Array.isArray(response.data) ? response.data : response.data.items || [];
      setProducts(productsData);
      handleCategorySelect(selectedCategory);
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur API:', err);
      setError('Impossible de charger les produits');
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (selectedId: number) => {
    setSelectedCategory(selectedId);
    
    // Filtrer les produits en fonction de la catégorie sélectionnée
    if (selectedId === 0) {
      // Pour la catégorie Tendance, si aucun produit n'est marqué comme tendance, afficher les 5 premiers produits
      const trendingOnes = products.filter(product => 
        !!product.is_trending || !!product.is_featured
      );
      setTrendingProducts(trendingOnes.length > 0 ? trendingOnes : products.slice(0, 5));
    } else if (selectedId === -1) {
      // Tous les produits: afficher tous les produits
      setTrendingProducts(products);
    } else {
      // Catégorie spécifique: filtrer par category_id
      console.log('Filtrage par catégorie dans handleCategorySelect:', selectedId);
      
      // Convertir les valeurs en chaînes pour la comparaison et éviter les problèmes de type
      const categoryIdStr = String(selectedId);
      const filteredProducts = products.filter(product => 
        String(product.category_id) === categoryIdStr
      );
      console.log('Produits filtrés après sélection:', filteredProducts.length);
      
      setTrendingProducts(filteredProducts);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  };

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
          <Text style={styles.emptyText}>Aucun produit trouvé dans cette catégorie.</Text>
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
            source={BANNER_IMAGE_URL}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerText}>Surfer sur les tendances!</Text>
          </View>
        </View>

        {/* Grille de produits */}
        <Text style={styles.sectionTitle}>
          {selectedCategory === 0 ? 'Produits tendance' : 
           selectedCategory === -1 ? 'Tous les produits' :
           categories.find(c => c.id === selectedCategory)?.name || 'Produits'}
        </Text>
        <FlatList
          data={trendingProducts}
          renderItem={({ item }) => <ProductItem item={item} navigation={navigation} />}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsGrid}
        />
      </>
    );
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
            textStyle={[
              styles.categoryText,
              selectedCategory === category.id ? styles.selectedCategoryText : {}
            ]}
            onPress={() => handleCategorySelect(category.id)}
          >
            {category.name}
          </Chip>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/IMG_3139-Photoroom.png')}
        style={styles.backgroundImage}
      />
      
      <View style={styles.overlay}>
        <View style={styles.searchBarContainer}>
          <Searchbar
            placeholder="Rechercher"
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={() => null}
            right={() => <Ionicons name="search-outline" size={20} color="#666" />}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(category => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id ? styles.selectedCategoryChip : {}
              ]}
              textStyle={[
                styles.categoryText,
                selectedCategory === category.id ? styles.selectedCategoryText : {}
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.contentContainer}>
          <Text style={styles.bannerText}>Surfer sur les tendances !</Text>
          <FlatList
            data={trendingProducts}
            renderItem={({ item }) => <ProductItem item={item} navigation={navigation} />}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsGrid}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: hp('27%'),
    top: -60,
  },
  overlay: {
    flex: 1,
    paddingTop: hp('2%'),
  },
  searchBarContainer: {
    paddingHorizontal: wp('4%'),
    marginTop: 0,
  },
  searchBar: {
    borderRadius: 30,
    height: hp('4.5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: '#ffd4e5',
    elevation: 0,
  },
  searchInput: {
    fontSize: wp('3.2%'),
    color: '#666',
    textAlign: 'left',
  },
  categoriesContainer: {
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
  },
  categoriesContent: {
    paddingHorizontal: wp('4%'),
    gap: wp('1.5%'),
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    height: hp('3.5%'),
    marginRight: wp('1.5%'),
    elevation: 1,
  },
  categoryText: {
    fontSize: wp('3%'),
  },
  selectedCategoryChip: {
    backgroundColor: '#ffffff',
  },
  selectedCategoryText: {
    color: '#ff6b9b',
  },
  contentContainer: {
    flex: 1,
    marginTop: hp('1%'),
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: hp('1%'),
  },
  bannerText: {
    fontSize: wp('5%'),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: hp('1%'),
    color: '#333',
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: hp('1%'),
    color: '#333',
  },
  productsGrid: {
    paddingHorizontal: wp('2%'),
    paddingTop: hp('1%'),
  },
  productCard: {
    width: wp('44%'),
    margin: wp('2%'),
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: wp('44%'),
    backgroundColor: '#f5f5f5',
    borderRadius: 0,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productContent: {
    padding: wp('3%'),
  },
  productTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  productPrice: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#ff6b9b',
  },
  productLocation: {
    fontSize: wp('3%'),
    color: '#666',
    marginTop: hp('0.5%'),
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
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
  },
  imageErrorText: {
    color: '#ff6b9b',
    marginTop: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: wp('6%'),
    padding: wp('2%'),
  },
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('40%'),
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
  },
}); 