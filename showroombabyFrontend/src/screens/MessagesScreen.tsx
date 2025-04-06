import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, RefreshControl, Platform, LogBox } from 'react-native';
import { Text, Surface, ActivityIndicator, Appbar, FAB, Badge, Avatar, Divider, Button } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Ignorer les avertissements non critiques
LogBox.ignoreLogs([
  'When you set overflow',  // Ignorer les avertissements liés aux ombres des composants Surface
  'VirtualizedLists should never be nested',
  'Warning: Failed prop type'
]);

// Adapter l'URL de l'API en fonction de la plateforme
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.2:8000'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';

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

const EmptyConversationsList = ({ navigation, isAuthenticated }: { navigation: any, isAuthenticated: boolean }) => {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={wp('20%')} color="#ddd" />
      <Text style={styles.emptyText}>
        {isAuthenticated ? 'Aucune conversation pour le moment.' : 'Vous n\'êtes pas connecté'}
      </Text>
      <Text style={styles.emptySubText}>
        {isAuthenticated 
          ? 'Commencez à chatter avec des vendeurs pour voir vos conversations ici.'
          : 'Vous devez être connecté pour accéder à vos messages.'}
      </Text>
      
      {!isAuthenticated ? (
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Auth')}
            style={{
              marginTop: 20,
              backgroundColor: '#ff6b9b',
              borderRadius: 25,
              paddingHorizontal: 20
            }}
          >
            Se connecter
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Home')}
            style={{
              marginTop: 12,
              borderColor: '#ff6b9b',
              borderRadius: 25,
              paddingHorizontal: 20
            }}
            textColor="#ff6b9b"
          >
            Retour à l'accueil
          </Button>
        </View>
      ) : (
        <Button 
          mode="outlined" 
          onPress={() => navigation.navigate('Home')}
          style={{
            marginTop: 20,
            borderColor: '#ff6b9b',
            borderRadius: 25,
            paddingHorizontal: 20
          }}
          textColor="#ff6b9b"
        >
          Explorer des produits
        </Button>
      )}
    </View>
  );
};

// Fonction utilitaire simplifiée pour résoudre les URL d'images
const getImageUrl = (image: any): string => {
  if (!image) return DEFAULT_AVATAR_URL;
  
  if (typeof image === 'string') {
    return image.startsWith('http') ? image : `${API_URL}/storage/${image}`;
  }
  
  return DEFAULT_AVATAR_URL;
};

