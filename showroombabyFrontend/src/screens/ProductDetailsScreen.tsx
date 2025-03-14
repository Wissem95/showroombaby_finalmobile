import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Share, ActivityIndicator, Alert } from 'react-native';
import { Button, Text, Card, Chip, Divider, IconButton, Dialog, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/auth';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// URL de l'API
const API_URL = 'http://127.0.0.1:8000';

// Importer l'image placeholder directement
const placeholderImage = require('../../assets/placeholder.png');

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
  images?: string | string[] | { path: string; url?: string }[] | any[] | null;
  is_trending?: boolean | number;
  is_featured?: boolean | number;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigationNative = useNavigation();

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
        const response = await axios.get(`${API_URL}/api/products/${productId}`);
        
        if (response.data) {
          const productData = response.data.data || response.data;
          setProduct(productData);
          
          // Utiliser d'abord les données du vendeur incluses dans la réponse du produit
          if (productData.seller) {
            setSeller(productData.seller);
          } 
          // Si le vendeur n'est pas inclus, essayer de l'obtenir par API
          else if (productData.user_id) {
            try {
              const token = await AsyncStorage.getItem('token');
              
              if (!token) {
                // Créer un vendeur minimal sans appeler l'API si pas de token
                setSeller({
                  id: productData.user_id,
                  name: "Utilisateur",
                });
                return;
              }
              
              // Utiliser la route correcte pour récupérer les informations du vendeur
              // D'après l'API, la route correcte pourrait être /api/users/profile pour l'utilisateur courant
              // Comme il n'y a pas de route spécifique pour obtenir un autre utilisateur, nous créons un vendeur minimal
              setSeller({
                id: productData.user_id,
                name: `Vendeur #${productData.user_id}`,
              });
            } catch (sellerError) {
              console.error('Erreur lors du chargement des informations du vendeur:', sellerError);
              // Créer un vendeur minimal avec l'ID uniquement
              setSeller({
                id: productData.user_id,
                name: "Utilisateur",
              });
            }
          }
        } else {
          setError('Produit non trouvé');
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement du produit:', error);
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
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.log('Utilisateur non connecté, impossible de vérifier les favoris');
          return;
        }
        
        // Utiliser l'API pour récupérer la liste complète des favoris
        const response = await axios.get(`${API_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Vérifier si le produit actuel est dans la liste des favoris
        let isFavorite = false;
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Format API: { data: [ { product_id: 1, ... }, ... ] }
          isFavorite = response.data.data.some((fav: any) => fav.product_id == productId);
        } else if (response.data && Array.isArray(response.data)) {
          // Format alternatif: [ { product_id: 1, ... }, ... ]
          isFavorite = response.data.some((fav: any) => fav.product_id == productId);
        }
        
        setFavorite(isFavorite);
      } catch (error: any) {
        console.error('Erreur lors de la vérification des favoris:', error);
        setFavorite(false);
      }
    };

    if (productId) {
      checkIfFavorite();
    }
  }, [productId]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

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

  // Fonction pour ajouter/supprimer le produit des favoris
  const handleFavorite = async () => {
    if (!product) return;
    
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      setLoginDialogVisible(true);
      return;
    }
    
    try {
      if (favorite) {
        // Supprimer des favoris
        await axios.delete(`${API_URL}/api/favorites/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorite(false);
        Alert.alert('Succès', 'Produit retiré des favoris');
      } else {
        // Ajouter aux favoris
        await axios.post(`${API_URL}/api/favorites/${product.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorite(true);
        Alert.alert('Succès', 'Produit ajouté aux favoris');
      }
    } catch (error: any) {
      console.error('Erreur lors de la gestion des favoris:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Erreur', 'Vous devez être connecté pour gérer vos favoris');
          setLoginDialogVisible(true);
        } else if (error.response.status === 422) {
          // Le produit est déjà dans les favoris
          setFavorite(true);
          Alert.alert('Information', 'Ce produit est déjà dans vos favoris');
        } else if (error.response.status === 404) {
          // Le produit n'est plus dans les favoris
          setFavorite(false);
          Alert.alert('Information', 'Ce produit a déjà été retiré des favoris');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la gestion des favoris');
        }
      } else {
        Alert.alert('Erreur', 'Impossible de se connecter au serveur');
      }
    }
  };

  // Fonction pour contacter le vendeur
  const handleContact = async () => {
    if (!product) return;
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour contacter le vendeur',
        [
          { 
            text: 'Se connecter', 
            onPress: () => navigation.navigate('Auth')
          },
          {
            text: 'Annuler',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    navigation.navigate('Chat', { 
      receiverId: product.user_id,
      productId: product.id,
      productTitle: product.title
    });
  };

  // Obtenir l'image principale d'un produit
  const getProductImage = (product: Product | null) => {
    if (!product || !product.images) {
      console.log('Produit sans images, utilisation du placeholder');
      return placeholderImage;
    }
    
    try {
      console.log(`Produit ${product.id}: format des images:`, typeof product.images, product.images);
      
      // Si les images sont stockées sous forme de chaîne JSON
      if (typeof product.images === 'string') {
        try {
          const parsedImages = JSON.parse(product.images);
          console.log(`Produit ${product.id}: images JSON parsées:`, parsedImages);
          
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            // Vérifier si l'image contient un chemin complet ou juste un nom de fichier
            const imageUrl = parsedImages[0].includes('http') 
              ? parsedImages[0] 
              : `${API_URL}/storage/${parsedImages[0]}`;
            
            console.log(`Produit ${product.id}: URL d'image utilisée:`, imageUrl);
            return { uri: imageUrl };
          }
        } catch (e) {
          // Si ce n'est pas un JSON valide, on utilise directement la chaîne
          const imageUrl = product.images.includes('http') 
            ? product.images 
            : `${API_URL}/storage/${product.images}`;
          
          console.log(`Produit ${product.id}: URL d'image directe utilisée:`, imageUrl);
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
            
            console.log(`Produit ${product.id}: URL depuis path:`, imageUrl);
            return { uri: imageUrl };
          } else if (product.images[0].url) {
            console.log(`Produit ${product.id}: URL depuis url:`, product.images[0].url);
            return { uri: product.images[0].url };
          } else {
            // Essayer de récupérer directement la première valeur
            const firstImage = product.images[0];
            console.log(`Produit ${product.id}: Premier élément du tableau:`, firstImage);
            
            if (typeof firstImage === 'string') {
              const imageUrl = firstImage.includes('http') 
                ? firstImage 
                : `${API_URL}/storage/${firstImage}`;
              
              console.log(`Produit ${product.id}: URL du premier élément:`, imageUrl);
              return { uri: imageUrl };
            }
          }
        } else if (typeof product.images[0] === 'string') {
          // Si c'est un tableau de chaînes
          const imageUrl = product.images[0].includes('http') 
            ? product.images[0] 
            : `${API_URL}/storage/${product.images[0]}`;
          
          console.log(`Produit ${product.id}: URL d'image du tableau:`, imageUrl);
          return { uri: imageUrl };
        }
      }
    } catch (error) {
      console.error(`Produit ${product.id}: Erreur lors du traitement de l'image:`, error);
    }
    
    console.log(`Produit ${product.id}: Aucune image valide trouvée, utilisation du placeholder`);
    return placeholderImage;
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
      <View style={styles.imageContainer}>
        <Image 
          source={getProductImage(product)} 
          style={styles.image}
          resizeMode="cover"
          defaultSource={placeholderImage}
          onError={() => console.log(`Erreur de chargement de l'image pour le produit ${product.id}`)}
        />
      </View>
      
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

      <View style={styles.actionButtons}>
        <Button 
          mode="contained" 
          style={[styles.actionButton, styles.contactButton]}
          onPress={handleContact}
        >
          Contacter le vendeur
        </Button>
        <Button 
          mode="outlined" 
          style={styles.actionButton}
          onPress={handleFavorite}
        >
          {favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
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
              navigationNative.navigate('Connexion');
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
  imageContainer: {
    height: 300,
    backgroundColor: '#e1e1e1',
  },
  image: {
    width: '100%',
    height: '100%',
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
  actionButtons: {
    padding: wp('4%'),
    gap: hp('2%'),
  },
  actionButton: {
    borderRadius: 25,
  },
  contactButton: {
    backgroundColor: '#ff6b9b',
  },
}); 