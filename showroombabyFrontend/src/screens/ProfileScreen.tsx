import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Avatar, Text, Divider, List, Button, Card } from 'react-native-paper';
import AuthService from '../services/auth';
import { Props } from '../types/navigation';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://127.0.0.1:8000';

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

// Constantes
const DEFAULT_IMAGE_URL = 'https://placehold.co/400x300/f8bbd0/ffffff?text=Showroom+Baby';

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState(AuthService.getUser());
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProducts();
  }, []);

  const loadUserProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour voir vos annonces');
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/me/products`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.data) {
        const products = response.data.data || response.data;
        setUserProducts(Array.isArray(products) ? products : []);
        
        console.log('Produits chargés:', products);
      }
    } catch (error: any) {
      console.error('Erreur détaillée:', error.response || error);
      
      let message = 'Impossible de charger vos annonces';
      if (error.code === 'ECONNABORTED') {
        message = 'Le chargement prend trop de temps. Veuillez réessayer.';
      } else if (error.response?.status === 404) {
        setUserProducts([]);
        message = 'Vous n\'avez pas encore publié d\'annonces';
      } else if (error.response?.status === 401) {
        message = 'Session expirée. Veuillez vous reconnecter.';
        navigation.navigate('Auth');
      }
      
      if (error.response?.status !== 404) {
        Alert.alert('Erreur', message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
    }, 10000);

    loadUserProducts().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Confirmation de déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AuthService.logout();
              
              Alert.alert(
                'Déconnexion réussie',
                'Vous avez été déconnecté avec succès.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }],
                      });
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} €`;
  };

  const getProductImage = (product: Product) => {
    // Image par défaut si pas d'images
    if (!product.images) {
      return require('../../assets/placeholder.png');
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
      console.error('Erreur traitement image:', e);
    }
    
    // Image par défaut en cas d'échec
    return require('../../assets/placeholder.png');
  };

  const handleDeleteProduct = async (productId: number) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Êtes-vous sûr de vouloir supprimer cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              setUserProducts(prevProducts => 
                prevProducts.filter(product => product.id !== productId)
              );
              
              Alert.alert('Succès', 'Annonce supprimée avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'annonce');
            }
          }
        }
      ]
    );
  };

  // Composant de produit dans le profil
  const ProductItemCard = React.memo(({ product, onDelete, onEdit }: { 
    product: Product; 
    onDelete: (id: number) => void; 
    onEdit: (id: number) => void;
  }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    
    return (
      <Card style={styles.productCard} key={product.id}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
        >
          <View style={styles.productImageContainer}>
            {imageLoading && (
              <ActivityIndicator 
                size="small" 
                color="#E75A7C" 
                style={styles.imageLoader} 
              />
            )}
            {imageError && (
              <View style={styles.imageErrorContainer}>
                <Ionicons name="image-outline" size={24} color="#E75A7C" />
                <Text style={styles.imageErrorText}>Image indisponible</Text>
              </View>
            )}
            <Card.Cover 
              source={getProductImage(product)} 
              style={styles.productImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </View>
          <Card.Content style={styles.productContent}>
            <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            {product.location && (
              <Text style={styles.productLocation} numberOfLines={1}>
                <Ionicons name="location-outline" size={14} color="#666" /> {product.location}
              </Text>
            )}
          </Card.Content>
        </TouchableOpacity>
        <Card.Actions style={styles.productActions}>
          <Button 
            mode="outlined" 
            onPress={() => onEdit(product.id)}
          >
            Modifier
          </Button>
          <Button 
            mode="outlined" 
            textColor="red"
            onPress={() => onDelete(product.id)}
          >
            Supprimer
          </Button>
        </Card.Actions>
      </Card>
    );
  });

  const renderProductItem = (product: Product) => (
    <ProductItemCard 
      product={product} 
      onDelete={handleDeleteProduct} 
      onEdit={(id) => navigation.navigate('AjouterProduit', { productId: id })}
    />
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#E75A7C']}
          tintColor="#E75A7C"
          progressBackgroundColor="#ffffff"
        />
      }
    >
      <View style={styles.header}>
        <Avatar.Text size={80} label={user?.name?.charAt(0) || 'U'} />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Divider />

      <List.Section>
        <List.Subheader>Mes annonces</List.Subheader>
        <View style={styles.productsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement de vos annonces...</Text>
          ) : userProducts.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Vous n'avez pas encore publié d'annonces
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('AjouterProduit')}
                style={styles.addButton}
              >
                Publier une annonce
              </Button>
            </View>
          ) : (
            userProducts.map(product => (
              <ProductItemCard 
                key={product.id}
                product={product} 
                onDelete={handleDeleteProduct} 
                onEdit={(id) => navigation.navigate('AjouterProduit', { productId: id })}
              />
            ))
          )}
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Paramètres du compte</List.Subheader>
        <List.Item
          title="Informations personnelles"
          left={props => <List.Icon {...props} icon="account" />}
          onPress={() => {}}
        />
        <List.Item
          title="Changer de mot de passe"
          left={props => <List.Icon {...props} icon="lock" />}
          onPress={() => {}}
        />
        <List.Item
          title="Adresses de livraison"
          left={props => <List.Icon {...props} icon="map-marker" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Mes favoris</List.Subheader>
        <List.Item
          title="Annonces sauvegardées"
          left={props => <List.Icon {...props} icon="heart" />}
          onPress={() => navigation.navigate('Favoris')}
        />
      </List.Section>

      <View style={styles.logoutContainer}>
        <Button mode="outlined" onPress={handleLogout} textColor="red">
          Se déconnecter
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  logoutContainer: {
    padding: 20,
    alignItems: 'center',
  },
  productsContainer: {
    padding: 16,
  },
  productCard: {
    marginBottom: 16,
    elevation: 2,
  },
  productImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 1,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  },
  imageErrorText: {
    fontSize: 14,
    color: '#E75A7C',
    marginTop: 8,
  },
  productImage: {
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productContent: {
    padding: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E75A7C',
    marginBottom: 4,
  },
  productLocation: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    justifyContent: 'space-between',
    padding: 8,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#E75A7C',
  },
}); 