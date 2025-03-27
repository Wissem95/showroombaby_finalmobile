import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, RefreshControl, Platform, LogBox } from 'react-native';
import { Text, Surface, ActivityIndicator, Appbar, FAB, Badge, Avatar, Divider, Button } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://127.0.0.1:8000';
const placeholderImage = require('../../assets/placeholder.png');

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

export default function MessagesScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
      if (!token) {
        setLoading(false);
      }
    };
    
    checkAuthentication();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          getUserId();
          loadConversations();
          
          // Rafraîchir les conversations toutes les 15 secondes
          const interval = setInterval(loadConversations, 15000);
          return () => clearInterval(interval);
        } else {
          setLoading(false);
        }
      };
      
      loadData();
    }, [])
  );

  const getUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id ? parseInt(id) : null);
    } catch (error) {
      console.error('Erreur récupération ID utilisateur:', error);
    }
  };

  const loadConversations = async () => {
    try {
      // Obtenir le token et l'userId synchronement
      const token = await AsyncStorage.getItem('token');
      const userIdString = await AsyncStorage.getItem('userId');
      const currentUserId = userIdString ? parseInt(userIdString) : null;
      
      // Vérifier si l'utilisateur a changé pendant le chargement
      if (currentUserId === null) {
        console.log('Utilisateur déconnecté pendant le chargement des conversations');
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        setIsAuthenticated(false);
        return;
      }
      
      // Mettre à jour userId si nécessaire
      if (currentUserId !== userId) {
        console.log(`ID utilisateur mis à jour: ${currentUserId} (ancien: ${userId})`);
        setUserId(currentUserId);
      }
      
      if (!token) {
        console.log('Token non disponible, utilisateur probablement déconnecté');
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
          timeout: 10000 // Ajouter un timeout pour éviter les attentes infinies
        }
      );

      // Log détaillé pour déboguer
      console.log('Réponse API conversations:', JSON.stringify(response.data).substring(0, 500) + '...');
      console.log('Format de données reçu:', response.data ? typeof response.data : 'undefined');
      console.log('Format data.data:', response.data?.data ? typeof response.data.data : 'undefined');
      console.log('Format data.data.data:', response.data?.data?.data ? typeof response.data.data.data : 'undefined');
      console.log('Nombre de conversations reçues:', response.data?.data?.data?.length || 0);

      // Vérifier si les données sont présentes et valides
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        const conversationsData = response.data.data.data;
        
        // Regrouper les conversations par utilisateur mais préserver l'information du produit
        const userConversations = new Map<number, Conversation>();
        
        // Debug info
        console.log(`Regroupement des conversations avec currentUserId=${currentUserId}`);
        
        conversationsData.forEach((conv: Conversation) => {
          // Utiliser currentUserId au lieu de userId pour s'assurer que la valeur est disponible
          const otherUserId = conv.sender_id === currentUserId ? conv.recipient_id : conv.sender_id;
          
          console.log(`Conversation: sender=${conv.sender_id}, recipient=${conv.recipient_id}, otherUser=${otherUserId}, product_id=${conv.product_id || 'none'}`);
          
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
        console.log(`Conversations après regroupement: ${uniqueConversations.length}`);
        
        // Trier par date de création (plus récent en premier)
        uniqueConversations.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        console.log(`Conversations après tri: ${uniqueConversations.length}`);
        
        setConversations(uniqueConversations);
        
        // Compter les conversations non lues
        const unread = uniqueConversations.filter((conv: Conversation) => !conv.read).length;
        setUnreadCount(unread);
        console.log(`Conversations non lues: ${unread}`);
      } else {
        console.error('Format de données invalide:', response.data);
        setConversations([]);
      }
    } catch (error: any) {
      console.error('Erreur chargement conversations:', error);
      
      // Si erreur d'authentification, ne pas rediriger mais mettre à jour l'état
      if (error.response?.status === 401) {
        console.log('Erreur 401: Token expiré ou invalide');
        setIsAuthenticated(false);
      }
      
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

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
          source={{ uri: otherUser.avatar.startsWith('http') 
            ? otherUser.avatar 
            : `${API_URL}/storage/${otherUser.avatar}` 
          }} 
          style={styles.avatar}
        />
      );
    }
    
    return (
      <Avatar.Text 
        size={wp('12%')} 
        label={(otherUser?.username || 'U').charAt(0).toUpperCase()} 
        style={styles.avatar}
        color="#fff"
        theme={{ colors: { primary: '#ff6b9b' } }}
      />
    );
  };

  const loadProductDetails = async (productId: number, conversationId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      console.log(`Chargement des détails du produit #${productId} pour conversation #${conversationId}`);
      
      const response = await axios.get(`${API_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Vérifier explicitement le format de la réponse
      console.log(`Réponse du produit #${productId}:`, JSON.stringify(response.data).substring(0, 200) + '...');
      
      let productData;
      if (response.data && response.data.data) {
        productData = response.data.data;
        console.log("Format trouvé: response.data.data");
      } else if (response.data) {
        productData = response.data;
        console.log("Format trouvé: response.data");
      }
      
      if (productData) {
        console.log(`Mise à jour de la conversation #${conversationId} avec le produit #${productId}`);
        
        // S'assurer que les images sont correctement formatées
        if (productData.images && Array.isArray(productData.images)) {
          console.log(`Le produit a ${productData.images.length} images`);
        } else {
          console.log(`Le produit n'a pas d'images ou format incorrect:`, productData.images);
        }
        
        // Mettre à jour la conversation avec les détails du produit
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            if (conv.id === conversationId) {
              console.log(`Mise à jour conversation ${conversationId} avec produit:`, {
                id: productData.id,
                title: productData.title,
                price: productData.price,
                images: productData.images
              });
              return { 
                ...conv, 
                product: productData,
                product_id: productId 
              };
            }
            return conv;
          })
        );
      } else {
        console.error(`Format de données invalide pour le produit #${productId}`);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement du produit #${productId}:`, error);
    }
  };

  useEffect(() => {
    // Ne charger les détails des produits que si les conversations sont chargées et si l'utilisateur est authentifié
    if (conversations.length > 0 && isAuthenticated) {
      console.log(`Chargement des détails pour ${conversations.length} conversations`);
      
      conversations.forEach(conversation => {
        if (conversation.product_id) {
          console.log(`Vérification produit pour conversation #${conversation.id} avec product_id=${conversation.product_id}`);
          
          const productMissing = !conversation.product || !conversation.product.title;
          const productIdMismatch = conversation.product && conversation.product.id !== conversation.product_id;
          
          if (productMissing || productIdMismatch) {
            console.log(`Chargement nécessaire pour produit #${conversation.product_id} (missing=${productMissing}, mismatch=${productIdMismatch})`);
            loadProductDetails(conversation.product_id, conversation.id);
          } else {
            console.log(`Produit #${conversation.product_id} déjà chargé pour conversation #${conversation.id}`);
          }
        } else {
          console.log(`Pas de product_id pour conversation #${conversation.id}`);
        }
      });
    }
  }, [conversations, isAuthenticated]);

  useEffect(() => {
    // Réinitialiser les conversations si l'utilisateur change
    if (userId) {
      console.log(`Utilisateur connecté avec ID: ${userId}`);
      
      // Si les conversations n'ont pas encore été chargées
      if (loading && conversations.length === 0) {
        loadConversations();
      }
    } else {
      // Si pas d'userId, probablement déconnecté
      console.log('Réinitialisation des conversations - utilisateur déconnecté');
      setConversations([]);
      setUnreadCount(0);
    }
  }, [userId]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserId = item.sender_id === userId ? item.recipient_id : item.sender_id;
    const otherUser = item.sender_id === userId ? item.recipient : item.sender;
    
    // Déterminer le nom à afficher pour l'autre utilisateur (utiliser username s'il existe)
    const otherUserName = otherUser?.username || `Utilisateur #${otherUserId}`;
    
    // Déterminer le titre à afficher (nom du produit ou titre par défaut)
    const hasValidProduct = item.product !== undefined && item.product !== null && 
                           item.product.id !== undefined && 
                           item.product.title !== undefined;
    
    // Favoriser l'affichage du titre du produit s'il existe
    const productTitle = hasValidProduct ? item.product!.title : (item.product_id ? `Produit #${item.product_id}` : 'Conversation générale');
    
    // Prix formaté avec style
    const formattedPrice = item.product?.price 
      ? `${parseFloat(item.product.price.toString()).toFixed(2).replace('.', ',')}€` 
      : (item.product_id ? '??€' : '');
    
    // Image du produit
    const productImage = item.product?.images && item.product.images[0] 
      ? (typeof item.product.images[0] === 'string' && item.product.images[0].startsWith('http') 
          ? item.product.images[0] 
          : typeof item.product.images[0] === 'string'
            ? `${API_URL}/storage/${item.product.images[0]}`
            : typeof item.product.images[0] === 'object' && (item.product.images[0] as ImageType)?.path
              ? `${API_URL}/storage/${(item.product.images[0] as ImageType).path}`
              : null)
      : null;
    
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(300)}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onPress={() => {
            // Log pour vérifier les données passées
            const productIdToPass = item.product_id || (item.product ? item.product.id : undefined);
            console.log(`Navigation vers Chat avec: receiverId=${otherUserId}, productId=${productIdToPass}, productTitle=${productTitle}`);
            
            navigation.navigate('Chat', {
              receiverId: otherUserId,
              productTitle: productTitle,
              productId: productIdToPass
            });
          }}
          style={styles.conversationTouchable}
          activeOpacity={0.7}
        >
          {/* Wrapper pour gérer le problème d'overflow avec les ombres */}
          <View style={styles.cardShadowWrapper}>
            <Surface style={[styles.conversationCard, !item.read && styles.unreadCard]}>
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
                      {productImage ? (
                        <Image 
                          source={{ uri: productImage }}
                          style={styles.messageProductImage}
                          defaultSource={placeholderImage}
                        />
                      ) : hasValidProduct || item.product_id ? (
                        <View style={[styles.messageProductImage, {backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center'}]}>
                          <Ionicons name="image-outline" size={12} color="#999" />
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  // Style spécifique pour les conversations non lues
  unreadCard: {
    backgroundColor: '#fff9fb',
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
  // Image miniature du produit
  messageProductImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#e8e8e8',
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
  // Wrapper pour gérer les ombres autour des cartes
  cardShadowWrapper: {
    borderRadius: 12,
    overflow: 'visible',
    width: '100%',
  },
}); 