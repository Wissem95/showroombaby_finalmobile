import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, RefreshControl, Platform, LogBox, Animated as RNAnimated, AppState, AppStateStatus } from 'react-native';
import { Text, Surface, ActivityIndicator, Appbar, FAB, Badge, Avatar, Divider, Button } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, { FadeIn, FadeOut, Layout, ZoomIn, SlideInUp, BounceIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthService from '../services/auth';
import { SERVER_IP } from '../config/ip';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConversationService from '../services/conversation';
import Toast from 'react-native-toast-message';
import { EventRegister } from 'react-native-event-listeners';

// Ignorer les avertissements non critiques
LogBox.ignoreLogs([
  'When you set overflow',  // Ignorer les avertissements liés aux ombres des composants Surface
  'VirtualizedLists should never be nested',
  'Warning: Failed prop type'
]);

// Adapter l'URL de l'API en fonction de la plateforme
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? `http://${SERVER_IP}:8000/api`  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com/api';

const placeholderImage = require('../../assets/placeholder.png');
const DEFAULT_AVATAR_URL = 'https://via.placeholder.com/100';

interface Conversation {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  created_at: string;
  read: boolean;
  archived_by_sender: boolean;
  archived_by_recipient: boolean;
  product_id?: number;
  product?: {
    id: number;
    title: string;
    description?: string;
    price?: number;
    images?: string[];
    loadAttempts?: number;
  };
  sender?: {
    id: number;
    username: string;
    email?: string;
    avatar?: string;
  };
  recipient?: {
    id: number;
    username: string;
    email?: string;
    avatar?: string;
  };
}

interface ImageType {
  path?: string;
  url?: string;
}

// Styles pour la page des messages
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainHeaderTitle: {
    fontSize: wp('7%'),
    fontWeight: '700',
    color: '#333',
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('2%'),
    paddingTop: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp('1%'),
  },
  headerSubtitle: {
    fontSize: wp('3.5%'),
    color: '#777',
  },
  searchContainer: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
  },
  searchBar: {
    borderRadius: 10,
    height: hp('5.5%'),
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchInput: {
    fontSize: wp('3.8%'),
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: wp('3%'),
    marginVertical: hp('0.7%'),
    padding: wp('4%'),
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    borderWidth: 0,
  },
  unreadConversationItem: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b9b',
  },
  userAvatar: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    marginRight: wp('3%'),
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  unreadUserAvatar: {
    borderColor: '#ff6b9b',
    borderWidth: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp('7%'),
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: wp('7%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff6b9b',
  },
  avatarText: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  userName: {
    fontSize: wp('4.2%'),
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadUserName: {
    fontWeight: '700',
    color: '#222',
  },
  messageTime: {
    fontSize: wp('3%'),
    color: '#888',
    marginLeft: wp('2%'),
    fontWeight: '400',
  },
  unreadMessageTime: {
    color: '#666',
    fontWeight: '500',
  },
  messageText: {
    fontSize: wp('3.5%'),
    color: '#777',
    marginTop: hp('0.5%'),
    lineHeight: wp('5%'),
  },
  unreadMessageText: {
    fontWeight: '500',
    color: '#555',
  },
  unreadBadge: {
    position: 'absolute',
    right: wp('3%'),
    top: wp('3%'),
    minWidth: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#ff6b9b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    elevation: 4,
    shadowColor: '#ff3b7b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  unreadBadgeText: {
    fontSize: wp('2.8%'),
    color: '#fff',
    fontWeight: '700',
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('0.8%'),
    backgroundColor: 'rgba(244, 245, 255, 0.5)',
    padding: wp('2%'),
    borderRadius: 8,
    borderWidth: 0,
  },
  productImageContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: 10,
    marginRight: wp('2%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  productTitle: {
    fontSize: wp('3.6%'),
    color: '#6B3CE9',
    fontWeight: '500',
    marginBottom: hp('0.3%'),
    textShadowColor: 'rgba(107, 60, 233, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('10%'),
    backgroundColor: '#ffffff',
  },
  emptyStateImage: {
    width: wp('40%'),
    height: wp('40%'),
    marginBottom: hp('3%'),
    opacity: 0.7,
  },
  emptyStateTitle: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1.5%'),
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: wp('4.2%'),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('3.5%'),
    lineHeight: wp('6.5%'),
  },
  emptyStateButton: {
    backgroundColor: '#ff6b9b',
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1.5%'),
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#ff6b9b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  loadMoreContainer: {
    padding: wp('5%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  loadMoreButton: {
    backgroundColor: 'rgba(107, 60, 233, 0.12)',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('6%'),
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#6B3CE9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loadMoreText: {
    color: '#6B3CE9',
    fontWeight: '600',
    fontSize: wp('3.5%'),
    marginLeft: wp('2%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp('10%'),
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: wp('4%'),
    color: '#777',
    marginTop: hp('2%'),
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('10%'),
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: wp('4%'),
    color: '#777',
    textAlign: 'center',
    marginTop: hp('2%'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('10%'),
    backgroundColor: '#ffffff',
  },
  emptyText: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp('3%'),
    marginBottom: hp('1.5%'),
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: wp('4.2%'),
    color: '#666',
    textAlign: 'center',
    lineHeight: wp('6.5%'),
  },
  buttonContainer: {
    marginTop: hp('3.5%'),
    width: '100%',
  },
  loadMorePlaceholder: {
    height: hp('10%'),
  },
  unreadCountContainer: {
    backgroundColor: '#ff6b9b',
    borderRadius: 18,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    minWidth: wp('6%'),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#ff3b7b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginLeft: 10,
  },
  unreadCountText: {
    color: '#fff',
    fontSize: wp('3.2%'),
    fontWeight: '700',
  },
  listContainer: {
    paddingTop: hp('1%'),
    paddingBottom: hp('2%'),
  },
  emptyList: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: hp('0.5%'),
    marginHorizontal: wp('4%'),
    opacity: 0.5,
  },
  loadingIcon: {
    width: 50,
    height: 50,
    marginBottom: 16,
  },
  exploreButton: {
    marginTop: 20,
    borderColor: '#ff6b9b',
    borderRadius: 25,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#ff6b9b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#ff6b9b',
    borderRadius: 25,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#ff3b7b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  backButton: {
    marginTop: 12,
    borderColor: '#ff6b9b',
    borderRadius: 25,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
});

const EmptyConversationsList = ({ navigation, isAuthenticated }: { navigation: any, isAuthenticated: boolean }) => {
  return (
    <Animated.View 
      entering={FadeIn.duration(600).delay(300)}
      style={styles.emptyContainer}
    >
      <Animated.View entering={ZoomIn.duration(800).delay(400)}>
        <Ionicons name="chatbubble-ellipses-outline" size={wp('25%')} color="#ddd" />
      </Animated.View>
      
      <Animated.Text 
        entering={SlideInUp.duration(800).delay(600)}
        style={styles.emptyText}
      >
        {isAuthenticated ? 'Aucune conversation pour le moment.' : 'Vous n\'êtes pas connecté'}
      </Animated.Text>
      
      <Animated.Text 
        entering={SlideInUp.duration(800).delay(800)}
        style={styles.emptySubText}
      >
        {isAuthenticated 
          ? 'Commencez à chatter avec des vendeurs pour voir vos conversations ici.'
          : 'Vous devez être connecté pour accéder à vos messages.'}
      </Animated.Text>
      
      {!isAuthenticated ? (
        <Animated.View 
          entering={SlideInUp.duration(800).delay(1000)}
          style={styles.buttonContainer}
        >
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Auth')}
            style={styles.loginButton}
            icon="login"
          >
            Se connecter
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Home')}
            style={styles.backButton}
            textColor="#ff6b9b"
            icon="home"
          >
            Retour à l'accueil
          </Button>
        </Animated.View>
      ) : (
        <Animated.View entering={SlideInUp.duration(800).delay(1000)}>
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Home')}
            style={styles.exploreButton}
            textColor="#ff6b9b"
            icon="shopping"
          >
            Explorer des produits
          </Button>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Fonction utilitaire simplifiée pour résoudre les URL d'images
const getImageUrl = (image: any): string => {
  // Si c'est une chaîne qui commence par http, c'est déjà une URL complète
  if (typeof image === 'string' && image.startsWith('http')) {
    return image;
  }
  
  // Si c'est une chaîne sans http, ajouter le préfixe de stockage
  if (typeof image === 'string') {
    return `${API_URL}/storage/${image}`;
  }
  
  // Si c'est un objet avec une propriété url
  if (typeof image === 'object' && image && 'url' in image && image.url) {
    return image.url;
  }
  
  // Si c'est un objet avec une propriété path
  if (typeof image === 'object' && image && 'path' in image && image.path) {
    return `${API_URL}/storage/${image.path}`;
  }
  
  return DEFAULT_AVATAR_URL;
};

// Fonction pour obtenir l'URL d'image d'un produit
const getProductImageUrl = (product: any): string => {
  if (!product || !product.images || !product.images.length) {
    return DEFAULT_AVATAR_URL;
  }
  
  return getImageUrl(product.images[0]);
};

const CONVERSATIONS_PER_PAGE = 20;

// Type pour les paramètres de navigation
type RootStackParamList = {
  Chat: {
    receiverId: number;
    productId?: number;
    productTitle?: string;
  };
  Explore: undefined;
  Home: undefined;
  Auth: undefined;
  Search: undefined;
  ProductDetails: {
    productId: number;
    fullscreenMode?: boolean;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MessagesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const conversationsPerPage = 10; // Nombre de conversations à charger par page
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const MIN_REFRESH_INTERVAL = 10000; // 10 secondes minimum entre les rafraîchissements
  
  // Animation pour l'icône de chargement
  const spinAnim = useRef(new RNAnimated.Value(0)).current;
  
  // Référence pour stocker les produits en cours de chargement
  const loadingProducts = useRef<Record<string, boolean>>({});

  // Nettoyage des composants démontés pour éviter les fuites mémoire
  const isMounted = useRef(true);

  // État de focus de l'écran pour la recharge automatique
  const isFocused = useIsFocused();
  
  // Animation de rotation pour l'icône de chargement
  useEffect(() => {
    if (loading) {
      RNAnimated.loop(
        RNAnimated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [loading]);
  
  // Vérification de l'authentification et récupération de l'ID utilisateur
  useEffect(() => {
    isMounted.current = true;
    
    const checkAuthentication = async () => {
      try {
        // Vérifier si l'utilisateur est authentifié via le service d'authentification
        const isAuth = await AuthService.checkAuth();
        setIsAuthenticated(isAuth);
        
        if (isAuth) {
          // Récupérer l'ID de l'utilisateur à partir du stockage
          const id = await AsyncStorage.getItem('userId');
          setUserId(id ? parseInt(id) : null);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur vérification authentification:', error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    
    checkAuthentication();
    
    // Cleanup lors du démontage
    return () => {
      isMounted.current = false;
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, []);

  const processConversations = async (conversationsData: any[]) => {
    // Transformer les données pour s'assurer que les informations utilisateur sont complètes
    const processedConversations = conversationsData.map((conv: any) => {
      // Créer des objets utilisateur complets à partir des données plates
      const sender = {
        id: conv.sender_id,
        username: conv.sender_username || `Utilisateur #${conv.sender_id}`,
        email: conv.sender_email,
        avatar: conv.sender_avatar
      };
      
      const recipient = {
        id: conv.recipient_id,
        username: conv.recipient_username || `Utilisateur #${conv.recipient_id}`,
        email: conv.recipient_email,
        avatar: conv.recipient_avatar
      };
      
      // Créer un objet produit si les données sont disponibles
      let product = undefined;
      if (conv.product_id) {
        let productImages: Array<any> = [];
        
        // Traitement des images du produit
        try {
          if (conv.product_images) {
            // Ajouter le traitement des images ici
            // ... existing code ...
          }
        } catch (error) {
          productImages = [];
        }
        
        product = {
          id: conv.product_id,
          title: conv.product_title || `Produit #${conv.product_id}`,
          price: conv.product_price,
          images: productImages
        };
      }
      
      // Retourner une conversation avec tous les champs nécessaires
      return {
        ...conv,
        sender,
        recipient,
        product
      };
    });
    
    // Regrouper les conversations par paires d'utilisateurs et par produit
    const currentUserIdStr = await AsyncStorage.getItem('userId');
    const currentUserId = currentUserIdStr ? parseInt(currentUserIdStr) : null;
    
    // Création d'une Map pour stocker les conversations uniques
    const conversationsMap = new Map();
    
    // Regrouper les conversations par paire d'utilisateurs et par produit
    processedConversations.forEach(conv => {
      // Créer une clé unique pour chaque conversation
      // La clé est composée des ID des deux utilisateurs et de l'ID du produit
      const userIds = [conv.sender_id, conv.recipient_id].sort((a, b) => a - b);
      const key = `${userIds[0]}-${userIds[1]}-${conv.product_id || 'general'}`;
      
      // Si cette conversation existe déjà, mettre à jour uniquement si le message est plus récent
      if (!conversationsMap.has(key) || 
          new Date(conv.created_at) > new Date(conversationsMap.get(key).created_at)) {
        conversationsMap.set(key, conv);
      }
    });
    
    // Convertir la Map en tableau
    const uniqueConversations = Array.from(conversationsMap.values());
    
    // Trier par date de création (plus récent en premier)
    uniqueConversations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return uniqueConversations;
  };
  
  const refreshMessages = async (withLoadingState = true) => {
    // Vérification du debounce
    const now = Date.now();
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      return; // Évite les rafraîchissements trop fréquents
    }
    
    try {
      setLastRefreshTime(now);
      await loadData(withLoadingState);
    } catch (error) {
      // Réduire les logs d'erreurs
      if (__DEV__) {
        console.error('Erreur lors du rafraîchissement des messages:', error);
      }
    }
  };
  
  const loadData = async (withRefresh = false) => {
    try {
      if (withRefresh) setRefreshing(true);
      else if (!isInitialLoadDone) setLoading(true);
      
      // Vérifier l'authentification
      const isAuth = await AuthService.checkAuth();
      setIsAuthenticated(isAuth);
      
      // Si utilisateur non authentifié, arrêter le chargement
      if (!isAuth) {
        setRefreshing(false);
        setLoading(false);
        return;
      }
      
      // Récupérer l'ID utilisateur
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        setUserId(parseInt(userId));
        
        try {
          // Charger les conversations
          const headers = await AuthService.getAuthHeaders();
          const response = await axios.get(
            `${API_URL}/messages/conversations`,
            { 
              headers,
              timeout: 10000
            }
          );
          
          if (!response.data?.data?.data || !Array.isArray(response.data.data.data)) {
            setConversations([]);
            setHasMore(false);
            setRefreshing(false);
            setLoading(false);
            setIsInitialLoadDone(true);
            return;
          }
          
          const conversations = response.data.data.data;
          
          // Si pas de conversations, arrêter le chargement
          if (!conversations || !conversations.length) {
            setConversations([]);
            setHasMore(false);
            setRefreshing(false);
            setLoading(false);
            setIsInitialLoadDone(true);
            return;
          }
          
          // Calcul du nombre total de messages non lus
          const unreadTotal = conversations.filter(
            (conv: any) => !conv.read && conv.sender_id !== parseInt(userId)
          ).length;
          setUnreadCount(unreadTotal);
          
          // Traitement des conversations
          const processedConversations = await processConversations(conversations);
          
          setConversations(processedConversations);
          setHasMore(conversations.length < CONVERSATIONS_PER_PAGE);
          
          // Mettre en place l'actualisation automatique uniquement si ce n'est pas déjà fait
          // et seulement après le premier chargement réussi
          if (!refreshInterval.current && isInitialLoadDone) {
            refreshInterval.current = setInterval(async () => {
              if (AppState.currentState === 'active' && isMounted.current) {
                await refreshMessages(false);
              }
            }, 60000); // Actualiser toutes les 60 secondes au lieu de 30
          }
          
          setIsInitialLoadDone(true);
        } catch (error) {
          if (__DEV__) {
            console.error('Erreur lors du chargement des conversations:', error);
          }
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: 'Impossible de charger les conversations. Veuillez réessayer.'
          });
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Erreur dans loadData:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Une erreur est survenue. Veuillez réessayer.'
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  useEffect(() => {
    // Force le chargement des détails produits quand les conversations sont disponibles
    if (conversations.length > 0) {
      // Chargement immédiat pour les premières conversations visibles
      conversations.slice(0, 5).forEach(conversation => {
        if (conversation.product_id) {
          loadProductDetails(conversation.product_id, conversation.id);
        }
      });
    }
  }, [conversations.length]);
  
  // Version simplifiée de loadProductDetails pour un chargement efficace
  const loadProductDetails = async (productId: number, conversationId: number, signal?: AbortSignal) => {
    try {
      // Éviter de recharger les produits déjà en cours de chargement
      const productKey = `${productId}-${conversationId}`;
      if (loadingProducts.current[productKey]) {
        return;
      }
      
      // Marquer ce produit comme en cours de chargement
      loadingProducts.current[productKey] = true;
      
      // Récupérer les headers d'authentification via le service
      const headers = await AuthService.getAuthHeaders();
      
      // Faire la requête pour obtenir les détails du produit
      const response = await axios.get(`${API_URL}/products/${productId}`, {
        headers,
        timeout: 8000,
        signal: signal
      });
      
      if (!isMounted.current) return;
      
      // Extraire les données
      let productData = null;
      if (response.data && response.data.data) {
        productData = response.data.data;
      } else if (response.data) {
        productData = response.data;
      }
      
      if (productData) {
        // Traitement des images
        if (typeof productData.images === 'string') {
          try {
            // Tentative de parse JSON
            productData.images = JSON.parse(productData.images);
          } catch (error) {
            // Si l'image est une chaîne simple, la mettre dans un tableau
            productData.images = [productData.images];
          }
        }
        
        // S'assurer que les images sont un tableau
        if (!Array.isArray(productData.images)) {
          productData.images = productData.images ? [productData.images] : [];
        }
        
        // Mise à jour immédiate des données
        setConversations(prevConversations => {
          // Éviter de créer un nouveau tableau si rien ne change
          const conversationToUpdate = prevConversations.find(conv => conv.id === conversationId);
          if (!conversationToUpdate) return prevConversations;
          
          return prevConversations.map(conv => {
            if (conv.id === conversationId) {
              return { 
                ...conv, 
                product: {
                  ...productData,
                  // Force un rechargement si nécessaire
                  images: productData.images
                }
              };
            }
            return conv;
          });
        });
      }
    } catch (error) {
      // Silencieux en cas d'erreur
    } finally {
      if (isMounted.current) {
        // Fin du chargement
        const productKey = `${productId}-${conversationId}`;
        loadingProducts.current[productKey] = false;
      }
    }
  };

  useEffect(() => {
    // Réinitialiser les conversations si l'utilisateur change
    if (userId) {
      // Si les conversations n'ont pas encore été chargées
      if (loading && conversations.length === 0) {
        loadData();
      }
    } else {
      // Si pas d'userId, probablement déconnecté
      setConversations([]);
      setUnreadCount(0);
    }
  }, [userId]);
  
  // Effets pour recharger les données lorsqu'on revient sur l'écran des messages
  useFocusEffect(
    useCallback(() => {
      // Recharger les données lorsque l'écran est de nouveau en focus
      if (isAuthenticated && !refreshing && !loading) {
        // Petit délai pour éviter de charger trop tôt
        const timer = setTimeout(() => {
          refreshMessages(false);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }, [isAuthenticated, isFocused, refreshing, loading])
  );

  // Recharger les données lorsque l'utilisateur revient de la page de chat
  const refreshAfterChat = async () => {
    try {
      // Seulement si l'utilisateur est authentifié et l'écran est en focus
      if (isAuthenticated && isFocused) {
        await loadData(false);
      }
    } catch (error) {
      console.error('Erreur lors du rechargement après chat:', error);
    }
  };

  // Actualiser automatiquement pour marquer les messages comme lus
  const markMessagesAsRead = async (conversationId: number) => {
    try {
      // Vérifier l'authentification
      const isAuth = await AuthService.checkAuth();
      if (!isAuth) return;
      
      const headers = await AuthService.getAuthHeaders();
      
      // Appel à l'API pour marquer les messages comme lus
      // Utilisation de la route correcte du backend (POST /{id}/read)
      await axios.post(
        `${API_URL}/messages/${conversationId}/read`,
        {},
        { headers }
      );
      
      // Mise à jour immédiate du compteur de messages non lus local
      // Réduire le compteur de 1 si le message était non lu
      const conversationToUpdate = conversations.find(conv => conv.id === conversationId);
      if (conversationToUpdate && !conversationToUpdate.read && conversationToUpdate.sender_id !== userId) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      // Recharger les conversations pour mettre à jour l'UI
      refreshAfterChat();
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      
      // Tenter de mettre à jour l'UI localement même si l'API échoue
      // Cela permet d'avoir une meilleure expérience utilisateur
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === conversationId && !conv.read) {
            // Réduire le compteur non lu localement si on marque comme lu
            if (conv.sender_id !== userId) {
              setUnreadCount(prevCount => Math.max(0, prevCount - 1));
            }
            return { ...conv, read: true };
          }
          return conv;
        });
      });
    }
  };

  // Mise à jour du statut de lecture des messages dans la navbar
  useEffect(() => {
    // Mettre à jour l'icône de la barre de navigation avec le nombre de messages non lus
    const updateNavBarBadge = async () => {
      try {
        // On peut stocker le nombre de messages non lus dans AsyncStorage pour que d'autres écrans y accèdent
        await AsyncStorage.setItem('unreadMessagesCount', unreadCount.toString());
        
        // Émettre un événement pour mettre à jour le badge dans la navbar
        EventRegister.emit('UPDATE_UNREAD_COUNT', unreadCount);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du badge:', error);
      }
    };
    
    updateNavBarBadge();
  }, [unreadCount]);

  const renderConversation = ({ item, index }: { item: Conversation, index: number }) => {
    // Tentative de chargement du produit si nécessaire
    if (item.product_id && (!item.product || !item.product.images || item.product.images.length === 0)) {
      // On déclenche le chargement des détails dans le rendu
      loadProductDetails(item.product_id, item.id);
    }
    
    const otherUserId = item.sender_id === userId ? item.recipient_id : item.sender_id;
    const otherUser = item.sender_id === userId ? item.recipient : item.sender;
    
    // Déterminer le nom à afficher pour l'autre utilisateur
    const otherUserName = otherUser?.username || `Utilisateur #${otherUserId}`;
    
    // Vérifier si le message est non lu et vient de l'autre utilisateur
    const isUnread = !item.read && item.sender_id !== userId;
    
    // Simplification de l'affichage du produit
    const hasProduct = !!item.product && !!item.product.title;
    
    // Fonction pour gérer le tap sur une conversation
    const handleConversationPress = async () => {
      // Si le message est non lu, le marquer comme lu immédiatement
      if (isUnread) {
        markMessagesAsRead(item.id);
      }
      
      // Naviguer vers l'écran de chat
      navigation.navigate('Chat', {
        receiverId: otherUserId,
        productId: item.product?.id,
        productTitle: item.product?.title
      });
    };
    
    return (
      <Animated.View
        entering={FadeIn.duration(300).delay(Math.min(index * 50, 300))}
        layout={Layout.springify()}
      >
        <TouchableOpacity 
          style={[
            styles.conversationItem,
            isUnread && styles.unreadConversationItem
          ]}
          onPress={handleConversationPress}
          activeOpacity={0.7}
        >
          {/* Avatar de l'utilisateur */}
          <View style={[styles.userAvatar, isUnread && styles.unreadUserAvatar]}>
            {otherUser?.avatar ? (
              <Image 
                source={{ uri: getImageUrl(otherUser.avatar) }} 
                style={styles.avatarImage}
                defaultSource={placeholderImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(otherUserName[0] || 'U').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.messageContent}>
            {/* Nom de l'utilisateur et heure */}
            <View style={styles.messageHeader}>
              <Text style={[
                styles.userName,
                isUnread && styles.unreadUserName
              ]} numberOfLines={1}>
                {otherUserName}
              </Text>
              <Text style={[
                styles.messageTime, 
                isUnread && styles.unreadMessageTime
              ]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            
            {/* Affichage du produit et du message sur deux lignes distinctes sans onglets */}
            {hasProduct && item.product && (
              <View style={{ 
                backgroundColor: isUnread ? 'rgba(107, 60, 233, 0.1)' : 'rgba(107, 60, 233, 0.07)', 
                padding: wp('2%'), 
                borderRadius: 10, 
                marginBottom: hp('0.5%'), 
                flexDirection: 'row', 
                alignItems: 'center',
                elevation: 1,
                shadowColor: '#6B3CE9',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}>
                {/* Image du produit restaurée */}
                <View style={{ 
                  width: wp('10%'), 
                  height: wp('10%'), 
                  borderRadius: 8, 
                  marginRight: wp('2%'), 
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#f0f0f0',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 1,
                }}>
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image 
                      source={{ uri: getProductImageUrl(item.product) }}
                      style={{ width: '100%', height: '100%' }}
                      defaultSource={placeholderImage}
                    />
                  ) : (
                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
                      <Ionicons name="image-outline" size={16} color="#ccc" />
                    </View>
                  )}
                </View>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {item.product.title}
                  {item.product.price ? ` - ${parseFloat(String(item.product.price)).toFixed(2).replace('.', ',')}€` : ''}
                </Text>
              </View>
            )}
            
            <Text style={[
              styles.messageText,
              isUnread && styles.unreadMessageText
            ]} numberOfLines={1}>
              {item.content}
            </Text>
          </View>
          
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyComponent = () => (
    <EmptyConversationsList navigation={navigation} isAuthenticated={isAuthenticated} />
  );

  const handleNewMessage = () => {
    // Cette fonction est maintenant supprimée car le bouton FAB est enlevé
  };

  const loadMore = () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    setCurrentPage(prev => prev + 1);
    
    // Délai d'animation pour montrer le chargement
    setTimeout(() => {
      setLoadingMore(false);
    }, 800);
  };
  
  // Composant pour le bouton "Charger plus"
  const LoadMoreButton = () => {
    // Ne pas afficher le bouton s'il n'y a pas de conversations ou si toutes sont déjà chargées
    if (conversations.length === 0 || conversations.length <= currentPage * conversationsPerPage) {
      return <View style={styles.loadMorePlaceholder} />;
    }
    
    return (
      <View style={styles.loadMoreContainer}>
        <Button 
          mode="outlined"
          onPress={loadMore}
          loading={loadingMore}
          style={styles.loadMoreButton}
          labelStyle={styles.loadMoreText}
          color="#6B3CE9"
          icon={loadingMore ? undefined : "chevron-down"}
        >
          {loadingMore ? 'Chargement...' : 'Voir plus de conversations'}
        </Button>
        
        {/* Espace supplémentaire en bas de la liste */}
        <View style={{ height: hp('8%') }} />
      </View>
    );
  };

  // Effet pour forcer un rafraîchissement après le chargement initial
  useEffect(() => {
    // Lorsque loading passe de true à false, c'est que les conversations ont été chargées pour la première fois
    if (!loading && conversations.length > 0 && isInitialLoadDone) {
      // Petit délai pour laisser l'interface se stabiliser
      const timer = setTimeout(() => {
        // Ne plus faire de rechargement automatique après le chargement initial
        if (isMounted.current && !refreshInterval.current) {
          // Configurer l'intervalle de rafraîchissement uniquement maintenant
          refreshInterval.current = setInterval(async () => {
            if (AppState.currentState === 'active' && isMounted.current) {
              await refreshMessages(false);
            }
          }, 60000); // Actualiser toutes les 60 secondes au lieu de 30
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, conversations.length, isInitialLoadDone]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* En-tête principal avec titre clair - style amélioré */}
      <Animated.View 
        style={[styles.headerContainer, { 
          borderBottomWidth: 1, 
          borderBottomColor: '#e0e0e0',
          backgroundColor: '#fff'
        }]}
        entering={FadeIn.duration(500)}
      >
        <Text style={styles.mainHeaderTitle}>Messages</Text>
        {unreadCount > 0 && (
          <Animated.View 
            style={styles.unreadCountContainer}
            entering={BounceIn.duration(500)}
          >
            <Text style={styles.unreadCountText}>{unreadCount}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Zone des messages - style amélioré */}
      <View style={{ 
        flex: 1, 
        backgroundColor: '#f8f9fa' 
      }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <RNAnimated.View
              style={{
                transform: [{
                  rotate: spinAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={50} color="#ff6b9b" />
            </RNAnimated.View>
            <Text style={styles.loadingText}>Chargement des conversations...</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item, index) => `${item.sender_id}-${item.recipient_id}-${index}`}
            contentContainerStyle={[
              styles.listContainer,
              conversations.length === 0 && styles.emptyList
            ]}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={conversations.length > 0 ? LoadMoreButton : null}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#ff6b9b']}
                tintColor="#ff6b9b"
                progressBackgroundColor="#ffffff"
              />
            }
            showsVerticalScrollIndicator={false}
            initialNumToRender={8}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={false}
            bounces={true}
            overScrollMode="never"
            scrollEventThrottle={16}
          />
        )}
      </View>
    </View>
  );
}

export default MessagesScreen; 