import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/auth';

const API_URL = 'http://127.0.0.1:8000/api';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  category_id: number;
  city?: string;
  location?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  images?: string | null;
  is_trending?: boolean;
  is_featured?: boolean;
}

interface Favorite {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  updated_at: string;
  product: Product;
}

export default function FavoritesScreen({ navigation }: any) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  // Fonction pour charger les favoris
  const loadFavorites = async () => {
    if (!AuthService.isAuthenticated()) {
      setLoading(false);
      setError('Vous devez être connecté pour voir vos favoris');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.data) {
        setFavorites(response.data.data);
      } else {
        setFavorites([]);
      }
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des favoris:', err);
      setError('Impossible de charger vos favoris');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un favori
  const removeFavorite = async (productId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${API_URL}/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour la liste des favoris
      setFavorites(favorites.filter(fav => fav.product_id !== productId));
    } catch (err) {
      console.error('Erreur lors de la suppression du favori:', err);
    }
  };

  // Obtenir l'image principale d'un produit
  const getProductImage = (product: Product) => {
    if (!product) return 'https://via.placeholder.com/500?text=Produit';
    
    if (product.images) {
      try {
        // Essayer de parser le JSON s'il est stocké comme une chaîne
        const parsedImages = JSON.parse(product.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          return parsedImages[0];
        }
      } catch (e) {
        // Si ce n'est pas un JSON valide, utiliser comme URL directe
        return product.images;
      }
    }
    // Image par défaut si aucune n'est disponible
    return `https://via.placeholder.com/500?text=${encodeURIComponent(product.title)}`;
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    if (price === undefined || price === null) {
      return '0.00 €';
    }
    return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ') + ' €';
  };

  // Rendu d'un élément favori
  const renderFavoriteItem = ({ item }: { item: Favorite }) => (
    <Card style={styles.favoriteCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetails', { productId: item.product_id })}
      >
        <Card.Cover 
          source={{ uri: getProductImage(item.product) }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <Card.Content style={styles.productContent}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.product.title}
          </Text>
          <Text style={styles.productPrice}>
            {formatPrice(item.product.price)}
          </Text>
          {item.product.city && (
            <Text style={styles.productLocation} numberOfLines={1}>
              {item.product.city || item.product.location}
            </Text>
          )}
        </Card.Content>
      </TouchableOpacity>
      <Card.Actions style={styles.cardActions}>
        <Button
          icon={() => <Ionicons name="trash-outline" size={20} color="#FF6B6B" />}
          mode="text"
          textColor="#FF6B6B"
          onPress={() => removeFavorite(item.product_id)}
        >
          Supprimer
        </Button>
      </Card.Actions>
    </Card>
  );

  // Affichage en fonction de l'état
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6b9b" />
        <Text style={styles.messageText}>Chargement de vos favoris...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b9b" />
        <Text style={styles.errorText}>{error}</Text>
        {!AuthService.isAuthenticated() && (
          <Button 
            mode="contained" 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Connexion')}
          >
            Se connecter
          </Button>
        )}
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="heart-outline" size={48} color="#ff6b9b" />
        <Text style={styles.messageText}>Vous n'avez pas encore de favoris</Text>
        <Button 
          mode="contained" 
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Explore')}
        >
          Explorer les produits
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Favoris</Text>
      <Divider style={styles.divider} />
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  favoriteCard: {
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  productImage: {
    height: 180,
  },
  productContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b9b',
    marginBottom: 4,
  },
  productLocation: {
    fontSize: 14,
    color: '#777',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
  errorText: {
    color: '#f44336',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    color: '#555',
  },
  loginButton: {
    marginTop: 16,
    backgroundColor: '#ff6b9b',
  },
  exploreButton: {
    marginTop: 16,
    backgroundColor: '#ff6b9b',
  },
}); 