export default function MessagesScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const conversationsPerPage = 10; // Nombre de conversations à charger par page
  
  // Référence pour stocker les produits en cours de chargement
  const loadingProducts = useRef<Record<string, boolean>>({});

  // Nettoyage des composants démontés pour éviter les fuites mémoire
  const isMounted = React.useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    
    const checkAuthentication = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
      if (!token) {
        setLoading(false);
      }
    };
    
    checkAuthentication();
    
    // Cleanup lors du démontage
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let intervalId: NodeJS.Timeout | null = null;
      const loadData = async () => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          getUserId();
          // Charger les conversations une seule fois au début
          await loadConversations();
          
          // Rafraîchir les conversations toutes les 30 secondes au lieu de 15
          // et stocker l'ID de l'intervalle pour pouvoir l'annuler
          intervalId = setInterval(loadConversations, 30000);
          
          // Force refresh des images uniquement au premier chargement ou quand pas d'images
          // pas à chaque focus pour éviter le clignotement
          if (conversations.length > 0) {
            conversations.slice(0, 5).forEach(conversation => {
              if (conversation.product_id && 
                  (!conversation.product?.images || 
                   !Array.isArray(conversation.product.images) || 
                   conversation.product.images.length === 0)) {
                loadProductDetails(conversation.product_id, conversation.id);
              }
            });
          }
        } else {
          setLoading(false);
        }
      };
      
      loadData();
      
      // Fonction de nettoyage pour annuler l'intervalle quand l'écran n'est plus en focus
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, []) // Supprimer la dépendance à conversations pour éviter les boucles
  );

  const getUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id ? parseInt(id) : null);
    } catch (error) {
      console.error('Erreur récupération ID utilisateur');
    }
  };

  const loadConversations = async () => {
    // Utiliser les abortController pour annuler les requêtes en cas de démontage
    const abortController = new AbortController();
    
    try {
      // Ne pas continuer si le composant est démonté
      if (!isMounted.current) return;
      
      const signal = abortController.signal;
      
      // Obtenir le token et l'userId synchronement
      const token = await AsyncStorage.getItem('token');
      const userIdString = await AsyncStorage.getItem('userId');
      const currentUserId = userIdString ? parseInt(userIdString) : null;
      
      // Vérifier si l'utilisateur a changé pendant le chargement
      if (currentUserId === null) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        setIsAuthenticated(false);
        return;
      }
      
      // Mettre à jour userId si nécessaire
      if (currentUserId !== userId) {
        setUserId(currentUserId);
      }
      
      if (!token) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        setIsAuthenticated(false);
        return;
      }
      
      // Mettre à jour l'état d'authentification
      setIsAuthenticated(true);
      
      const response = await axios.get(
        `${API_URL}/api/messages/conversations`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // Ajouter un timeout pour éviter les attentes infinies
          signal: signal
        }
      );

      // Vérifier si les données sont présentes et valides
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        const conversationsData = response.data.data.data;
        
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
            let productImages = [];
            
            // Traitement des images du produit
            try {
              if (conv.product_images) {
                // Si les images sont déjà sous forme de tableau
                if (Array.isArray(conv.product_images)) {
                  productImages = conv.product_images;
                } 
                // Si les images sont une chaîne JSON
                else if (typeof conv.product_images === 'string') {
                  try {
                    // Essayer de parser le JSON
                    productImages = JSON.parse(conv.product_images);
                  } catch (error) {
                    // Si le parsing échoue, mais que la chaîne ressemble à un chemin d'image, on l'utilise directement
                    if (conv.product_images.includes('.jpg') || 
                        conv.product_images.includes('.jpeg') || 
                        conv.product_images.includes('.png') ||
                        conv.product_images.includes('/') ||
                        conv.product_images.includes('http')) {
                      productImages = [conv.product_images];
                    } else {
                      // Même si la chaîne ne ressemble pas à un chemin, essayons de l'utiliser directement
                      productImages = [conv.product_images];
                    }
                  }
                } else if (typeof conv.product_images === 'object' && conv.product_images !== null) {
                  // Si c'est un objet mais pas un tableau, essayer de l'utiliser directement
                  productImages = [conv.product_images];
                }
                
                // Vérification supplémentaire pour s'assurer que c'est un tableau
                if (!Array.isArray(productImages)) {
                  productImages = [];
                }
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
        
        // Regrouper les conversations par utilisateur mais préserver l'information du produit
        const userConversations = new Map<number, Conversation>();
        
        // Vérifier pour chaque conversation si on a bien les infos utilisateur
        processedConversations.forEach((conv: Conversation) => {
          // Utiliser currentUserId au lieu de userId pour s'assurer que la valeur est disponible
          const otherUserId = conv.sender_id === currentUserId ? conv.recipient_id : conv.sender_id;
          
          // Si cette conversation a un produit et que nous n'avons pas encore de conversation avec cet utilisateur
          // ou si nous avons déjà une conversation mais sans produit, privilégier celle avec un produit
          if (!userConversations.has(otherUserId) || 
              (conv.product_id && !userConversations.get(otherUserId)!.product_id) ||
              (conv.product_id && userConversations.get(otherUserId)!.product_id && 
               new Date(conv.created_at) > new Date(userConversations.get(otherUserId)!.created_at))) {
            userConversations.set(otherUserId, conv);
          } 
          // Si pas de produit dans cette conversation mais qu'elle est plus récente
          else if (!conv.product_id && 
                   new Date(conv.created_at) > new Date(userConversations.get(otherUserId)!.created_at)) {
            userConversations.set(otherUserId, conv);
          }
        });
        
        // Convertir la Map en tableau
        const uniqueConversations = Array.from(userConversations.values());
        
        // Trier par date de création (plus récent en premier)
        uniqueConversations.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setConversations(uniqueConversations);
        
        // Compter les conversations non lues
        const unread = uniqueConversations.filter((conv: Conversation) => !conv.read).length;
        setUnreadCount(unread);
      } else {
        console.error('Format de données invalide');
        setConversations([]);
      }
    } catch (error: any) {
      if (!axios.isCancel(error)) {
        // Éviter d'afficher trop d'erreurs dans la console
        
        // Si erreur d'authentification, ne pas rediriger mais mettre à jour l'état
        if (error.response?.status === 401) {
          setIsAuthenticated(false);
        }
        
        setConversations([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    
    // Retourner une fonction de nettoyage
    return () => {
      abortController.abort();
    };
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
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

  const renderAvatar = (conversation: Conversation) => {
    const otherUser = conversation.sender_id === userId ? conversation.recipient : conversation.sender;
    
    if (otherUser?.avatar) {
      return (
        <Avatar.Image 
          size={wp('12%')} 
          source={{ uri: getImageUrl(otherUser.avatar) }} 
          style={styles.avatar}
        />
      );
    }
    
    return (
      <Avatar.Text 
        size={wp('12%')} 
        label={(otherUser?.username?.[0] || 'U').toUpperCase()} 
        style={styles.avatar}
        color="#fff"
        theme={{ colors: { primary: '#ff6b9b' } }}
      />
    );
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
      if (!isMounted.current) return;
      
      // Vérifier si ce produit est déjà en cours de chargement pour éviter les doublons
      const productLoadingKey = `loading_product_${productId}_${conversationId}`;
      if (loadingProducts.current[productLoadingKey]) {
        return;
      }
      
      // Marquer comme en cours de chargement
      loadingProducts.current[productLoadingKey] = true;
      
      // Récupérer le token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        loadingProducts.current[productLoadingKey] = false;
        return;
      }
      
      // Appel API pour obtenir les détails du produit
      const response = await axios.get(`${API_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
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
        const productLoadingKey = `loading_product_${productId}_${conversationId}`;
        loadingProducts.current[productLoadingKey] = false;
      }
    }
  };

  useEffect(() => {
    // Réinitialiser les conversations si l'utilisateur change
    if (userId) {
      // Si les conversations n'ont pas encore été chargées
      if (loading && conversations.length === 0) {
        loadConversations();
      }
    } else {
      // Si pas d'userId, probablement déconnecté
      setConversations([]);
      setUnreadCount(0);
    }
  }, [userId]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    // Tentative de chargement du produit si nécessaire
    if (item.product_id && (!item.product || !item.product.images || item.product.images.length === 0)) {
      // On déclenche le chargement des détails dans le rendu
      loadProductDetails(item.product_id, item.id);
    }
    
    const otherUserId = item.sender_id === userId ? item.recipient_id : item.sender_id;
    const otherUser = item.sender_id === userId ? item.recipient : item.sender;
    
    // Déterminer le nom à afficher pour l'autre utilisateur
    const otherUserName = otherUser?.username || `Utilisateur #${otherUserId}`;
    
    // Déterminons si le produit est valide
    const hasValidProduct = !!item.product && !!item.product.id && !!item.product.title;
    
    // Titre et prix du produit
    const productTitle = hasValidProduct ? item.product!.title : (item.product_id ? `Produit #${item.product_id}` : 'Conversation générale');
    
    const formattedPrice = item.product?.price 
      ? `${parseFloat(item.product.price.toString()).toFixed(2).replace('.', ',')}€` 
      : (item.product_id ? '??€' : '');
    
    // Vérification simple de l'existence des images
    const hasImages = !!item.product && 
                    !!item.product.images && 
                    Array.isArray(item.product.images) && 
                    item.product.images.length > 0;
    
    // Préparer directement l'URL de l'image avec le format correct
    let imageUrl = '';
    if (hasImages) {
      const image = item.product!.images![0];
      if (typeof image === 'string') {
        imageUrl = image.startsWith('http') ? image : `${API_URL}/storage/${image}`;
      } else if (image && typeof image === 'object') {
        const imgObj = image as any;
        if (imgObj.path) {
          imageUrl = imgObj.path.startsWith('http') ? imgObj.path : `${API_URL}/storage/${imgObj.path}`;
        } else if (imgObj.url) {
          imageUrl = imgObj.url;
        }
      }
    }

    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(300)}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Chat', {
              receiverId: otherUserId,
              productTitle: productTitle,
              productId: item.product_id || (item.product ? item.product.id : undefined)
            });
          }}
          style={styles.conversationTouchable}
          activeOpacity={0.7}
        >
          {/* Wrapper externe pour gérer les ombres correctement */}
          <View style={styles.cardOuterWrapper}>
            <Surface style={styles.conversationSurface}>
              {/* Wrapper interne avec overflow:hidden pour gérer les coins arrondis */}
              <View style={[styles.conversationCard, !item.read && styles.unreadCard]}>
                <View style={styles.conversationMain}>
                  <View style={styles.conversationContent}>
                    {renderAvatar(item)}
                    
                    <View style={styles.textContainer}>
                      <View style={styles.headerRow}>
                        <Text 
                          style={[
                            styles.userName, 
                            !item.read && styles.unreadText
                          ]} 
                          numberOfLines={1}
                        >
                          {otherUserName}
                        </Text>
                        <Text style={styles.timeText}>
                          {formatDate(item.created_at)}
                        </Text>
                      </View>
                      
                      <View style={styles.productInfoRow}>
                        {item.product_id ? (
                          <View style={styles.productImageContainer}>
                            <Image 
                              source={hasImages && imageUrl ? { uri: imageUrl } : placeholderImage}
                              style={styles.productImage}
                            />
                          </View>
                        ) : null}
                        
                        <Text 
                          style={[
                            styles.productTitle, 
                            !item.read && { fontWeight: '700' },
                            !hasValidProduct && { color: '#888', fontStyle: 'italic' }
                          ]} 
                          numberOfLines={1}
                        >
                          {productTitle}
                        </Text>
                        
                        {formattedPrice && (
                          <View style={styles.priceBadgeContainer}>
                            <Text style={styles.messagePriceTag}>
                              {formattedPrice}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text 
                        style={[
                          styles.lastMessage, 
                          !item.read && styles.unreadText
                        ]} 
                        numberOfLines={1}
                      >
                        {item.content}
                      </Text>
                    </View>
                    
                    {!item.read && (
                      <Badge size={wp('2.5%')} style={styles.unreadBadge} />
                    )}
                  </View>
                </View>
              </View>
            </Surface>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyComponent = () => (
    <EmptyConversationsList navigation={navigation} isAuthenticated={isAuthenticated} />
  );

  const handleNewMessage = () => {
    // Ici on pourrait naviguer vers une liste de produits ou des vendeurs
    // Pour l'instant, on navigue simplement vers l'écran Explore
    navigation.navigate('Explore');
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
          labelStyle={styles.loadMoreButtonText}
          color="#ff6b9b"
          icon={loadingMore ? undefined : "chevron-down"}
        >
          {loadingMore ? 'Chargement...' : 'Voir plus d\'anciens messages'}
        </Button>
        
        {/* Espace supplémentaire pour s'assurer que le bouton est visible au-dessus du FAB */}
        <View style={{ height: hp('8%') }} />
      </View>
    );
  };

  // Effet pour forcer un rafraîchissement après le chargement initial
  useEffect(() => {
    // Lorsque loading passe de true à false, c'est que les conversations ont été chargées pour la première fois
    if (!loading && conversations.length > 0) {
      // Petit délai pour laisser l'interface se stabiliser
      const timer = setTimeout(() => {
        // Force refresh pour s'assurer que les images s'affichent correctement
        if (isMounted.current) {
          loadConversations();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, conversations.length]);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Messages" titleStyle={styles.headerTitle} />
        {unreadCount > 0 && (
          <View style={styles.unreadCountContainer}>
            <Text style={styles.unreadCountText}>{unreadCount}</Text>
          </View>
        )}
      </Appbar.Header>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b9b" />
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
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          ListFooterComponent={conversations.length > 0 ? LoadMoreButton : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff6b9b']}
              tintColor="#ff6b9b"
            />
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={handleNewMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Conteneur principal de l'écran
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // En-tête de l'application avec le titre "Messages"
  header: {
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: hp('-5%'),
  },
  // Style du titre dans l'en-tête
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
  },
  // Conteneur pour l'indicateur de chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Texte affiché pendant le chargement
  loadingText: {
    marginTop: hp('2%'),
    color: '#666',
    fontSize: wp('4%'),
  },
  // Conteneur pour l'état vide (aucune conversation)
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('8%'),
  },
  // Texte principal affiché quand la liste est vide
  emptyText: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    marginTop: hp('3%'),
  },
  // Texte secondaire affiché quand la liste est vide
  emptySubText: {
    fontSize: wp('3.5%'),
    color: '#888',
    textAlign: 'center',
    marginTop: hp('1%'),
    lineHeight: wp('5%'),
  },
  // Style pour la liste vide (pour centrer le contenu)
  emptyList: {
    flex: 1,
  },
  // Conteneur de la liste des conversations
  listContainer: {
    paddingVertical: hp('1%'),
  },
  // Zone cliquable pour chaque conversation
  conversationTouchable: {
    marginHorizontal: wp('3%'),
    marginVertical: hp('0.8%'),
    borderRadius: 12,
  },
  // Carte représentant une conversation dans la liste
  conversationCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  // Style spécifique pour les conversations non lues
  unreadCard: {
    backgroundColor: '#fff9fb',
  },
  // Surface pour la conversation avec les ombres
  conversationSurface: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    overflow: 'visible',
  },
  // Wrapper externe pour gérer les ombres
  cardOuterWrapper: {
    borderRadius: 12,
    overflow: 'visible',
    width: '100%',
  },
  // Partie principale de la carte de conversation
  conversationMain: {
    flex: 1,
  },
  // Disposition du contenu de la conversation
  conversationContent: {
    flexDirection: 'row',
    padding: wp('3%'),
    alignItems: 'center',
    position: 'relative',
  },
  // Style de l'avatar dans la conversation
  avatar: {
    marginRight: wp('2.5%'),
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#ff6b9b',
  },
  // Conteneur des textes (nom, produit, message)
  textContainer: {
    flex: 1,
    marginRight: wp('2%'),
  },
  // Ligne d'en-tête avec le nom et l'heure
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.3%'),
  },
  // Style du nom d'utilisateur
  userName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  // Style de l'heure du message
  timeText: {
    fontSize: wp('3%'),
    color: '#999',
  },
  // Ligne contenant les infos du produit
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  // Titre du produit discuté
  productTitle: {
    fontSize: wp('3.5%'),
    color: '#6B3CE9',
    fontWeight: '500',
    flex: 1,
  },
  // Badge contenant le prix
  priceBadgeContainer: {
    marginLeft: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,107,155,0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,107,155,0.1)',
  },
  // Style du prix dans le badge
  messagePriceTag: {
    fontSize: wp('3.2%'),
    color: '#ff6b9b',
    fontWeight: '700',
  },
  // Style du dernier message
  lastMessage: {
    fontSize: wp('3.4%'),
    color: '#666',
    lineHeight: wp('4.2%'),
    marginTop: 2,
  },
  // Style pour le texte des messages non lus
  unreadText: {
    fontWeight: '600',
    color: '#333',
  },
  // Badge indiquant un message non lu
  unreadBadge: {
    backgroundColor: '#ff6b9b',
    position: 'absolute',
    right: wp('4%'),
    top: hp('4%'),
  },
  // Conteneur pour les boutons
  buttonContainer: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  // Conteneur du compteur de messages non lus
  unreadCountContainer: {
    backgroundColor: '#ff6b9b',
    borderRadius: 15,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    marginRight: wp('3%'),
    minWidth: wp('5%'),
    alignItems: 'center',
  },
  // Texte du compteur de messages non lus
  unreadCountText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: '600',
  },
  // Séparateur entre les conversations
  divider: {
    marginHorizontal: wp('4%'),
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  // Bouton flottant pour créer un nouveau message
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#ff6b9b',
  },
  // Style de l'image du produit
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  // Conteneur pour les images du produit
  productImageContainer: {
    width: 45,
    height: 45,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  // Placeholder pour les images du produit
  placeholderImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  // Conteneur pour le bouton "Charger plus"
  loadMoreContainer: {
    width: '100%',
    padding: wp('4%'),
    alignItems: 'center',
  },
  // Style du bouton "Charger plus"
  loadMoreButton: {
    backgroundColor: '#fff',
    borderColor: '#ff6b9b',
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  // Style du texte du bouton "Charger plus"
  loadMoreButtonText: {
    color: '#ff6b9b',
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
  // Style pour le bouton "Charger plus"
  loadMorePlaceholder: {
    height: hp('8%'),
  },
}); 