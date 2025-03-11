import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Share, ActivityIndicator } from 'react-native';
import { Button, Text, Card, Chip, Divider, IconButton, Dialog, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/auth';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:8000/api';

// Interface du produit (similaire à celle de ExploreScreen)
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
  images?: string | null; // Peut contenir un JSON stringifié d'URLs
  is_trending?: boolean;
  is_featured?: boolean;
  user_id: number;
}

// Interface pour l'utilisateur vendeur
interface Seller {
  id: number;
  name: string;
  email?: string;
  username?: string;
  avatar?: string | null;
  rating?: number;
}

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { productId } = route.params || {};
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [loginDialogVisible, setLoginDialogVisible] = useState(false);

  // Charger les détails du produit
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!productId && route.params?.product) {
        // Si le produit est déjà disponible dans les paramètres
        setProduct(route.params.product);
        
        // Utiliser les données du vendeur du produit si disponibles
        if (route.params.product.seller) {
          setSeller(route.params.product.seller);
        }
        
        setLoading(false);
        return;
      }
      
      if (!productId) {
        setError('Identifiant de produit manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products/${productId}`);
        
        if (response.data) {
          const productData = response.data.data || response.data;
          setProduct(productData);
          
          // Utiliser d'abord les données du vendeur incluses dans la réponse du produit
          if (productData.seller) {
            setSeller(productData.seller);
          } 
          // Si le vendeur n'est pas inclus, essayer de l'obtenir par API (uniquement profile)
          else if (productData.user_id) {
            // Vérifier si l'utilisateur est authentifié avant d'appeler l'API
            if (AuthService.isAuthenticated()) {
              try {
                const token = await AsyncStorage.getItem('token');
                const sellerResponse = await axios.get(`${API_URL}/users/profile`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (sellerResponse.data) {
                  setSeller(sellerResponse.data);
                }
              } catch (sellerError) {
                console.error('Erreur lors du chargement des informations du vendeur:', sellerError);
                // Créer un vendeur minimal avec l'ID uniquement
                setSeller({
                  id: productData.user_id,
                  name: "Vendeur",
                });
              }
            } else {
              // Si l'utilisateur n'est pas connecté, utiliser directement les infos minimales
              setSeller({
                id: productData.user_id,
                name: "Vendeur",
              });
            }
          }
        } else {
          setError('Produit non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails du produit:', error);
        setError('Impossible de charger les détails du produit');
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [productId, route.params]);

  // Vérifier si le produit est en favori
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!product || !AuthService.isAuthenticated()) return;
      
      try {
        // Au lieu de chercher un favori par ID de produit, regardons la liste des favoris
        const response = await axios.get(`${API_URL}/favorites`, {
          headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` }
        });
        
        // Chercher si ce produit est dans les favoris
        const favorites = response.data.data || [];
        const isFavorite = favorites.some((fav: any) => 
          fav.product_id === product.id || 
          (fav.product && fav.product.id === product.id)
        );
        
        setFavorite(isFavorite);
      } catch (error) {
        console.error('Erreur lors de la vérification des favoris:', error);
        // Ne pas modifier l'état du favori en cas d'erreur
      }
    };

    checkIfFavorite();
  }, [product]);

  // Fonction pour partager le produit
  const handleShare = async () => {
    if (!product) return;
    
    try {
      await Share.share({
        message: `Découvrez ${product.title} à ${product.price}€ sur Showroom Baby!`,
        title: product.title,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  // Fonction pour ajouter le produit aux favoris
  const handleFavorite = async () => {
    if (!product) return;
    
    if (!AuthService.isAuthenticated()) {
      setLoginDialogVisible(true);
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (favorite) {
        // Supprimer des favoris
        await axios.delete(`${API_URL}/favorites/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorite(false);
      } else {
        // Ajouter aux favoris
        await axios.post(`${API_URL}/favorites/${product.id}`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorite(true);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        // Le produit est déjà dans les favoris
        setFavorite(true);
      } else {
        console.error('Erreur lors de la gestion des favoris:', error);
      }
    }
  };

  // Fonction pour contacter le vendeur
  const handleContact = () => {
    if (!product) return;
    
    if (!AuthService.isAuthenticated()) {
      setLoginDialogVisible(true);
      return;
    }
    
    // Navigation vers l'écran de messagerie
    navigation.navigate('Chat', { 
      productId: product.id,
      sellerId: product.user_id,
      productTitle: product.title
    });
  };

  // Obtenir l'image principale d'un produit
  const getProductImage = (product: Product | null) => {
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
  
  // Traduire la condition du produit
  const getConditionLabel = (condition: string) => {
    const conditions: Record<string, string> = {
      'NEW': 'Neuf',
      'LIKE_NEW': 'Comme neuf',
      'GOOD': 'Bon état',
      'FAIR': 'État correct'
    };
    return conditions[condition] || condition;
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    if (price === undefined || price === null) {
      return '0.00 €';
    }
    return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ') + ' €';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Produit non disponible'}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          Retour
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: getProductImage(product) }} 
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>{product.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <View style={styles.actions}>
            <IconButton
              icon={favorite ? "heart" : "heart-outline"}
              iconColor={favorite ? "#e74c3c" : "#000"}
              size={24}
              onPress={handleFavorite}
            />
            <IconButton
              icon="share-variant"
              size={24}
              onPress={handleShare}
            />
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails</Text>
        <View style={styles.chipsContainer}>
          <Chip style={styles.chip} icon="tag">Catégorie {product.category_id}</Chip>
          <Chip style={styles.chip} icon="package-variant">{getConditionLabel(product.condition)}</Chip>
          {(product.city || product.location) && (
            <Chip style={styles.chip} icon="map-marker">{product.city || product.location}</Chip>
          )}
          <Chip style={styles.chip} icon="eye-outline">{product.view_count} vues</Chip>
        </View>
      </View>

      {seller && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendeur</Text>
            <View style={styles.sellerContainer}>
              {seller.avatar ? (
                <Image source={{ uri: seller.avatar }} style={styles.sellerAvatar} />
              ) : (
                <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                  <Text style={styles.sellerAvatarText}>{(seller.name || seller.username || '?')[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{seller.name || seller.username}</Text>
                {seller.rating !== undefined && (
                  <View style={styles.ratingContainer}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons 
                        key={i} 
                        name={i < Math.floor(seller.rating || 0) ? "star" : i < (seller.rating || 0) ? "star-half-outline" : "star-outline"} 
                        size={16} 
                        color="#FFA000" 
                        style={styles.starIcon}
                      />
                    ))}
                    <Text style={styles.ratingText}>{seller.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          style={styles.contactButton}
          onPress={handleContact}
          icon="message-text"
        >
          Contacter le vendeur
        </Button>
      </View>

      {/* Dialogue pour suggérer la connexion */}
      <Portal>
        <Dialog visible={loginDialogVisible} onDismiss={() => setLoginDialogVisible(false)}>
          <Dialog.Title>Connexion requise</Dialog.Title>
          <Dialog.Content>
            <Text>Vous devez être connecté pour effectuer cette action.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLoginDialogVisible(false)}>Annuler</Button>
            <Button onPress={() => {
              setLoginDialogVisible(false);
              navigation.navigate('Connexion');
            }}>Se connecter</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 10,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#e1e1e1',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  actions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sellerInfo: {
    marginLeft: 15,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  contactButton: {
    paddingVertical: 8,
  },
}); 