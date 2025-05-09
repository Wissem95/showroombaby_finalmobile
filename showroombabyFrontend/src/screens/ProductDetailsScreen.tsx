import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Image, Share, ActivityIndicator, Alert, Dimensions, TouchableOpacity, Linking, Animated } from 'react-native';
import { Button, Text, IconButton, Divider, Portal, Dialog } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/auth';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Carousel from 'react-native-reanimated-carousel';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import imageService from '../services/api/imageService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icons3DModel from '../components/Icons3DModel';

// URL de l'API
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.3:8000/api'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';

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
  categoryId: number;
  subcategoryId?: number;
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
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
  address?: string;
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
    zIndex: 1,
  },
  item: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    overflow: 'hidden',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 3,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingTop: 0,
    zIndex: 30,
    flexDirection: 'row',
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 10,
    height: 10,
  },
  favoriteButton: {
    position: 'absolute',
    top: 60,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    padding: 0,
  },
  shareButton: {
    position: 'absolute',
    top: 115,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    padding: 0,
  },
  productInfoOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  productInfoContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 4,
  },
  publishDate: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
  },
  swipeIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
    width: '100%',
  },
  swipeText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 5,
    fontWeight: '500',
  },
  actionsBar: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 25,
    borderRadius: 30,
    marginHorizontal: 10,
  },
  carouselActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  carouselActionButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  carouselActionButtonActive: {
    backgroundColor: '#ff6b9b',
  },
  carouselImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  iconButton: {
    margin: 0,
    marginLeft: 5,
  },
  buttonContent: {
    minHeight: 60,
    paddingVertical: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  actionButton: {
    borderRadius: 25,
    height: 56,
    justifyContent: 'center',
  },
  absoluteButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const ImageCarousel = ({ images, navigation, product, formatPrice, getProductImageSource, getFullImageUrl, route }: any) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [isProductOwner, setIsProductOwner] = useState(false);
  
  // Animation pour l'indicateur de swipe
  const swipeAnim = useRef(new Animated.Value(0)).current;
  
  // Nouvelle animation pour la transition
  const transitionAnim = useRef(new Animated.Value(0)).current;
  
  // Vérifier si l'utilisateur est le propriétaire du produit
  useEffect(() => {
    const checkIfProductOwner = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId && product && product.user_id === parseInt(userId)) {
          setIsProductOwner(true);
        } else {
          setIsProductOwner(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du propriétaire:", error);
        setIsProductOwner(false);
      }
    };
    
    checkIfProductOwner();
  }, [product]);
  
  // Vérifier si le produit est en favori
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!product || !product.id) return;
      
      try {
        const localStatus = await AsyncStorage.getItem(`favorite_${product.id}`);
        if (localStatus === 'true') {
          setIsFavorite(true);
          return;
        } else if (localStatus === 'false') {
          setIsFavorite(false);
          return;
        }
        
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.log('Utilisateur non connecté, impossible de vérifier les favoris');
          return;
        }
        
        // Utiliser la route dédiée pour vérifier si un produit est en favoris
        const response = await axios.get(`${API_URL}/favorites/check/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        
        // Récupérer directement la valeur isFavorite de la réponse
        const isFavorite = response.data?.isFavorite || false;
        
        setIsFavorite(isFavorite);
        
        // Sauvegarder le statut dans le stockage local pour les prochaines fois
        await AsyncStorage.setItem(`favorite_${product.id}`, isFavorite ? 'true' : 'false');
      } catch (error: any) {
        console.error('Erreur lors de la vérification des favoris:', error);
        setIsFavorite(false);
        // En cas d'erreur, définir comme non-favori par défaut
        await AsyncStorage.setItem(`favorite_${product.id}`, 'false');
      }
    };

    checkIfFavorite();
  }, [product]);
  
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

  // Gérer le favori
  const handleFavoriteToggle = async () => {
    if (isProductOwner) {
      Alert.alert("Information", "Vous ne pouvez pas ajouter votre propre produit en favoris");
      return;
    }
    
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour ajouter des favoris');
      return;
    }
    
    try {
      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        await AsyncStorage.setItem(`favorite_${product.id}`, 'false');
      } else {
        await axios.post(`${API_URL}/favorites/${product.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
        await AsyncStorage.setItem(`favorite_${product.id}`, 'true');
      }
      
      await AsyncStorage.setItem('favoritesChanged', 'true');
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 422 && error.response.data?.message?.includes('propre produit')) {
          Alert.alert("Information", "Vous ne pouvez pas ajouter votre propre produit en favoris");
          setIsProductOwner(true);
        } else if (error.response.status === 401) {
          Alert.alert('Connexion requise', 'Vous devez être connecté pour gérer vos favoris');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la gestion des favoris');
        }
      } else {
        Alert.alert('Erreur de connexion', 'Impossible de se connecter au serveur');
      }
    }
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

  const renderItem = ({ item }: { item: string }) => {
    // Construire l'URL de l'image correctement avec le service
    const imageUrl = getFullImageUrl(item);
    
    return (
      <View style={[carouselStyles.item, { zIndex: 1 }]}>
        {!imageUrl || imageLoadError[imageUrl] ? (
          // Afficher le placeholder avec un fond blanc
          <View style={[carouselStyles.item, { backgroundColor: 'white', zIndex: 5 }]}>
            <Image
              source={placeholderImage}
              style={[carouselStyles.image, { opacity: 1, resizeMode: 'contain', zIndex: 5 }]}
            />
            <Text style={{color: 'black', textAlign: 'center', position: 'absolute'}}>
              Image non disponible
            </Text>
          </View>
        ) : (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={[carouselStyles.image, { zIndex: 1 }]}
              resizeMode="cover"
              defaultSource={placeholderImage}
              onLoadStart={() => {
                setImageLoading(prev => ({ ...prev, [imageUrl]: true }));
              }}
              onLoad={() => {
                setImageLoading(prev => ({ ...prev, [imageUrl]: false }));
                setImageLoadError(prev => ({ ...prev, [imageUrl]: false }));
              }}
              onError={() => {
                setImageLoadError(prev => ({ ...prev, [imageUrl]: true }));
                setImageLoading(prev => ({ ...prev, [imageUrl]: false }));
              }}
            />
            
            <View style={[carouselStyles.overlay, { zIndex: 2 }]} />
            {imageLoading[imageUrl] && (
              <View style={[carouselStyles.imageLoadingContainer, { zIndex: 10 }]}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              activeIndex === index && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TouchableOpacity 
        activeOpacity={0.7}
        style={{ flex: 1 }}
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
          <View style={[carouselStyles.headerBar, { height: 60 + insets.top, paddingTop: insets.top }]}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={carouselStyles.backButton} 
              onPress={() => {
                if (route.params?.fromSuccess) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                } else {
                  navigation.navigate('Home');
                }
              }}
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
          
          <View style={carouselStyles.productInfoOverlay}>
            <Text style={carouselStyles.productTitle}>{product.title}</Text>
            <Text style={carouselStyles.productPrice}>{formatPrice(product.price)}</Text>
            <Text style={carouselStyles.publishDate}>
              Publié le {new Date(product.created_at).toLocaleDateString('fr-FR')}
            </Text>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              style={carouselStyles.swipeIndicator}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={animateTransition}
            >
              <Animated.View style={{ transform: [{ translateY: swipeAnim }] }}>
                <Ionicons name="chevron-down" size={24} color="#fff" />
              </Animated.View>
              <Text style={carouselStyles.swipeText}>Appuyer pour voir plus de détails</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[
              carouselStyles.favoriteButton, 
              { top: 60 + insets.top },
              isProductOwner && { backgroundColor: 'rgba(200,200,200,0.7)' }
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleFavoriteToggle}
            disabled={isProductOwner}
          >
            <View style={carouselStyles.absoluteButtonInner}>
              <Icons3DModel 
                name="heart"
                size={24}
                isActive={isFavorite}
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[carouselStyles.shareButton, { top: 115 + insets.top }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleShare}
          >
            <View style={carouselStyles.absoluteButtonInner}>
              <View style={{ transform: [{ scale: 0.8 }] }}>
                <Ionicons name="share-social-outline" size={38} color="#777" />
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={carouselStyles.actionsBar}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={carouselStyles.carouselActionButton}
              onPress={async () => {
                if (product && product.phone) {
                  if (isProductOwner || !product.hide_phone) {
                    Linking.openURL(`tel:${product.phone}`);
                  } else {
                    Alert.alert("Information", "Le numéro de téléphone est masqué");
                  }
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
              <Icons3DModel 
                name="call"
                size={36}
                isActive={false}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={carouselStyles.carouselActionButton}
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
              <Icons3DModel 
                name="chat"
                size={36}
                isActive={false}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={carouselStyles.carouselActionButton}
              onPress={handleFavoriteToggle}
              disabled={isProductOwner}
            >
              <Icons3DModel 
                name="heart"
                size={36}
                isActive={isFavorite}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={carouselStyles.carouselActionButton}
              onPress={handleShare}
            >
              <View style={{ transform: [{ scale: 0.8 }] }}>
                <Ionicons name="share-social-outline" size={38} color="#777" />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <View style={{ 
          position: 'absolute', 
          height: 80, 
          left: 0, 
          right: 0, 
          bottom: 75,
          zIndex: 15
        }} />
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

export default function ProductDetailsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { productId, fullscreenMode, transitionAnimation } = route.params || {};
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingImageGallery, setShowingImageGallery] = useState(fullscreenMode);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [hiddenPhone, setHiddenPhone] = useState<string | null>(null);
  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [categoryName, setCategoryName] = useState<string>('Catégorie');
  const [isProductOwner, setIsProductOwner] = useState(false);
  
  // Animation de transition
  const slideAnimation = useRef(new Animated.Value(
    transitionAnimation === 'fromBottom' ? 1000 : 0
  )).current;
  const opacityAnimation = useRef(new Animated.Value(
    transitionAnimation === 'fromBottom' ? 0 : 1
  )).current;
  
  // Exécuter l'animation d'entrée si l'on accède à cette page par un swipe up
  useEffect(() => {
    if (transitionAnimation === 'fromBottom') {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [transitionAnimation]);

  const navigationNative = useNavigation();

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        console.log('Catégories récupérées:', response);
        if (response.data && response.data.data) {
          setCategories(response.data.data);
        } else {
          console.error('Format de réponse inattendu:', response);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Mettre à jour le nom de la catégorie quand le produit change
  useEffect(() => {
    if (product && product.categoryId) {
      const foundCategory = categories.find(cat => cat.id === product.categoryId);
      if (foundCategory) {
        setCategoryName(foundCategory.name);
      } else if (product.category) {
        setCategoryName(product.category.name);
      }
    }
  }, [product, categories]);

  // Obtenir le nom de la catégorie
  const getCategoryName = (categoryId: number | undefined | null): string => {
    if (!categoryId || !categories) return 'Catégorie inconnue';
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  };

  // Obtenir le nom de la sous-catégorie
  const getSubcategoryName = (categoryId: number | undefined | null, subcategoryId: number | undefined | null): string => {
    if (!subcategoryId || !categories) return '';
    const category = categories.find((cat: Category) => cat.id === categoryId);
    if (category && category.subcategories) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      return subcategory ? subcategory.name : '';
    }
    return '';
  };

  // Charger les détails du produit
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!productId && route.params?.product) {
        // Si le produit est déjà disponible dans les paramètres
        const paramProduct = route.params.product;
        setProduct(paramProduct);
        
        console.log('[DEBUG-PRODUCT] Produit provenant des params:', {
          id: paramProduct.id,
          hide_phone: paramProduct.hide_phone,
          phone: paramProduct.phone,
          isProductOwner: paramProduct.user_id === parseInt(await AsyncStorage.getItem('userId') || '0')
        });
        
        // Utiliser les données du vendeur du produit si disponibles
        if (paramProduct.seller) {
          setSeller(paramProduct.seller);
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
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const productData = response.data.data;
        console.log('[DEBUG-PRODUCT] Produit chargé depuis API:', {
          id: productData.id,
          hide_phone: productData.hide_phone,
          phone: productData.phone,
          user_id: productData.user_id,
          current_user_id: await AsyncStorage.getItem('userId')
        });
        
        setProduct(productData);
        
        // Utiliser d'abord les données du vendeur incluses dans la réponse du produit
        if (productData.seller) {
          setSeller(productData.seller);
        } 
        // Si le vendeur n'est pas inclus, essayer de l'obtenir par API
        else if (productData.user_id) {
          try {
            // Tenter de récupérer les informations du vendeur depuis l'API
            try {
              const sellerResponse = await axios.get(`${API_URL}/users/${productData.user_id}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
              });
              
              if (sellerResponse.data && sellerResponse.data.data) {
                setSeller({
                  id: productData.user_id,
                  name: sellerResponse.data.data.name || sellerResponse.data.data.username || "3Wsolution",
                  username: sellerResponse.data.data.username,
                  email: sellerResponse.data.data.email,
                  avatar: sellerResponse.data.data.avatar,
                  rating: sellerResponse.data.data.rating || 0,
                });
              } else {
                setSeller({
                  id: productData.user_id,
                  name: productData.seller_name || "3Wsolution",
                });
              }
            } catch (error) {
              console.log('Impossible de récupérer les infos du vendeur, utilisation du nom par défaut');
              setSeller({
                id: productData.user_id,
                name: productData.seller_name || "3Wsolution",
              });
            }
          } catch (sellerError) {
            console.error('Erreur lors du chargement des informations du vendeur:', sellerError);
            // Créer un vendeur minimal avec l'ID uniquement
            setSeller({
              id: productData.user_id,
              name: productData.seller_name || "3Wsolution",
            });
          }
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
            setIsFavorite(true);
            return;
          } else if (localStatus === 'false') {
            setIsFavorite(false);
            return;
          }
          
          const token = await AsyncStorage.getItem('token');
          
          if (!token) {
            console.log('Utilisateur non connecté, impossible de vérifier les favoris');
            return;
          }
          
          // Utiliser la route dédiée pour vérifier si un produit est en favoris
          const response = await axios.get(`${API_URL}/favorites/check/${productId}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          
          // Récupérer directement la valeur isFavorite de la réponse
          const isFavorite = response.data?.isFavorite || false;
          
          setIsFavorite(isFavorite);
          
          // Sauvegarder le statut dans le stockage local pour les prochaines fois
          await AsyncStorage.setItem(`favorite_${productId}`, isFavorite ? 'true' : 'false');
        } catch (error: any) {
          console.error('Erreur lors de la vérification des favoris:', error);
          setIsFavorite(false);
          // En cas d'erreur, définir comme non-favori par défaut
          await AsyncStorage.setItem(`favorite_${productId}`, 'false');
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

  // Vérifier si l'utilisateur est le propriétaire du produit
  useEffect(() => {
    const checkIfProductOwner = async () => {
      try {
        if (!product) return;
        
        const userId = await AsyncStorage.getItem('userId');
        if (userId && product.user_id === parseInt(userId)) {
          setIsProductOwner(true);
          console.log('Utilisateur propriétaire du produit détecté');
        } else {
          setIsProductOwner(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du propriétaire:", error);
        setIsProductOwner(false);
      }
    };
    
    checkIfProductOwner();
  }, [product]);

  // Fonction unique pour formater le prix
  const formatPrice = (price: number) => {
    if (price === undefined || price === null) {
      return '0.00 €';
    }
    return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ') + ' €';
  };
  
  // Autres fonctions utilitaires
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

  const getConditionLabel = (condition: string) => {
    const conditions: Record<string, string> = {
      'NEW': 'Neuf',
      'LIKE_NEW': 'Comme neuf',
      'GOOD': 'Bon état',
      'FAIR': 'État correct'
    };
    return conditions[condition] || condition;
  };

  // Fonction pour afficher l'adresse complète avec département et code postal
  const getFullAddress = () => {
    console.log("Champs d'adresse disponibles:", {
      address: product?.address,
      city: product?.city,
      location: product?.location,
      zipCode: product?.zip_code
    });
    
    let addressParts: string[] = [];
    
    // Ajouter l'adresse si disponible
    if (product?.address) {
      addressParts.push(product.address);
    } else if (product?.city) {
      addressParts.push(product.city);
    } else if (product?.location) {
      addressParts.push(product.location);
    }
    
    // Ajouter le code postal s'il existe
    if (product?.zip_code) {
      addressParts.push(product.zip_code);
    }
    
    // Joindre tous les éléments avec un espace et un tiret
    const fullAddress = addressParts.join(' - ');
    
    return fullAddress || "Localisation non spécifiée";
  };

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
    
    // Vérifier si l'utilisateur est le propriétaire du produit
    if (isProductOwner) {
      Alert.alert("Information", "Vous ne pouvez pas ajouter votre propre produit en favoris");
      return;
    }
    
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      setLoginDialogVisible(true);
      return;
    }
    
    try {
      if (isFavorite) {
        // Supprimer des favoris
        await axios.delete(`${API_URL}/favorites/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        
        // Mettre à jour le statut du favori dans le stockage local
        await AsyncStorage.setItem('favoritesChanged', 'true');
        await AsyncStorage.setItem(`favorite_${product.id}`, 'false');
        
        Alert.alert('Succès', 'Produit retiré des favoris');
      } else {
        // Ajouter aux favoris
        await axios.post(`${API_URL}/favorites/${product.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
        
        // Mettre à jour le statut du favori dans le stockage local
        await AsyncStorage.setItem('favoritesChanged', 'true');
        await AsyncStorage.setItem(`favorite_${product.id}`, 'true');
        
        Alert.alert('Succès', 'Produit ajouté aux favoris');
      }
    } catch (error: any) {
      // Vérifie si c'est l'erreur 422 pour ne pas l'afficher en rouge
      if (error.response && error.response.status === 422 && error.response.data?.message?.includes('propre produit')) {
        // Ne pas afficher l'erreur en console pour cette erreur spécifique
        console.log('Info: tentative d\'ajouter son propre produit en favoris');
        setIsProductOwner(true);
        Alert.alert("Information", "Vous ne pouvez pas ajouter votre propre produit en favoris");
      } else {
        // Pour toutes les autres erreurs, on conserve le console.error
        console.error('Erreur lors de la gestion des favoris:', error);
      }
      
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Erreur d\'authentification', 'Vous devez être connecté pour gérer vos favoris');
          setLoginDialogVisible(true);
        } else if (error.response.status === 422) {
          // Le produit est déjà dans les favoris
          setIsFavorite(true);
          
          // Mettre à jour le statut du favori dans le stockage local
          await AsyncStorage.setItem('favoritesChanged', 'true');
          await AsyncStorage.setItem(`favorite_${product.id}`, 'true');
          
          Alert.alert('Information', 'Ce produit est déjà dans vos favoris');
        } else if (error.response.status === 404) {
          // Le produit n'est plus dans les favoris ou n'existe pas
          setIsFavorite(false);
          
          // Mettre à jour le statut du favori dans le stockage local
          await AsyncStorage.setItem('favoritesChanged', 'true');
          await AsyncStorage.setItem(`favorite_${product.id}`, 'false');
          
          Alert.alert('Information', isFavorite ? 
            'Ce produit a déjà été retiré des favoris' : 
            'Ce produit n\'est pas disponible pour le moment');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la gestion des favoris');
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse reçue (problème de connexion)
        Alert.alert('Erreur de connexion', 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        Alert.alert('Erreur', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
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

  // Modifier l'effet pour traiter correctement les données
  useEffect(() => {
    if (product) {
      console.log('Product details with address:', {
        id: product.id,
        title: product.title,
        address: product.address,
        city: product.city,
        location: product.location
      });
      
      // Utiliser directement les coordonnées de la DB si disponibles
      if (product.latitude && product.longitude && 
          !isNaN(product.latitude) && !isNaN(product.longitude)) {
        console.log("📍 Coordonnées valides trouvées dans le produit:", product.latitude, product.longitude);
        setLocation({
          latitude: product.latitude,
          longitude: product.longitude
        });
      } else {
        console.log("❌ Coordonnées invalides ou manquantes dans le produit");
        setLocation(null);
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
          images={imageService.getProductImages(product)} 
          navigation={navigation} 
          product={product}
          formatPrice={formatPrice}
          getProductImageSource={(product) => imageService.getProductImageSource(product, placeholderImage)}
          getFullImageUrl={(imagePath) => imageService.getFullImageUrl(imagePath)}
          route={route}
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
    <Animated.View style={[
      styles.container,
      {
        opacity: opacityAnimation,
        transform: [{ translateY: slideAnimation }]
      }
    ]}>
      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.fullImageButton}
            onPress={() => navigation.navigate('ProductDetails', { 
              productId: product.id,
              fullscreenMode: true,
              fromSuccess: route.params?.fromSuccess
            })}
          >
            <View style={styles.productImageContainer}>
              <Image
                source={imageService.getProductImageSource(product, placeholderImage)}
                style={styles.mainImage}
                resizeMode="cover"
                defaultSource={placeholderImage}
                onError={(e) => {
                  console.log('Erreur de chargement image principale:', e.nativeEvent.error);
                }}
              />
              <View style={styles.imageOverlay} />
            </View>
            
            {imageService.getProductImages(product).length > 1 && (
              <View style={styles.imagePagination}>
                {imageService.getProductImages(product).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === 0 && styles.paginationDotActive
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
                icon={isFavorite ? "heart" : "heart-outline"}
                iconColor={isProductOwner ? "#aaa" : (isFavorite ? "#e74c3c" : "#000")}
                size={28}
                onPress={handleFavorite}
                disabled={isProductOwner}
                style={{ margin: 0, marginLeft: 5 }}
                touchableProps={{ activeOpacity: 0.7, hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } }}
              />
              <IconButton
                icon="share-variant"
                size={28}
                onPress={handleShare}
                style={{ margin: 0, marginLeft: 5 }}
                touchableProps={{ activeOpacity: 0.7, hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } }}
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
              <Text style={styles.detailValue}>
                {product.category 
                  ? (product.subcategory 
                      ? `${product.category.name} > ${product.subcategory.name}` 
                      : product.category.name)
                  : (product.categoryId 
                      ? (product.subcategoryId 
                          ? `${getCategoryName(product.categoryId)} > ${getSubcategoryName(product.categoryId, product.subcategoryId)}` 
                          : getCategoryName(product.categoryId))
                      : 'Catégorie inconnue')
                }
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Localisation</Text>
              <Text style={styles.detailValue}>
                <Ionicons name="location-outline" size={16} color="#666" />
                {' '}
                {getFullAddress()}
              </Text>
            </View>
            
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
            
            {product.phone && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Téléphone</Text>
                <Text style={styles.detailValue}>
                  {(() => {
                    console.log('[DEBUG-PHONE] Affichage du téléphone:', {
                      isProductOwner,
                      hide_phone: product.hide_phone,
                      phone: product.phone
                    });
                    // Convertir explicitement hide_phone en booléen
                    const shouldHidePhone = Boolean(product.hide_phone);
                    return isProductOwner ? product.phone : (shouldHidePhone ? 'Numéro masqué' : product.phone);
                  })()}
                </Text>
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

        {/* Carte avec la localisation */}
        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carte</Text>
            <View style={styles.mapContainerWrapper}>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title={product?.title}
                    description={getFullAddress()}
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
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            style={styles.contactButton}
            contentStyle={{ minHeight: 60, paddingVertical: 8, width: '100%', justifyContent: 'center', alignItems: 'center' }}
            onPress={handleContactSeller}
            disabled={isProductOwner}
            labelStyle={{ fontSize: 16, fontWeight: '500', textAlign: 'center', width: '100%', flexShrink: 1, flexWrap: 'wrap' }}
          >
            {isProductOwner ? 'Votre produit' : 'Contacter le vendeur'}
          </Button>
          <Button 
            mode="outlined" 
            style={[
              styles.favoriteActionButton,
              isProductOwner && styles.disabledButton
            ]}
            contentStyle={{ minHeight: 60, paddingVertical: 8, width: '100%', justifyContent: 'center', alignItems: 'center' }}
            onPress={handleFavorite}
            disabled={isProductOwner}
            labelStyle={[
              { fontSize: 16, fontWeight: '500', textAlign: 'center', width: '100%', flexShrink: 1, flexWrap: 'wrap' },
              isFavorite && styles.favoriteButtonLabel
            ]}
          >
            {isProductOwner ? 'Impossible d\'ajouter en favoris' : (isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris')}
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
      
      {/* Bouton retour en position sticky */}
      <TouchableOpacity 
        activeOpacity={0.7}
        style={styles.stickyBackButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={() => {
          if (route.params?.fromSuccess) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } else {
            navigation.navigate('Home');
          }
        }}
      >
        <Ionicons name="chevron-back" size={32} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 5,
    width: '100%',
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ff6b9b',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    backgroundColor: '#ff6b9b',
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
    flexDirection: 'column',
    paddingHorizontal: 15,
    paddingBottom: 20,
    marginTop: 10,
    gap: 15,
    width: '100%',
  },
  contactButton: {
    backgroundColor: '#ff6b9b',
    borderColor: '#ff6b9b',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 4,
    shadowColor: "#ff6b9b",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minHeight: 60,
  },
  favoriteActionButton: {
    borderColor: '#ff6b9b',
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    minHeight: 60,
  },
  favoriteButtonLabel: {
    color: '#ff6b9b',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
    opacity: 0.7,
    paddingVertical: 10,
    borderRadius: 25,
  },
  mapContainerWrapper: {
    height: 250,
    marginVertical: 12,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fullImageButton: {
    flex: 1,
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  productImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
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
  imagePagination: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 10,
    height: 10,
  },
  stickyBackButton: {
    position: 'absolute',
    top: 50,
    left: 15,
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
    zIndex: 1000,
  },
}); 