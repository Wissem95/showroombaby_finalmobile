import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Image, Share, ActivityIndicator, Alert, Dimensions, TouchableOpacity, Linking, Animated } from 'react-native';
import { Button, Text, Card, Chip, Divider, IconButton, Dialog, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/auth';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Carousel from 'react-native-reanimated-carousel';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

// URL de l'API
const API_URL = 'http://127.0.0.1:8000';

// Importer l'image placeholder directement
const placeholderImage = require('../../assets/placeholder.png');

const { width: screenWidth } = Dimensions.get('window');

// Interface du produit (similaire à celle de ExploreScreen)
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  category_id: number;
  subcategory_id?: number;
  city?: string;
  location?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  images?: string | string[] | { path: string; url?: string }[] | any[] | null;
  is_trending?: boolean | number;
  is_featured?: boolean | number;
  user_id: number;
  size?: string;
  color?: string;
  warranty?: string;
  phone?: string;
  hide_phone?: boolean;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  brand?: string;
  model?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
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

interface Category {
  id: number;
  name: string;
  subcategories?: { id: number; name: string }[];
}

interface ImageType {
  path?: string;
  url?: string;
}

// Styles pour le carrousel d'images
const carouselStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    position: 'relative',
    overflow: 'hidden',
  },
  item: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
    width: '100%',
    zIndex: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
    margin: 5,
    top: 20,
  },
  productInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 3,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  productPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  publishDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButton: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    margin: 4,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(107, 60, 233, 0.15)',
    transform: [{ scale: 1.05 }],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  swipeText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});

