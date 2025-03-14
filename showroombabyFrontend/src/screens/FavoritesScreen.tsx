import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Card, Button, Searchbar, Divider } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// URL de l'API
const API_URL = 'http://127.0.0.1:8000';

// Importer l'image placeholder directement
const placeholderImage = require('../../assets/placeholder.png');

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
      
      const response = await axios.get(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // L'API renvoie un tableau d'objets de favoris avec les produits imbriqués
      if (response.data && Array.isArray(response.data.data)) {
        // Format API: { data: [ { product: {...}, product_id: 1, ... }, ... ] }
        const extractedProducts = response.data.data
          .filter((favorite: Favorite) => favorite && favorite.product)
          .map((favorite: Favorite) => favorite.product);
        
        console.log('Produits favoris extraits:', extractedProducts.length);
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
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      setError('Impossible de charger vos favoris. Veuillez réessayer.');
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
      
      await axios.delete(`${API_URL}/api/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFavorites(favorites.filter(item => item.id !== productId));
      
      Alert.alert('Succès', 'Produit retiré des favoris');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du favori:', error);
      
      if (error.response && error.response.status === 404) {
        setFavorites(favorites.filter(item => item.id !== productId));
        Alert.alert('Information', 'Ce produit a déjà été retiré de vos favoris');
      } else {
        Alert.alert('Erreur', 'Impossible de retirer ce produit des favoris. Veuillez réessayer.');
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

  const getProductImage = (product: Product) => {
    if (!product.images) {
      return placeholderImage;
    }
    
    let imageUrl;
    
    if (typeof product.images === 'string') {
      try {
        // Tenter de parser si c'est une chaîne JSON
        const parsed = JSON.parse(product.images);
        imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      } catch (e) {
        // Si ce n'est pas un JSON valide, utiliser comme URL directe
        imageUrl = product.images;
      }
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      imageUrl = product.images[0];
    }
    
    if (imageUrl && typeof imageUrl === 'string') {
      if (imageUrl.startsWith('http')) {
        return { uri: imageUrl };
      } else {
        return { uri: `${API_URL}/storage/${imageUrl}` };
      }
    }
    
    return placeholderImage;
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

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Card>
        <Card.Cover source={getProductImage(item)} style={styles.productImage} />
        <Card.Content style={styles.cardContent}>
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{item.title}</Text>
            <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
            {item.location && (
              <Text style={styles.productLocation}>
                <Ionicons name="location-outline" size={14} color="#666" />
                {' '}{item.location}
              </Text>
            )}
            <Text style={styles.productDate}>Ajouté le {formatDate(item.created_at)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => confirmRemove(item.id, item.title)}
          >
            <Ionicons name="heart-dislike" size={24} color="#e75480" />
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const filteredProducts = favorites.filter(product => 
    product && product.title ? product.title.toLowerCase().includes(searchQuery.toLowerCase()) : false
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e75480" />
        <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
      </View>
    );
  }

  if (error && !token) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
        >
          Se connecter
        </Button>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={loadFavorites}
          style={styles.retryButton}
        >
          Réessayer
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Mes favoris</Text>
        <Searchbar
          placeholder="Rechercher dans vos favoris"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>
      
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Vous n'avez pas encore de favoris</Text>
          <Text style={styles.emptySubtext}>
            Ajoutez des produits à vos favoris pour les retrouver facilement
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Home')}
            style={styles.browseButton}
          >
            Parcourir les produits
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#e75480']}
              tintColor="#e75480"
            />
          }
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  Aucun résultat pour "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

// Récupérer le token AsyncStorage
const token = AsyncStorage.getItem('token');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('1%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: '600',
    marginBottom: hp('2%'),
  },
  searchBar: {
    marginBottom: hp('2%'),
    borderRadius: 30,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: hp('2%'),
    color: '#666',
    fontSize: wp('4%'),
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#e75480',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#e75480',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: wp('4%'),
  },
  emptyText: {
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#e75480',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  productCard: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  productImage: {
    height: wp('50%'),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: wp('3%'),
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: wp('4%'),
    fontWeight: '500',
    marginBottom: hp('0.5%'),
  },
  productPrice: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#ff6b9b',
    marginBottom: hp('0.5%'),
  },
  productLocation: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  productDate: {
    fontSize: wp('3%'),
    color: '#999',
  },
  removeButton: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: wp('6%'),
    padding: wp('2%'),
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 