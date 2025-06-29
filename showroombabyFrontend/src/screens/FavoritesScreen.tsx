import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Platform,
  Animated
} from 'react-native';
import { Card, Button, Searchbar, Divider, Chip, Surface } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State, PanGestureHandlerStateChangeEvent, GestureHandlerRootView } from 'react-native-gesture-handler';
import imageService from '../services/api/imageService';
import { globalStyles, colors } from '../theme/globalStyles';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.3:8000/api'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';

// Importer l'image placeholder directement
const placeholderImage = require('../../assets/placeholder.png');
const backgroundImage = require('../../assets/images/IMG_3139-Photoroom.png');

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
}

// Après la définition du type Product, ajouter un type pour les favoris
interface Favorite {
  id: number;
  product_id: number;
  user_id: number;
  product: Product;
  created_at: string;
  updated_at: string;
}

export default function FavoritesScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        setError('Veuillez vous connecter pour voir vos favoris');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // Ajouter un timeout pour éviter les attentes infinies
      });
      
      // L'API renvoie un tableau d'objets de favoris avec les produits imbriqués
      if (response.data && Array.isArray(response.data.data)) {
        // Format API: { data: [ { product: {...}, product_id: 1, ... }, ... ] }
        const extractedProducts = response.data.data
          .filter((favorite: Favorite) => favorite && favorite.product)
          .map((favorite: Favorite) => favorite.product);
        
        console.log('Produits favoris extraits:', extractedProducts.length);
        
        // Nettoyer les entrées de stockage local pour les produits qui ne sont plus en favoris
        // afin de synchroniser l'état local avec le serveur
        const localStorageFavorites = await AsyncStorage.getAllKeys();
        const favoritesKeys = localStorageFavorites.filter(key => key.startsWith('favorite_'));
        
        // Récupération des IDs de produits réellement en favoris
        const actualFavoriteIds = extractedProducts.map((product: Product) => product.id);
        
        // Nettoyage des entrées locales incorrectes
        for (const key of favoritesKeys) {
          const productId = key.replace('favorite_', '');
          const isInFavorites = actualFavoriteIds.includes(parseInt(productId));
          
          if (await AsyncStorage.getItem(key) === 'true' && !isInFavorites) {
            // Marquer comme non-favori si ce n'est pas dans les favoris actuels du serveur
            await AsyncStorage.setItem(key, 'false');
            console.log(`Corrigé l'état local du favori pour le produit ${productId}`);
          }
        }
        
        setFavorites(extractedProducts);
      } else if (response.data && Array.isArray(response.data)) {
        // Format alternatif: [ { product: {...}, product_id: 1, ... }, ... ]
        const extractedProducts = response.data
          .filter((favorite: Favorite) => favorite && favorite.product)
          .map((favorite: Favorite) => favorite.product);
        
        console.log('Produits favoris extraits (format alt):', extractedProducts.length);
        setFavorites(extractedProducts);
      } else {
        console.warn('Format de données inattendu:', response.data);
        setFavorites([]);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des favoris:', error);
      
      // Gérer spécifiquement les erreurs d'authentification
      if (error.response?.status === 401) {
        console.log('Erreur 401 lors du chargement des favoris - Token expiré');
        setError('Session expirée. Veuillez vous reconnecter.');
        
        // Ne pas rediriger automatiquement pour éviter une boucle
        // navigation.navigate('Auth') - NE PAS FAIRE CECI
      } else {
        setError('Impossible de charger vos favoris. Veuillez réessayer.');
      }
      
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const removeFavorite = async (productId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour gérer vos favoris');
        return;
      }
      
      await axios.delete(`${API_URL}/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour la liste locale des favoris
      setFavorites(favorites.filter(item => item.id !== productId));
      
      // Mettre à jour le statut global des favoris pour toutes les pages
      await AsyncStorage.setItem('favoritesChanged', 'true');
      await AsyncStorage.setItem(`favorite_${productId}`, 'false');
      
      Alert.alert('Succès', 'Produit retiré des favoris');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du favori:', error);
      
      // Traitement spécifique selon le type d'erreur
      if (error.response) {
        if (error.response.status === 404) {
          // Le produit n'est plus dans les favoris côté serveur, on le retire localement
          setFavorites(favorites.filter(item => item.id !== productId));
          
          // Mettre à jour quand même le statut global
          await AsyncStorage.setItem('favoritesChanged', 'true');
          await AsyncStorage.setItem(`favorite_${productId}`, 'false');
          
          Alert.alert('Information', 'Ce produit a déjà été retiré de vos favoris');
        } else if (error.response.status === 401) {
          Alert.alert('Erreur d\'authentification', 'Votre session a expiré. Veuillez vous reconnecter.');
          // On pourrait rediriger vers la page de login si nécessaire
        } else {
          Alert.alert('Erreur', 'Impossible de retirer ce produit des favoris. Veuillez réessayer.');
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse reçue (problème de connexion)
        Alert.alert('Erreur de connexion', 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        Alert.alert('Erreur', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    }
  };

  const confirmRemove = (productId: number, title: string) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous retirer "${title}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', onPress: () => removeFavorite(productId), style: 'destructive' }
      ]
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Composant pour afficher un élément de produit favori avec style modernisé
  const ProductItem = React.memo(({ item, navigation, onRemove }: { 
    item: Product; 
    navigation: any; 
    onRemove: (id: number, title: string) => void;
  }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    
    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ProductDetails', { 
            productId: item.id
          })}
        >
          <View style={styles.productImageContainer}>
            {imageError ? (
              <View style={styles.imageErrorContainer}>
                <Ionicons name="image-outline" size={24} color={colors.PRIMARY_DARK} />
                <Text style={styles.imageErrorText}>Image indisponible</Text>
              </View>
            ) : (
              <Image 
                source={imageService.getProductImageSource(item, placeholderImage)} 
                style={styles.productImage}
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => {
                  setImageLoading(false);
                  setImageError(false);
                }}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                defaultSource={placeholderImage}
              />
            )}
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY_DARK} />
              </View>
            )}
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => onRemove(item.id, item.title)}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={22} color={colors.BACKGROUND_MAIN} />
            </TouchableOpacity>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{formatPrice(item.price)}</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              {item.location && (
                <Text style={styles.productLocation} numberOfLines={1}>
                  <Ionicons name="location-outline" size={14} color={colors.TEXT_LIGHT} />
                  {' '}{item.location}
                </Text>
              )}
              <Text style={styles.productDate}>Ajouté le {formatDate(item.created_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  });

  // Remplacer la fonction renderItem par cette version qui utilise le composant défini ci-dessus
  const renderItem = ({ item }: { item: Product }) => (
    <ProductItem 
      item={item} 
      navigation={navigation} 
      onRemove={confirmRemove} 
    />
  );

  const filteredProducts = favorites.filter(product => 
    product && product.title ? product.title.toLowerCase().includes(searchQuery.toLowerCase()) : false
  );

  if (loading && !refreshing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY_DARK} />
          <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (error && !token) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.centerContainer}>
          <Ionicons name="person-outline" size={64} color={colors.GRAY_LIGHT} />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
            labelStyle={styles.buttonLabel}
          >
            Se connecter
          </Button>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={loadFavorites}
            style={styles.retryButton}
            labelStyle={styles.buttonLabel}
          >
            Réessayer
          </Button>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="transparent" translucent={true} />
        
        <View style={styles.mainContent}>
          <View style={styles.headerSection}>
            <ImageBackground
              source={backgroundImage}
              style={styles.backgroundImage}
              imageStyle={styles.backgroundImageStyle}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['colors.OVERLAY_LIGHT', 'colors.OVERLAY_DARK']}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.title}>Mes Favoris</Text>
                  <Text style={styles.subtitle}>
                    {favorites.length} {favorites.length > 1 ? 'articles' : 'article'} sauvegardé{favorites.length > 1 ? 's' : ''}
                  </Text>
                  
                  <View style={styles.searchBarContainer}>
                    <Searchbar
                      placeholder="Rechercher dans vos favoris"
                      onChangeText={handleSearch}
                      value={searchQuery}
                      style={styles.searchBar}
                      inputStyle={styles.searchInput}
                      icon={() => <Ionicons name="search" size={20} color={colors.TEXT_LIGHT} />}
                      clearIcon={() => <Ionicons name="close" size={20} color={colors.TEXT_LIGHT} />}
                    />
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
          
          {favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={80} color={colors.PRIMARY_TRANSPARENT_LIGHT} />
              </View>
              <Text style={styles.emptyText}>Vous n'avez pas encore de favoris</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des produits à vos favoris pour les retrouver facilement
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Home')}
                style={styles.browseButton}
                labelStyle={styles.buttonLabel}
                                  icon={() => <Ionicons name="search" size={20} color={colors.BACKGROUND_MAIN} />}
              >
                Parcourir les produits
              </Button>
            </View>
          ) : (
            <View style={styles.productsContainer}>
              <FlatList
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['colors.PRIMARY_DARK']}
                    tintColor={colors.PRIMARY_DARK}
                  />
                }
                ListEmptyComponent={
                  searchQuery ? (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="search-outline" size={50} color={colors.GRAY_LIGHT} />
                      <Text style={styles.noResultsText}>
                        Aucun résultat pour "{searchQuery}"
                      </Text>
                    </View>
                  ) : null
                }
              />
            </View>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

// Récupérer le token AsyncStorage
const token = AsyncStorage.getItem('token');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  headerSection: {
    height: hp('30%'),
    zIndex: 1,
    ...Platform.select({
      ios: {
        marginTop: -hp('10%'),
      },
      android: {
        marginTop: -hp('8%'),
      }
    })
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.92,
  },
  headerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('12%'),
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: wp('8.5%'),
    fontWeight: '800',
    color: 'colors.BACKGROUND_MAIN',
    textShadowColor: 'colors.SHADOW_TEXT_LIGHT',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: wp('4.2%'),
    color: 'colors.BACKGROUND_MAIN',
    marginTop: hp('0.5%'),
    marginBottom: hp('2.5%'),
    textShadowColor: 'colors.SHADOW_TEXT_LIGHT',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
  searchBarContainer: {
    marginBottom: hp('3.5%'),
    width: '100%',
  },
  searchBar: {
    elevation: 8,
    borderRadius: 30,
    height: hp('6.5%'),
    borderWidth: 1,
    borderColor: colors.PRIMARY_TRANSPARENT_MEDIUM,
    shadowColor: colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    backgroundColor: colors.WHITE_TRANSPARENT_LIGHT,
  },
  searchInput: {
    fontSize: wp('3.8%'),
    color: colors.TEXT_SECONDARY,
  },
  productsContainer: {
    flex: 1,
    marginTop: hp('1.8%'),
    paddingTop: 0,
    backgroundColor: colors.BACKGROUND_MAIN,
    zIndex: 0,
  },
  listContent: {
    paddingHorizontal: wp('2.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('15%'),
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.BACKGROUND_SECONDARY,
    padding: wp('5%'),
  },
  loadingText: {
    marginTop: hp('2%'),
    color: colors.TEXT_SECONDARY,
    fontSize: wp('4%'),
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: wp('5%'),
  },
  loginButton: {
    marginTop: hp('2.5%'),
    backgroundColor: colors.PRIMARY_DARK,
    borderRadius: 30,
    paddingVertical: hp('0.5%'),
    elevation: 3,
  },
  buttonLabel: {
    fontSize: wp('3.8%'),
    paddingVertical: hp('0.5%'),
    letterSpacing: 0.5,
  },
  retryButton: {
    marginTop: hp('2.5%'),
    backgroundColor: colors.PRIMARY_DARK,
    borderRadius: 30,
    paddingVertical: hp('0.5%'),
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.BACKGROUND_SECONDARY,
    padding: wp('8%'),
  },
  emptyIconContainer: {
    width: wp('28%'),
    height: wp('28%'),
    borderRadius: wp('14%'),
    backgroundColor: colors.PRIMARY_TRANSPARENT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('3.5%'),
    shadowColor: colors.PRIMARY_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  emptyText: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('1.5%'),
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: wp('4%'),
    color: colors.TEXT_LIGHT,
    textAlign: 'center',
    marginBottom: hp('3.5%'),
    lineHeight: wp('6%'),
    letterSpacing: 0.1,
  },
  browseButton: {
    backgroundColor: colors.PRIMARY_DARK,
    borderRadius: 30,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('0.8%'),
    elevation: 3,
    shadowColor: colors.TEXT_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  productCard: {
    width: '48.5%',
    marginBottom: wp('3%'),
    backgroundColor: colors.BACKGROUND_CARD,
    borderWidth: 0,
    borderRadius: wp('3%'),
    ...Platform.select({
      ios: {
        shadowColor: colors.TEXT_DARK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      }
    })
  },
  productImageContainer: {
    position: 'relative',
    borderTopLeftRadius: wp('3%'),
    borderTopRightRadius: wp('3%'),
    height: wp('58%'),
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  productImage: {
    height: wp('58%'),
    width: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: wp('3%'),
    paddingTop: wp('2.5%'),
    backgroundColor: colors.BACKGROUND_MAIN,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '600',
    marginBottom: hp('0.8%'),
    color: colors.TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
  productLocation: {
    fontSize: wp('3.3%'),
    color: colors.TEXT_SECONDARY,
    marginBottom: hp('0.6%'),
    letterSpacing: 0.1,
  },
  productDate: {
    fontSize: wp('3.1%'),
    color: colors.TEXT_MUTED,
    letterSpacing: 0.1,
  },
  removeButton: {
    position: 'absolute',
    top: wp('3%'),
    right: wp('3%'),
    backgroundColor: colors.PRIMARY_DARK + 'D9',
    borderRadius: wp('6%'),
    width: wp('11%'),
    height: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    shadowColor: colors.TEXT_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  priceTag: {
    position: 'absolute',
    bottom: wp('3%'),
    left: wp('3%'),
    backgroundColor: colors.WHITE_TRANSPARENT_HEAVY,
    borderRadius: 20,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.7%'),
    zIndex: 5,
    shadowColor: colors.TEXT_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  priceTagText: {
    fontSize: wp('3.8%'),
    fontWeight: 'bold',
    color: colors.PRIMARY_DARK,
    letterSpacing: 0.2,
  },
  noResultsContainer: {
    padding: wp('10%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: wp('4%'),
    color: colors.TEXT_LIGHT,
    textAlign: 'center',
    marginTop: hp('2%'),
  },
  imageErrorContainer: {
    height: wp('58%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.BACKGROUND_LIGHT,
  },
  imageErrorText: {
    fontSize: wp('3.2%'),
    color: colors.PRIMARY_DARK,
    marginTop: hp('1%'),
    letterSpacing: 0.1,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE_TRANSPARENT_LIGHT,
  },
});