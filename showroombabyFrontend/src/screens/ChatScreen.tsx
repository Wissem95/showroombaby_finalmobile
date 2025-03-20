import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  LogBox
} from 'react-native';
import { Text, Surface, Avatar, Appbar, Divider, Button, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideInLeft,
  Layout
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'http://127.0.0.1:8000';
const DEFAULT_AVATAR_URL = 'https://ui-avatars.com/api/?background=ff6b9b&color=fff&name=User';
const placeholderImage = require('../../assets/placeholder.png');

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  created_at: string;
  product_id?: number;
  read: boolean;
}

interface Product {
  id: number;
  title: string;
  price: number;
  images?: string[];
  description: string;
}

interface Seller {
  id: number;
  username: string;
  avatar?: string;
}

interface ImageType {
  path?: string;
  url?: string;
}

type RootStackParamList = {
  Chat: {
    receiverId: number;
    productId?: number;
    productTitle?: string;
  };
  ProductDetails: {
    productId: number;
  };
  Home: undefined;
  Auth: undefined;
  Messages: undefined;
  Profile: undefined;
  Favoris: undefined;
  AjouterProduit: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const ErrorToast = ({ message, onDismiss }: { message: string, onDismiss: () => void }) => {
  return (
    <Animated.View 
      style={styles.errorToast}
      entering={SlideInRight.duration(400)}
      exiting={FadeOut.duration(300)}
    >
      <Surface style={styles.errorToastContent}>
        <Ionicons name="alert-circle" size={20} color="#fff" />
        <Text style={styles.errorToastText}>{message}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </Surface>
    </Animated.View>
  );
};

export default function ChatScreen({ route, navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const { receiverId, productId, productTitle } = route.params || {};
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  // S'assurer que les paramètres de route sont valides
  useEffect(() => {
    if (!receiverId) {
      Alert.alert('Erreur', 'Impossible de charger cette conversation.');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
    }
    
    // Masquer le message d'erreur Axios qui pourrait apparaître en bas de l'écran
    LogBox.ignoreLogs(['Error Response:', 'Erreur chargement produit:', 'AxiosError:']);
  }, [receiverId]);

  // Utilisez useFocusEffect pour recharger les données lorsque l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
      
      // Rafraîchir les messages toutes les 5 secondes
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    return () => {
      // Nettoyer le timeout à la démontage du composant
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setError(null); // Réinitialiser les erreurs précédentes
      
      // Exécuter les promesses en parallèle mais gérer individuellement les erreurs
      const userIdPromise = getUserId().catch(err => {
        console.error('Erreur chargement utilisateur:', err);
        return null;
      });
      
      const productPromise = loadProductDetails().catch(err => {
        console.error('Erreur chargement produit:', err);
        return null;
      });
      
      const sellerPromise = loadSellerDetails().catch(err => {
        console.error('Erreur chargement vendeur:', err);
        return null;
      });
      
      const messagesPromise = loadMessages().catch(err => {
        console.error('Erreur chargement messages:', err);
        return null;
      });
      
      await Promise.all([userIdPromise, productPromise, sellerPromise, messagesPromise]);
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      // Ne pas définir d'erreur globale pour permettre un affichage partiel
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMessages();
    } catch (error) {
      console.error('Erreur rafraîchissement:', error);
      setError('Une erreur est survenue lors du rafraîchissement.');
    } finally {
      setRefreshing(false);
    }
  };

  const showErrorToast = (message: string) => {
    setToastError(message);
    
    // Effacer automatiquement le toast après 3 secondes
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    
    toastTimeout.current = setTimeout(() => {
      setToastError(null);
    }, 3000);
  };

  const dismissErrorToast = () => {
    setToastError(null);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
  };

  const loadProductDetails = async () => {
    if (!productId && productId !== 0) {
      console.log('ID produit non défini, utilisation du titre seul');
      if (productTitle) {
        setProduct({
          id: 0,
          title: productTitle,
          price: 0,
          description: '',
          images: []
        });
      }
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(`Chargement des détails du produit #${productId}`);
      
      const response = await axios.get(`${API_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && (response.data.data || response.data)) {
        const productData = response.data.data || response.data;
        console.log('Données du produit chargées:', JSON.stringify(productData).substring(0, 200));
        setProduct(productData);
      } else {
        console.error('Format de réponse invalide pour le produit:', response.data);
        throw new Error('Format de données invalide');
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      showErrorToast('Impossible de charger les détails du produit');
      
      if (productTitle) {
        setProduct({
          id: productId || 0,
          title: productTitle,
          price: 0,
          description: 'Détails non disponibles',
          images: []
        });
      }
    }
  };

  const loadSellerDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Token non trouvé');
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/users/profile/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setSeller({
          id: response.data.id,
          username: response.data.username,
          avatar: response.data.avatar
        });
      } else {
        console.error('Format de réponse invalide pour les détails du vendeur');
      }
    } catch (error) {
      console.error('Erreur chargement vendeur:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Token non trouvé');
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/messages/conversation/${receiverId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.data) {
        // Obtenir tous les messages avec cet utilisateur, indépendamment du produit
        const allMessages = response.data.data;
        
        // Tri par date (plus récent en premier)
        allMessages.sort((a: Message, b: Message) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setMessages(allMessages);
        setLoading(false);
        
        // Faire défiler jusqu'au dernier message si c'est un nouveau message
        if (allMessages.length > 0 && messages.length !== allMessages.length) {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 300);
        }
      } else {
        console.error('Format de réponse invalide pour les messages');
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserId = async () => {
    const id = await AsyncStorage.getItem('userId');
    setUserId(id ? parseInt(id) : null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour envoyer un message.');
        setSending(false);
        return;
      }
      
      // Optimistic update - ajouter le message en local avant la confirmation du serveur
      const optimisticMessage: Message = {
        id: Math.random(), // ID temporaire
        sender_id: userId || 0,
        recipient_id: receiverId,
        content: messageText,
        created_at: new Date().toISOString(),
        product_id: productId || undefined, // Rendre optionnel
        read: false
      };
      
      setMessages(prevMessages => [optimisticMessage, ...prevMessages]);
      
      // Scroll to the new message
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
      
      // Paramètres de la requête API
      const messageData: any = {
        recipientId: receiverId,
        content: messageText,
      };
      
      // Ajouter productId uniquement s'il est défini
      if (productId) {
        messageData.productId = productId;
      }
      
      // Envoyer le message au serveur
      await axios.post(
        `${API_URL}/api/messages`,
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Recharger les messages après l'envoi pour avoir l'ID correct
      loadMessages();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer le message. Veuillez réessayer.'
      );
      
      // Supprimer le message optimiste en cas d'erreur
      setMessages(prevMessages => prevMessages.filter(msg => typeof msg.id === 'number' && msg.id > 0));
    } finally {
      setSending(false);
    }
  };

  const handleViewProduct = () => {
    if (product && product.id && product.id > 0) {
      navigation.navigate('ProductDetails', { productId: product.id });
    } else {
      showErrorToast('Détails du produit non disponibles');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isUser = item.sender_id === userId;
    const showDate = index === messages.length - 1 || 
      new Date(messages[index + 1].created_at).toDateString() !== new Date(item.created_at).toDateString();
    
    const messageDate = new Date(item.created_at);
    const isSameDay = index > 0 ? 
      new Date(messages[index - 1].created_at).toDateString() === messageDate.toDateString() : false;
    
    const isSameSender = index > 0 ? messages[index - 1].sender_id === item.sender_id : false;
    const showAvatar = !isUser && (!isSameSender || !isSameDay);
    
    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        
        <Animated.View
          entering={isUser ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
          style={[
            styles.messageBubble,
            isUser ? styles.sentMessage : styles.receivedMessage,
            !isSameSender && !isUser && { marginTop: 16 } // Ajouter un espace si l'expéditeur change
          ]}
        >
          {!isUser && showAvatar && (
            <Avatar.Text 
              size={30} 
              label={(seller?.username || 'U').charAt(0).toUpperCase()}
              style={styles.messageAvatar}
              color="#fff"
              theme={{ colors: { primary: '#ff6b9b' } }}
            />
          )}
          
          <Surface style={[
            styles.messageContent,
            isUser ? styles.sentMessageContent : styles.receivedMessageContent,
            !isUser && !showAvatar && styles.consecutiveMessage
          ]}>
            <Text style={[
              styles.messageText,
              isUser ? styles.sentMessageText : styles.receivedMessageText
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.messageTime,
              isUser ? styles.sentMessageTime : styles.receivedMessageTime
            ]}>
              {formatTime(item.created_at)}
            </Text>
          </Surface>
        </Animated.View>
      </>
    );
  };

  const renderEmptyChat = () => {
    const productName = product?.title || productTitle || "ce produit";
    
    return (
      <View style={styles.emptyChatWrapper}>
        <View style={styles.emptyChatContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={80} color="#ddd" />
          <Text style={styles.emptyChatTitle}>Aucun message</Text>
          <Text style={styles.emptyChatText}>
            Commencez la conversation en envoyant un message à propos de {productName}!
          </Text>
          <View style={{ marginTop: 20 }}>
            <Button 
              mode="contained" 
              style={{ backgroundColor: '#ff6b9b', borderRadius: 20 }}
              icon="send"
              onPress={() => inputRef.current?.focus()}
            >
              Envoyer un message
            </Button>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#ff6b9b" />
        <Text style={styles.loadingText}>Chargement de la conversation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={loadInitialData}
          style={styles.retryButton}
          buttonColor="#ff6b9b"
        >
          Réessayer
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container, 
        Platform.OS === 'ios' ? { paddingTop: 0 } : null 
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction 
          color="#555" 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          style={styles.backButton} 
        />
        
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={product && product.id > 0 ? handleViewProduct : undefined}
          activeOpacity={0.7}
        >
          <View style={styles.headerUserInfo}>
            {seller?.avatar ? (
              <Avatar.Image 
                size={26} 
                source={{ uri: seller.avatar.startsWith('http') 
                  ? seller.avatar 
                  : `${API_URL}/storage/${seller.avatar}` 
                }}
                style={styles.headerAvatar}
              />
            ) : (
              <Avatar.Text 
                size={26} 
                label={(seller?.username || 'U').charAt(0).toUpperCase()} 
                style={styles.headerAvatar}
                color="#fff"
                theme={{ colors: { primary: '#ff6b9b' } }}
              />
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {seller?.username || 'Vendeur'}
            </Text>
          </View>
          
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {product?.title || productTitle || 'Conversation générale'}
          </Text>
        </TouchableOpacity>
        
        {product && product.id > 0 && (
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={handleViewProduct}
          >
            <Ionicons name="information-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </Appbar.Header>

      {/* Section d'informations sur le produit améliorée - style Vinted */}
      {product && (
        <View style={styles.productCardWrapper}>
          <Surface style={styles.productInfoContainer}>
            <TouchableOpacity 
              style={styles.productInfoContent}
              onPress={product.id > 0 ? handleViewProduct : undefined}
              activeOpacity={0.8}
            >
              <View style={styles.productImageContainer}>
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <Image 
                    source={{ 
                      uri: typeof product.images[0] === 'string' && product.images[0].startsWith('http') 
                        ? product.images[0] 
                        : typeof product.images[0] === 'string' 
                          ? `${API_URL}/storage/${product.images[0]}`
                          : typeof product.images[0] === 'object' && (product.images[0] as ImageType)?.path
                            ? `${API_URL}/storage/${(product.images[0] as ImageType).path}`
                            : DEFAULT_AVATAR_URL
                    }}
                    style={styles.productImage}
                    defaultSource={placeholderImage}
                    onError={(e) => {
                      console.log('Erreur chargement image:', e.nativeEvent.error);
                    }}
                  />
                ) : (
                  <View style={styles.placeholderImageContainer}>
                    <Ionicons name="image-outline" size={24} color="#bbb" />
                  </View>
                )}
              </View>
              
              <View style={styles.productDetails}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title || productTitle || 'Produit sans nom'}
                </Text>
                <View style={styles.priceContainer}>
                  <View style={styles.priceTag}>
                    <Text style={styles.productPrice}>
                      {typeof product.price === 'number' 
                        ? `${parseFloat(product.price.toString()).toFixed(2).replace('.', ',')} €`
                        : '0,00 €'}
                    </Text>
                  </View>
                  {product.id > 0 && (
                    <Text style={styles.viewProductText}>Voir l'annonce</Text>
                  )}
                </View>
              </View>
              
              {product.id > 0 && (
                <IconButton
                  icon="chevron-right"
                  size={20}
                  iconColor="#666"
                  onPress={handleViewProduct}
                />
              )}
            </TouchableOpacity>
          </Surface>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.messagesContainer,
          messages.length === 0 && styles.emptyContainer
        ]}
        inverted={true}
        ListEmptyComponent={renderEmptyChat}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff6b9b']}
            tintColor="#ff6b9b"
          />
        }
      />

      <Surface style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Écrire un message..."
          placeholderTextColor="#999"
          style={styles.input}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          onPress={sendMessage}
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size={24} color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </Surface>

      {/* Afficher le toast d'erreur s'il y en a un */}
      {toastError && (
        <ErrorToast message={toastError} onDismiss={dismissErrorToast} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
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
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  header: {
    backgroundColor: '#ffffff',
    elevation: 2,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerContent: {
    flex: 1,
    marginLeft: 4,
    justifyContent: 'flex-start',
    paddingVertical: 0,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    marginTop: 0,
  },
  headerAvatar: {
    marginRight: 6,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    paddingTop: 0,
    marginTop: 0,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B3CE9',
    fontWeight: '500',
    marginLeft: 34,
    marginTop: -2,
  },
  headerAction: {
    padding: 2,
    marginRight: 4,
  },
  productCardWrapper: {
    overflow: 'visible',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  productInfoContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  productInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 65,
  },
  productImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  placeholderImageContainer: {
    width: 56, 
    height: 56,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceTag: {
    backgroundColor: 'rgba(255,107,155,0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,107,155,0.1)',
    marginRight: 10,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff6b9b',
  },
  viewProductText: {
    fontSize: 12,
    color: '#6B3CE9',
    textDecorationLine: 'underline',
  },
  messagesContainer: {
    padding: 8,
    paddingBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatWrapper: {
    transform: [{ rotate: '180deg' }],
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 1,
    maxWidth: '85%',
  },
  messageAvatar: {
    marginRight: 4,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    marginLeft: 16,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    marginRight: 16,
  },
  messageContent: {
    borderRadius: 16,
    padding: 8,
    paddingHorizontal: 12,
    minWidth: 60,
    maxWidth: '100%',
  },
  sentMessageContent: {
    backgroundColor: '#ff6b9b',
    borderBottomRightRadius: 4,
  },
  receivedMessageContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  consecutiveMessage: {
    marginLeft: 28,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedMessageTime: {
    color: '#999',
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#ff6b9b',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ffb3cb',
  },
  errorToast: {
    position: 'absolute',
    bottom: 64,
    right: 0,
    left: 0,
    zIndex: 999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorToastContent: {
    backgroundColor: 'rgba(255, 70, 70, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxWidth: '90%',
  },
  errorToastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 10,
    flex: 1,
  },
  backButton: {
    marginRight: 0,
    padding: 0,
  },
}); 