const ImageCarousel = ({ images, navigation, product }: { images: string[], navigation: any, product: Product }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});
  const [favorite, setFavorite] = useState(false);
  
  // Animation pour l'indicateur de swipe
  const swipeAnim = useRef(new Animated.Value(0)).current;
  
  // Nouvelle animation pour la transition
  const transitionAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animation de l'indicateur de swipe
    Animated.loop(
      Animated.sequence([
        Animated.timing(swipeAnim, {
          toValue: 10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(swipeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Fonction pour animer la transition
  const animateTransition = () => {
    // Démarrer l'animation de transition
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      // Une fois l'animation terminée, naviguer vers la vue détaillée
      navigation.setParams({ fullscreenMode: false });
    });
  };

  // Gérer le geste de swipe vertical
  const onGestureEvent = (event: { nativeEvent: { translationY: number } }) => {
    const { translationY } = event.nativeEvent;
    if (translationY > 100) {
      console.log('Swipe détecté - transition vers les détails');
      animateTransition();
    }
  };

  // Gérer le changement d'état du geste
  const onHandlerStateChange = (event: { nativeEvent: { oldState: number; translationY: number } }) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY } = event.nativeEvent;
      if (translationY > 100) {
        console.log('Fin de swipe - transition vers les détails');
        animateTransition();
      }
    }
  };

  // Fonction pour formater le prix spécifique au composant
  const formatProductPrice = (price: number) => {
    if (price === undefined || price === null) {
      return '0 €';
    }
    return `${price}€`;
  };

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

  if (!images || images.length === 0) {
    console.log('ImageCarousel - Aucune image, affichage du placeholder');
    return (
      <View style={carouselStyles.container}>
        <View style={carouselStyles.item}>
          <Image
            source={placeholderImage}
            style={carouselStyles.image}
            resizeMode="cover"
          />
          <View style={carouselStyles.overlay} />
        </View>
        
        <View style={carouselStyles.headerBar}>
          <TouchableOpacity 
            style={carouselStyles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={carouselStyles.productInfoOverlay}>
          <Text style={carouselStyles.productTitle}>{product.title}</Text>
          <Text style={carouselStyles.productPrice}>{formatProductPrice(product.price)}</Text>
          <Text style={carouselStyles.publishDate}>
            Publié le {new Date(product.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        
        <View style={carouselStyles.actionsBar}>
          <TouchableOpacity 
            style={carouselStyles.actionButton}
            onPress={async () => {
              if (product && product.phone) {
                Linking.openURL(`tel:${product.phone}`);
              } else if (product && product.user_id) {
                try {
                  // Vérifier si l'utilisateur essaie de s'envoyer un message à lui-même
                  const userId = await AsyncStorage.getItem('userId');
                  const currentUserId = userId ? parseInt(userId) : null;
                  
                  if (currentUserId && currentUserId === product.user_id) {
                    Alert.alert("Information", "Vous ne pouvez pas vous envoyer un message à vous-même");
                    return;
                  }
                  
                  navigation.navigate('Chat', {
                    receiverId: product.user_id,
                    productId: product.id,
                    productTitle: product.title
                  });
                } catch (error) {
                  console.error("Erreur lors de la vérification de l'ID utilisateur:", error);
                  Alert.alert("Erreur", "Impossible de contacter le vendeur pour le moment");
                }
              } else {
                Alert.alert("Information", "Aucun numéro de téléphone disponible pour ce produit");
              }
            }}
          >
            <Ionicons name="call-outline" size={26} color="#777" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={carouselStyles.actionButton}
            onPress={async () => {
              if (product && product.user_id) {
                try {
                  // Vérifier si l'utilisateur essaie de s'envoyer un message à lui-même
                  const userId = await AsyncStorage.getItem('userId');
                  const currentUserId = userId ? parseInt(userId) : null;
                  
                  if (currentUserId && currentUserId === product.user_id) {
                    Alert.alert("Information", "Vous ne pouvez pas vous envoyer un message à vous-même");
                    return;
                  }
                  
                  navigation.navigate('Chat', {
                    receiverId: product.user_id,
                    productId: product.id,
                    productTitle: product.title
                  });
                } catch (error) {
                  console.error("Erreur lors de la vérification de l'ID utilisateur:", error);
                  Alert.alert("Erreur", "Impossible de contacter le vendeur pour le moment");
                }
              } else {
                Alert.alert("Erreur", "Impossible de contacter le vendeur");
              }
            }}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#777" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              carouselStyles.actionButton, 
              favorite && carouselStyles.actionButtonActive
            ]}
            onPress={() => setFavorite(!favorite)}
          >
            <Ionicons 
              name={favorite ? "heart" : "heart-outline"} 
              size={26} 
              color={favorite ? "#e74c3c" : "#777"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={carouselStyles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={26} color="#777" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: string }) => {
    const imageUrl = typeof item === 'string' && item.startsWith('http') 
      ? item 
      : typeof item === 'string'
        ? `${API_URL}/storage/${item}`
        : placeholderImage;

    return (
      <View style={carouselStyles.item}>
        {imageLoadError[imageUrl] ? (
          <View style={carouselStyles.errorContainer}>
            <Image
              source={placeholderImage}
              style={[carouselStyles.image, { opacity: 0.7 }]}
              resizeMode="cover"
            />
            <Text style={carouselStyles.errorText}>Image non disponible</Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={carouselStyles.image}
              resizeMode="cover"
              defaultSource={placeholderImage}
              onError={(error) => {
                console.log('ImageCarousel - Erreur de chargement image:', {
                  url: imageUrl,
                  error: error.nativeEvent.error
                });
                setImageLoadError(prev => ({ ...prev, [imageUrl]: true }));
              }}
            />
            <View style={carouselStyles.overlay} />
          </>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TouchableOpacity 
        activeOpacity={1}
        style={{ flex: 1 }}
        onPress={() => console.log('Tap sur le carrousel')}
        onLongPress={() => console.log('Long press sur le carrousel')}
        delayLongPress={250}
      >
        <Animated.View style={[
          carouselStyles.container,
          {
            transform: [
              {
                translateY: transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, screenWidth * 1.7]
                })
              },
              {
                scale: transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.9]
                })
              }
            ],
            opacity: transitionAnim.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 0.7, 0]
            })
          }
        ]}>
          <View style={carouselStyles.headerBar}>
            <TouchableOpacity 
              style={carouselStyles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Carousel
            loop
            width={screenWidth}
            height={screenWidth * 1.7}
            autoPlay={images.length > 1}
            data={images}
            scrollAnimationDuration={800}
            onSnapToItem={setActiveIndex}
            renderItem={renderItem}
            autoPlayInterval={4000}
            style={{ width: '100%' }}
          />
          
          {images.length > 1 && (
            <View style={carouselStyles.pagination}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    carouselStyles.paginationDot,
                    index === activeIndex && carouselStyles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
          
          <View style={carouselStyles.productInfoOverlay}>
            <Text style={carouselStyles.productTitle}>{product.title}</Text>
            <Text style={carouselStyles.productPrice}>{formatProductPrice(product.price)}</Text>
            <Text style={carouselStyles.publishDate}>
              Publié le {new Date(product.created_at).toLocaleDateString('fr-FR')}
            </Text>
            
            <TouchableOpacity 
              style={carouselStyles.swipeIndicator}
              onPress={animateTransition}
            >
              <Animated.View style={{ transform: [{ translateY: swipeAnim }] }}>
                <Ionicons name="chevron-down" size={24} color="#fff" />
              </Animated.View>
              <Text style={carouselStyles.swipeText}>Appuyer pour voir plus de détails</Text>
            </TouchableOpacity>
          </View>
          
          <View style={carouselStyles.actionsBar}>
            <TouchableOpacity 
              style={carouselStyles.actionButton}
              onPress={async () => {
                if (product && product.phone) {
                  Linking.openURL(`tel:${product.phone}`);
                } else if (product && product.user_id) {
                  try {
                    // Vérifier si l'utilisateur essaie de s'envoyer un message à lui-même
                    const userId = await AsyncStorage.getItem('userId');
                    const currentUserId = userId ? parseInt(userId) : null;
                    
                    if (currentUserId && currentUserId === product.user_id) {
                      Alert.alert("Information", "Vous ne pouvez pas vous envoyer un message à vous-même");
                      return;
                    }
                    
                    navigation.navigate('Chat', {
                      receiverId: product.user_id,
                      productId: product.id,
                      productTitle: product.title
                    });
                  } catch (error) {
                    console.error("Erreur lors de la vérification de l'ID utilisateur:", error);
                    Alert.alert("Erreur", "Impossible de contacter le vendeur pour le moment");
                  }
                } else {
                  Alert.alert("Information", "Aucun numéro de téléphone disponible pour ce produit");
                }
              }}
            >
              <Ionicons name="call-outline" size={26} color="#777" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={carouselStyles.actionButton}
              onPress={async () => {
                if (product && product.user_id) {
                  try {
                    // Vérifier si l'utilisateur essaie de s'envoyer un message à lui-même
                    const userId = await AsyncStorage.getItem('userId');
                    const currentUserId = userId ? parseInt(userId) : null;
                    
                    if (currentUserId && currentUserId === product.user_id) {
                      Alert.alert("Information", "Vous ne pouvez pas vous envoyer un message à vous-même");
                      return;
                    }
                    
                    navigation.navigate('Chat', {
                      receiverId: product.user_id,
                      productId: product.id,
                      productTitle: product.title
                    });
                  } catch (error) {
                    console.error("Erreur lors de la vérification de l'ID utilisateur:", error);
                    Alert.alert("Erreur", "Impossible de contacter le vendeur pour le moment");
                  }
                } else {
                  Alert.alert("Erreur", "Impossible de contacter le vendeur");
                }
              }}
            >
              <Ionicons name="chatbubble-outline" size={26} color="#777" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                carouselStyles.actionButton, 
                favorite && carouselStyles.actionButtonActive
              ]}
              onPress={() => setFavorite(!favorite)}
            >
              <Ionicons 
                name={favorite ? "heart" : "heart-outline"} 
                size={26} 
                color={favorite ? "#e74c3c" : "#777"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={carouselStyles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={26} color="#777" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { productId } = route.params || {};
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const navigationNative = useNavigation();

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/categories`);
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Obtenir le nom de la catégorie
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : `Catégorie ${categoryId}`;
  };

  // Obtenir le nom de la sous-catégorie
  const getSubcategoryName = (categoryId: number, subcategoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.subcategories) {
      const subcategory = category.subcategories.find(sc => sc.id === subcategoryId);
      return subcategory ? subcategory.name : `Sous-catégorie ${subcategoryId}`;
    }
    return `Sous-catégorie ${subcategoryId}`;
  };

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
  useFocusEffect(
    useCallback(() => {
      const checkIfFavorite = async () => {
        if (!productId) return;
        
        try {
          // D'abord vérifier le stockage local pour une réponse immédiate
          const localStatus = await AsyncStorage.getItem(`favorite_${productId}`);
          if (localStatus === 'true') {
            setFavorite(true);
            return;
          } else if (localStatus === 'false') {
            setFavorite(false);
            return;
          }
          
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
          
          // Sauvegarder le statut dans le stockage local pour les prochaines fois
          await AsyncStorage.setItem(`favorite_${productId}`, isFavorite ? 'true' : 'false');
        } catch (error: any) {
          console.error('Erreur lors de la vérification des favoris:', error);
          setFavorite(false);
        }
      };

      checkIfFavorite();
      
      return () => {
        // Nettoyage si nécessaire
      };
    }, [productId])
  );

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
        
        // Mettre à jour le statut du favori dans le stockage local
        await AsyncStorage.setItem('favoritesChanged', 'true');
        await AsyncStorage.setItem(`favorite_${product.id}`, 'false');
        
        Alert.alert('Succès', 'Produit retiré des favoris');
      } else {
        // Ajouter aux favoris
        await axios.post(`${API_URL}/api/favorites/${product.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorite(true);
        
        // Mettre à jour le statut du favori dans le stockage local
        await AsyncStorage.setItem('favoritesChanged', 'true');
        await AsyncStorage.setItem(`favorite_${product.id}`, 'true');
        
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
          
          // Mettre à jour le statut du favori dans le stockage local
          await AsyncStorage.setItem('favoritesChanged', 'true');
          await AsyncStorage.setItem(`favorite_${product.id}`, 'true');
          
          Alert.alert('Information', 'Ce produit est déjà dans vos favoris');
        } else if (error.response.status === 404) {
          // Le produit n'est plus dans les favoris
          setFavorite(false);
          
          // Mettre à jour le statut du favori dans le stockage local
          await AsyncStorage.setItem('favoritesChanged', 'true');
          await AsyncStorage.setItem(`favorite_${product.id}`, 'false');
          
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
  const handleContactSeller = async () => {
    if (!product || !product.user_id) {
      Alert.alert("Erreur", "Impossible de contacter le vendeur");
      return;
    }
    
    // Récupérer l'ID de l'utilisateur connecté
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      setLoginDialogVisible(true);
      return;
    }
    
    try {
      // Récupérer l'ID de l'utilisateur depuis AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      const currentUserId = userId ? parseInt(userId) : null;
      
      if (currentUserId && currentUserId === product.user_id) {
        Alert.alert("Information", "Vous ne pouvez pas vous envoyer un message à vous-même");
        return;
      }
      
      console.log('Navigation vers Chat depuis ProductDetails:', {
        productId: product.id,
        productTitle: product.title,
        receiverId: product.user_id,
        currentUserId: currentUserId
      });
      
      navigation.navigate('Chat', {
        receiverId: product.user_id,
        productId: product.id,
        productTitle: product.title
      });
    } catch (error) {
      console.error("Erreur lors de la vérification de l'utilisateur:", error);
      Alert.alert("Erreur", "Impossible de contacter le vendeur pour le moment");
    }
  };

  // Obtenir l'image principale d'un produit
  const getProductImage = (product: Product | null): string[] => {
    if (!product || !product.images) {
      console.log('Produit sans images');
      return [];
    }

    try {
      // Si les images sont stockées sous forme de chaîne JSON
      if (typeof product.images === 'string') {
        try {
          const parsedImages = JSON.parse(product.images);
          if (Array.isArray(parsedImages)) {
            return parsedImages.map((img: ImageType | string) => {
              if (typeof img === 'string') {
                return img;
              }
              if (img && typeof img === 'object') {
                if (img.path) {
                  return img.path;
                }
                if (img.url) {
                  return img.url;
                }
              }
              return '';
            }).filter(Boolean);
          }
          // Si c'est une chaîne JSON mais pas un tableau
          return [product.images];
        } catch (e) {
          // Si ce n'est pas un JSON valide, utiliser directement la chaîne
          return [product.images];
        }
      }

      // Si c'est déjà un tableau
      if (Array.isArray(product.images)) {
        return product.images.map((img: ImageType | string) => {
          if (typeof img === 'string') {
            return img;
          }
          if (img && typeof img === 'object') {
            if (img.path) {
              return img.path;
            }
            if (img.url) {
              return img.url;
            }
          }
          return '';
        }).filter(Boolean);
      }

      // Si c'est un objet avec une propriété path ou url
      if (typeof product.images === 'object' && product.images !== null) {
        const img = product.images as ImageType;
        if (img.path) {
          return [img.path];
        }
        if (img.url) {
          return [img.url];
        }
      }

      console.log('Format d\'images non reconnu:', product.images);
      return [];
    } catch (error) {
      console.error('Erreur lors du traitement des images:', error);
      return [];
    }
  };
  
  // Traduire la garantie
  const getWarrantyLabel = (warranty: string) => {
    const warranties: Record<string, string> = {
      'no': 'Pas de garantie',
      '3_months': '3 mois',
      '6_months': '6 mois',
      '12_months': '12 mois',
      '24_months': '24 mois'
    };
    return warranties[warranty] || warranty;
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

  // Fonction pour obtenir les coordonnées à partir de l'adresse
  const getCoordinates = async (address: string) => {
    try {
      // Token Mapbox en dur
      const MAPBOX_TOKEN = 'pk.eyJ1Ijoid2lzc2VtOTUiLCJhIjoiY204bG52Z3cyMWQ5dTJrcXI2d210ZnY2ZSJ9.-xQ5BHlcU51dTyLmbHoXog';
      
      console.log("🔍 Appel géocodage Mapbox avec adresse:", address);
      const encodedAddress = encodeURIComponent(address);
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=fr&types=address,place,postcode&limit=1`;
      
      console.log("🌐 URL géocodage:", geocodingUrl);
      
      const response = await axios.get(geocodingUrl);
      
      console.log("✅ Réponse géocodage status:", response.status);
      
      if (response.data?.features?.length > 0 && response.data.features[0]?.center) {
        const center = response.data.features[0].center;
        // Mapbox renvoie les coordonnées dans l'ordre [longitude, latitude]
        console.log("📍 Coordonnées trouvées:", center);
        setLocation({ latitude: center[1], longitude: center[0] });
      } else {
        console.warn("⚠️ Aucune coordonnée trouvée pour cette adresse:", address);
        console.log("📄 Réponse complète:", JSON.stringify(response.data));
      }
    } catch (error: any) {
      console.error('❌ Erreur de géocodage:', error.message);
      if (error.response) {
        console.error('🔴 Statut:', error.response.status);
        console.error('🔴 Données:', JSON.stringify(error.response.data));
      } else if (error.request) {
        console.error('🔴 Aucune réponse reçue:', error.request);
      } else {
        console.error('🔴 Erreur de configuration:', error.message);
      }
    }
  };

  // Utiliser l'effet pour obtenir les coordonnées
  useEffect(() => {
    if (product) {
      // Construire une adresse complète avec tous les éléments disponibles
      const addressParts = [];
      
      if (product.location) addressParts.push(product.location);
      if (product.city) addressParts.push(product.city);
      if (product.zip_code) addressParts.push(product.zip_code);
      
      // Ajouter le pays par défaut si aucun élément n'indique le pays
      const address = addressParts.join(' ');
      
      if (address) {
        console.log("🏙️ Construction de l'adresse pour la géolocalisation:", address);
        getCoordinates(address);
      } else {
        console.warn("⚠️ Impossible de construire une adresse à partir des données du produit");
      }
    }
  }, [product]);

  // Pour la vue fullscreen, nous n'utiliserons pas le reste du contenu
  if (route.params?.fullscreenMode) {
    if (loading) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: '#3e4652' }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={[styles.loadingText, { color: '#fff' }]}>Chargement...</Text>
        </View>
      );
    }

    if (error || !product) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: '#3e4652' }]}>
          <Text style={[styles.errorText, { color: '#fff' }]}>{error || 'Produit non disponible'}</Text>
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
      <View style={{ flex: 1 }}>
        <ImageCarousel 
          images={getProductImage(product)} 
          navigation={navigation} 
          product={product}
        />
      </View>
    );
  }

  // Rendre la vue normale
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

  // Interface normale (non fullscreen)
  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <TouchableOpacity 
          style={styles.fullImageButton}
          activeOpacity={0.95}
          onPress={() => navigation.navigate('ProductDetails', { 
            productId: product.id,
            fullscreenMode: true
          })}
        >
          {getProductImage(product).length > 0 ? (
            <>
              <Image
                source={{ 
                  uri: getProductImage(product).length > 0 
                    ? (
                      typeof getProductImage(product)[0] === 'string' && getProductImage(product)[0].startsWith('http')
                        ? getProductImage(product)[0]
                        : `${API_URL}/storage/${getProductImage(product)[0]}`
                    )
                    : placeholderImage
                }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </>
          ) : (
            <>
              <Image
                source={placeholderImage}
                style={styles.mainImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </>
          )}
          
          <View style={styles.imageHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.imageInfo}>
            <Text style={styles.miniTitle}>{product.title}</Text>
            <Text style={styles.miniPrice}>{formatPrice(product.price)}</Text>
          </View>
          
          {getProductImage(product).length > 1 && (
            <View style={styles.imagePagination}>
              {getProductImage(product).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === 0 && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
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
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>État</Text>
            <Text style={styles.detailValue}>{getConditionLabel(product.condition)}</Text>
          </View>
          
          {product.size && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Taille</Text>
              <Text style={styles.detailValue}>{product.size}</Text>
            </View>
          )}
          
          {product.color && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Couleur</Text>
              <Text style={styles.detailValue}>{product.color}</Text>
            </View>
          )}
          
          {product.warranty && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Garantie</Text>
              <Text style={styles.detailValue}>{getWarrantyLabel(product.warranty)}</Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Catégorie</Text>
            <Text style={styles.detailValue}>{getCategoryName(product.category_id)}</Text>
          </View>
          
          {product.subcategory_id && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Sous-catégorie</Text>
              <Text style={styles.detailValue}>
                {getSubcategoryName(product.category_id, product.subcategory_id)}
              </Text>
            </View>
          )}
          
          {(product.city || product.location) && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Localisation</Text>
              <Text style={styles.detailValue}>
                <Ionicons name="location-outline" size={16} color="#666" />
                {' '}{product.city || product.location}
                {product.zip_code && `, ${product.zip_code}`}
              </Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vues</Text>
            <Text style={styles.detailValue}>{product.view_count}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date de publication</Text>
            <Text style={styles.detailValue}>
              {new Date(product.created_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          
          {!product.hide_phone && product.phone && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Téléphone</Text>
              <Text style={styles.detailValue}>{product.phone}</Text>
            </View>
          )}
          
          {product.brand && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Marque</Text>
              <Text style={styles.detailValue}>{product.brand}</Text>
            </View>
          )}
          
          {product.model && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Modèle</Text>
              <Text style={styles.detailValue}>{product.model}</Text>
            </View>
          )}
          
          {product.material && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Matériau</Text>
              <Text style={styles.detailValue}>{product.material}</Text>
            </View>
          )}
          
          {product.dimensions && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Dimensions</Text>
              <Text style={styles.detailValue}>{product.dimensions}</Text>
            </View>
          )}
          
          {product.weight && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Poids</Text>
              <Text style={styles.detailValue}>{product.weight}</Text>
            </View>
          )}
        </View>
      </View>

      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <View style={styles.mapContainerWrapper}>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title={product.title}
                  description={`${product.city || product.location || ''}`}
                />
              </MapView>
            </View>
          </View>
        </View>
      )}

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
          onPress={handleContactSeller}
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

      {/* Dialogue de connexion */}
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
              navigation.navigate('Auth');
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 15,
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: hp('60%'),
    padding: 0,
    margin: 0,
    backgroundColor: 'black',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6B3CE9',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailItem: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: '#6B3CE9',
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
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    padding: 15,
    paddingBottom: 25,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactButton: {
    backgroundColor: '#6B3CE9',
  },
  mapContainerWrapper: {
    height: 200,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  mapContainer: {
    height: '100%',
    width: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fullImageButton: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  imageHeader: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  backButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
    margin: 5,
    top: 20,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 20,
  },
  miniTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  miniPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  imagePagination: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  actionButton: {
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
  },
}); 