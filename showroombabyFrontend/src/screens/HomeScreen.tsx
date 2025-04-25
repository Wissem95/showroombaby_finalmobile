import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Text, Searchbar, Chip, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';
import { SERVER_IP } from '../config/ip';
import imageService from '../services/api/imageService';

type Props = NativeStackScreenProps<any, 'Home'>;

// URL de l'API avec l'adresse IP de configuration
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? `http://${SERVER_IP}:8000/api`  // Adresse IP locale chargée depuis la configuration avec préfixe /api
  : 'https://api.showroombaby.com/api';  // URL de production

console.log('HomeScreen - API_URL:', API_URL);

// Image placeholder
const placeholderImage = require('../../assets/placeholder.png');

// URL des images par défaut (remplacement par le placeholder local)
const DEFAULT_IMAGE_URL = placeholderImage;
const BANNER_IMAGE_URL = require('../../assets/images/IMG_3139-Photoroom.png');

// Catégories à afficher avec leurs images correspondantes
const categories = [
  { id: 0, name: 'Tendance', image: require('../../assets/images/2151157112.jpg') },                       // Cuillère bol repas pour bébé
  { id: -1, name: 'Tous les produits', image: require('../../assets/images/IMG_3006-Photoroom.png') },     // Chambre
  { id: 1, name: 'Poussette', image: require('../../assets/images/IMG_3127-Photoroom.png') },              // Poussette
  { id: 2, name: 'Sièges auto', image: require('../../assets/images/Capture_decran_._2025-02-09_a_21.35.01.jpg') },            // Vêtement bébé (petit train avec fumée)
  { id: 3, name: 'Chambre', image: require('../../assets/images/IMG_3139-Photoroom.png') },                          // Chaussure bébé
  { id: 4, name: 'Chaussure / Vêtements', image: require('../../assets/images/IMG_3006-Photoroom.png') },  // Poussette noire (image connexion)
  { id: 5, name: 'Jeux / Éveil', image: require('../../assets/images/2151157112.jpg') },    // Canapé avec nuages
  { id: 6, name: 'Livre / Dvd', image: require('../../assets/images/IMG_3119.jpg') },                    // Cuillère bol repas pour bébé (même que Tendance)
  { id: 7, name: 'Toilette', image: require('../../assets/images/IMG_3129.jpg') },                         // Baignoire avec mousse
  { id: 8, name: 'Repas', image: require('../../assets/images/IMG_3132-Photoroom.png') },                  // Petit train avec fumée
  { id: 9, name: 'Sortie', image: require('../../assets/images/IMG_3119.jpg') },                           // Livre avec nuage
  { id: 10, name: 'Service', image: require('../../assets/images/Votre_texte_de_paragraphe.png.png') }, // Siège auto
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

  // Utiliser le service d'image pour obtenir la source de l'image
  const getProductImage = (product: Product) => {
    return imageService.getProductImageSource(product, DEFAULT_IMAGE_URL);
  };
  
  useFocusEffect(
    useCallback(() => {
      const checkIfFavorite = async () => {
        try {
          // Vérifier d'abord le stockage local pour une réponse immédiate
          const localStatus = await AsyncStorage.getItem(`favorite_${item.id}`);
          if (localStatus === 'true') {
            setIsFavorite(true);
            return;
          } else if (localStatus === 'false') {
            setIsFavorite(false);
            return;
          }
          
          // Si pas d'information locale, requête au serveur
          const token = await AsyncStorage.getItem('token');
          if (!token) return;
          
          // Utiliser la nouvelle route de vérification des favoris
          const response = await axios.get(`${API_URL}/favorites/check/${item.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          
          const isFav = response.data?.isFavorite || false;
          setIsFavorite(isFav);
          
          // Sauvegarder le statut dans le stockage local pour les prochaines fois
          await AsyncStorage.setItem(`favorite_${item.id}`, isFav ? 'true' : 'false');
        } catch (error) {
          console.error('Erreur vérification favoris:', error);
          setIsFavorite(false);
          // En cas d'erreur, définir comme non-favori par défaut
          await AsyncStorage.setItem(`favorite_${item.id}`, 'false');
        }
      };
      
      // Vérifier les favoris à chaque fois que l'écran est affiché
      checkIfFavorite();
      
      // Pas besoin de listener ici car useFocusEffect s'exécute déjà à chaque focus
      
      // Nettoyer si besoin (optionnel dans ce cas)
      return () => {
        // Cleanup if needed
      };
    }, [item.id])
  );

  const handleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Connexion requise', 'Vous devez être connecté pour gérer vos favoris');
        navigation.navigate('Auth');
        return;
      }

      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        
        // Mettre à jour le stockage local
        await AsyncStorage.setItem('favoritesChanged', 'true');
        await AsyncStorage.setItem(`favorite_${item.id}`, 'false');
      } else {
        await axios.post(`${API_URL}/favorites/${item.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
        
        // Mettre à jour le stockage local
        await AsyncStorage.setItem('favoritesChanged', 'true');
        await AsyncStorage.setItem(`favorite_${item.id}`, 'true');
      }
    } catch (error: any) {
      // Vérifie si c'est l'erreur 422 pour ne pas l'afficher en rouge
      if (error.response && error.response.status === 422 && error.response.data?.message.includes('propre produit')) {
        // Ne pas afficher l'erreur en console pour cette erreur spécifique
        console.log('Info: tentative d\'ajouter son propre produit en favoris');
      } else {
        // Pour toutes les autres erreurs, on conserve le console.error
      console.error('Erreur favoris:', error);
      }
      
      if (error.response) {
        if (error.response.status === 422) {
          if (error.response.data?.message.includes('propre produit')) {
            Alert.alert('Information', 'Vous ne pouvez pas ajouter votre propre produit en favoris');
          } else {
            // Déjà en favoris
            setIsFavorite(true);
            await AsyncStorage.setItem(`favorite_${item.id}`, 'true');
            Alert.alert('Information', 'Ce produit est déjà dans vos favoris');
          }
        } else if (error.response.status === 404) {
          // Le produit n'existe plus ou n'est plus en favoris
          setIsFavorite(false);
          await AsyncStorage.setItem(`favorite_${item.id}`, 'false');
          Alert.alert('Information', 'Ce produit n\'est plus disponible en favoris');
        } else if (error.response.status === 401) {
          // Session expirée
          Alert.alert('Erreur d\'authentification', 'Votre session a expiré. Veuillez vous reconnecter.');
          navigation.navigate('Auth');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la gestion des favoris');
        }
      } else if (error.request) {
        // Erreur réseau
        Alert.alert('Erreur de connexion', 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
      }
    }
  };

  return (
    <Card
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id, fullscreenMode: true })}
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
          onLoad={() => {
            console.log(`Image chargée avec succès pour produit ${item.id}`);
            setImageLoading(false);
            setImageError(false);
          }}
          onError={(e) => {
            console.log(`Erreur de chargement d'image pour produit ${item.id}:`, e.nativeEvent.error);
            setImageLoading(false);
            setImageError(true);
          }}
          key={`home-image-${item.id}-${new Date().getTime()}`}
          defaultSource={DEFAULT_IMAGE_URL}
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
  const [backgroundImage, setBackgroundImage] = useState(categories[0].image);

  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Mettre à jour l'image de fond lorsque la catégorie change
  useEffect(() => {
    const selectedCat = categories.find(cat => cat.id === selectedCategory);
    if (selectedCat && selectedCat.image) {
      setBackgroundImage(selectedCat.image);
    }
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/products`);
      let productsData = Array.isArray(response.data) ? response.data : response.data.items || [];
      setProducts(productsData);
      setTrendingProducts(productsData);
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur API:', err);
      setError('Impossible de charger les produits');
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (selectedId: number) => {
    setSelectedCategory(selectedId);
    
    // Changer l'image de fond
    const selectedCat = categories.find(cat => cat.id === selectedId);
    if (selectedCat && selectedCat.image) {
      setBackgroundImage(selectedCat.image);
    }
    
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
          scrollEnabled={true}
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

  // Fonction pour tester l'accès aux images
  useEffect(() => {
    // Cette fonction est volontairement commentée pour éviter des requêtes constantes
    /* 
    const testImageAccess = async () => {
      if (products.length > 0) {
        const firstProduct = products[0];
        try {
          // Tester l'accès à l'image du premier produit
          const imageSource = getProductImage(firstProduct);
          if (imageSource && imageSource.uri) {
            console.log('Test d\'accès à l\'image:', imageSource.uri);
            
            try {
              const response = await fetch(imageSource.uri, { method: 'HEAD' });
              console.log('Réponse du test d\'image:', {
                status: response.status,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
              });
            } catch (error) {
              console.error('Erreur lors du test d\'accès à l\'image:', error);
            }
          }
        } catch (error) {
          console.error('Erreur lors du test des images:', error);
        }
      }
    };
    
    if (products.length > 0) {
      testImageAccess();
    }
    */
    
    // Au lieu de tester les images, on log simplement les URLs des produits chargés
    if (products.length > 0) {
      console.log(`HomeScreen - ${products.length} produits chargés. Vérifiez les logs d'images.`);
    }
  }, [products]);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Image 
          source={backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        <View style={styles.searchBarContainer}>
          <TouchableOpacity
            style={{ width: '100%' }}
            onPress={() => navigation.navigate('Search')}
          >
            <Searchbar
              placeholder="Rechercher"
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              value={searchQuery}
              editable={false}
              pointerEvents="none"
              icon={() => null}
              right={() => <Ionicons name="search-outline" size={20} color="#666" />}
            />
          </TouchableOpacity>
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
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.bannerText}>Surfer sur les tendances !</Text>
        <FlatList
          data={trendingProducts}
          renderItem={({ item }) => <ProductItem item={item} navigation={navigation} />}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerSection: {
    height: hp('28%'),
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '120%',
    top: -hp('7%'),
  },
  searchBarContainer: {
    paddingHorizontal: wp('4%'),
    marginTop: hp('2%'),
  },
  searchBar: {
    borderRadius: 30,
    height: hp('5.5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#ffd4e5',
    elevation: 0,
  },
  searchInput: {
    fontSize: wp('3.5%'),
    color: '#666',
  },
  categoriesContainer: {
    marginTop: hp('1%'),
  },
  categoriesContent: {
    paddingHorizontal: wp('4%'),
    gap: wp('2%'),
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -hp('2%'),
  },
  bannerText: {
    fontSize: wp('5%'),
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    marginTop: hp('2%'),
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
  },
  productCard: {
    width: wp('44%'),
    margin: wp('2%'),
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 0,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: wp('44%'),
    backgroundColor: '#f5f5f5',
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
    padding: 1,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    height: hp('4%'),
    marginRight: wp('2%'),
  },
  categoryText: {
    fontSize: wp('3.2%'),
    color: '#666',
  },
  selectedCategoryChip: {
    backgroundColor: '#ff6b9b',
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
}); 