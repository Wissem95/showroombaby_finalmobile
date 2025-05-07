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
  LogBox,
  Animated as RNAnimated
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
  Layout,
  BounceIn,
  ZoomIn
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import imageService from '../services/api/imageService';

// API URL
// Pour les appareils externes, utiliser votre adresse IP locale au lieu de 127.0.0.1
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? 'http://172.20.10.3:8000/api'  // Adresse IP locale de l'utilisateur
  : 'https://api.showroombaby.com';
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
    fullscreenMode?: boolean;
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
  // Animation de pulse pour le bouton d'envoi
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

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

  useEffect(() => {
    if (loading) {
      // Animation de rotation pour l'icône de chargement
      RNAnimated.loop(
        RNAnimated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true
        })
      ).start();
    } else if (newMessage.trim().length > 0) {
      // Animation de pulse pour le bouton d'envoi quand on a du texte
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, {
            toValue: 1.08, 
            duration: 800,
            useNativeDriver: true
          }),
          RNAnimated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      RNAnimated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [newMessage, loading]);

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
      
      const response = await axios.get(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
        console.log(`Produit #${productId} chargé avec succès:`, {
          id: productData.id,
          title: productData.title,
          price: productData.price
        });
        
        // Vérifier les images
        if (productData.images && Array.isArray(productData.images)) {
          console.log(`Le produit a ${productData.images.length} images`);
          
          // Si l'image est un objet complexe, assurons-nous qu'elle est correctement formatée
          if (productData.images.length > 0 && typeof productData.images[0] === 'object') {
            console.log(`Format de la première image:`, JSON.stringify(productData.images[0]));
          }
        } else {
          console.log(`Le produit n'a pas d'images ou format incorrect:`, productData.images);
          productData.images = []; // Initialiser un tableau vide pour éviter les erreurs
        }
        
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
        console.log('Token non trouvé');
        return;
      }
      
      console.log(`Chargement des détails de l'utilisateur ${receiverId}`);
      
      // Utilisation de l'endpoint spécifique pour les profils utilisateur
      const response = await axios.get(`${API_URL}/users/profile/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.data) {
        // Le backend retourne les données au format {status: 'success', data: {...}}
        console.log(`Données utilisateur complètes:`, JSON.stringify(response.data.data));
        
        // Le champ data.username est prioritaire selon le backend
        const userData = response.data.data;
        
        // Utilisation du champ username fourni directement par l'API
        setSeller({
          id: userData.id || receiverId,
          username: userData.username || userData.name || '',
          avatar: userData.avatar
        });
      } else if (response.data) {
        // Format alternatif sans data imbriqué
        console.log(`Données utilisateur complètes (format alternatif):`, JSON.stringify(response.data));
        
        const userData = response.data;
        setSeller({
          id: userData.id || receiverId,
          username: userData.username || userData.name || '',
          avatar: userData.avatar
        });
      } else {
        console.log('Format de réponse invalide pour les détails du vendeur');
        
        // Requête alternative en utilisant l'endpoint standard des utilisateurs
        try {
          const userResponse = await axios.get(`${API_URL}/users/${receiverId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userResponse.data && userResponse.data.data) {
            const userData = userResponse.data.data;
            console.log(`Données utilisateur alternatives:`, JSON.stringify(userData));
            
            setSeller({
              id: receiverId,
              username: userData.username || userData.name || '',
              avatar: userData.avatar
            });
          } else if (userResponse.data) {
            const userData = userResponse.data;
            setSeller({
              id: receiverId,
              username: userData.username || userData.name || '',
              avatar: userData.avatar
            });
          }
        } catch (err) {
          console.log('Erreur lors de la requête alternative:', err);
        }
      }
    } catch (error) {
      console.log('Erreur chargement vendeur:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Token non trouvé');
        return;
      }

      // Créer l'URL de l'API avec le paramètre productId si disponible
      let apiUrl = `${API_URL}/messages/conversation/${receiverId}`;
      if (productId) {
        apiUrl += `?productId=${productId}`;
      }
      
      console.log(`Chargement des messages: ${apiUrl}`);

      const response = await axios.get(
        apiUrl,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.data) {
        // Obtenir les messages pour cet utilisateur et ce produit spécifique
        let allMessages = response.data.data;
        
        console.log(`Reçu ${allMessages.length} messages avec l'utilisateur ${receiverId}`);
        
        // Filtrage côté client pour s'assurer que les messages correspondent au produit actuel
        if (productId) {
          allMessages = allMessages.filter((message: Message) => 
            !message.product_id || message.product_id === productId
          );
          console.log(`Après filtrage par productId ${productId}: ${allMessages.length} messages`);
        }
        
        // Si nous n'avons pas encore les infos du vendeur et qu'il y a des messages
        if (!seller && allMessages.length > 0) {
          // Trouver un message de l'autre utilisateur
          const otherUserMessage = allMessages.find((m: Message) => m.sender_id === receiverId);
          if (otherUserMessage && otherUserMessage.sender) {
            console.log(`Infos utilisateur trouvées dans les messages:`, JSON.stringify(otherUserMessage.sender));
            
            // Vérifier toutes les propriétés possibles pour le nom
            const username = 
              otherUserMessage.sender.username || 
              otherUserMessage.sender.name ||
              otherUserMessage.sender.fullname || 
              otherUserMessage.sender.full_name;
            
            console.log(`Nom utilisateur extrait des messages: "${username}"`);
            
            setSeller({
              id: receiverId,
              username: username,
              avatar: otherUserMessage.sender.avatar
            });
          } else {
            console.log(`Aucune info utilisateur trouvée dans les messages, appel à loadSellerDetails nécessaire`);
            loadSellerDetails();
          }
        }
        
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
        `${API_URL}/messages`,
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
      navigation.navigate('ProductDetails', { productId: product.id, fullscreenMode: true });
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
    
    // Récupérer le nom d'utilisateur directement à partir du message
    const otherUser = isUser ? item.recipient : item.sender;
    
    // On utilise seller?.username comme fallback uniquement si disponible
    const otherUserName = otherUser?.username || seller?.username || '';
    
    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        
        <Animated.View
          entering={isUser ? SlideInRight.duration(300).springify() : SlideInLeft.duration(300).springify()}
          layout={Layout.springify()}
          style={[
            styles.messageBubble,
            isUser ? styles.sentMessage : styles.receivedMessage,
            !isSameSender && !isUser && { marginTop: 16 } // Ajouter un espace si l'expéditeur change
          ]}
        >
          {!isUser && showAvatar && (
            <Avatar.Text 
              size={32} 
              label={(otherUser?.username?.[0] || seller?.username?.[0] || 'U').toUpperCase()}
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
            <View style={styles.messageTimeContainer}>
              <Text style={[
                styles.messageTime,
                isUser ? styles.sentMessageTime : styles.receivedMessageTime
              ]}>
                {formatTime(item.created_at)}
              </Text>
              {isUser && (
                <Ionicons 
                  name={item.read ? "checkmark-done" : "checkmark"} 
                  size={12} 
                  color="rgba(255,255,255,0.8)" 
                  style={{marginLeft: 2}}
                />
              )}
            </View>
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

  // Fonction pour obtenir l'URL d'image d'un produit
  const getProductImageUrl = (product?: Product | null): string => {
    if (!product) {
      return DEFAULT_AVATAR_URL;
    }
    
    return imageService.getFullImageUrl(imageService.getProductImages(product)[0] || null) || DEFAULT_AVATAR_URL;
  };

  const onFocus = () => {
    // Faire défiler jusqu'au dernier message quand le champ de saisie est activé
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <RNAnimated.View 
          style={{
            transform: [{
              rotate: pulseAnim.interpolate({
                inputRange: [1, 1.08],
                outputRange: ['0deg', '10deg']
              })
            }]
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={50} color="#ff6b9b" />
        </RNAnimated.View>
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
          color="#ff6b9b" 
          size={28}
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
                label={(seller?.username?.[0] || 'U').toUpperCase()} 
                style={styles.headerAvatar}
                color="#fff"
                theme={{ colors: { primary: '#ff6b9b' } }}
              />
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {seller?.username}
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
        <Animated.View 
          entering={FadeIn.duration(500).delay(200)}
          style={styles.productCardWrapper}
        >
          <Surface style={styles.productInfoContainer}>
            <TouchableOpacity 
              style={styles.productInfoContent}
              onPress={product.id > 0 ? handleViewProduct : undefined}
              activeOpacity={0.8}
            >
              <Animated.View 
                entering={ZoomIn.duration(400).delay(300)}
                style={styles.productImageContainer}
              >
                {product.images && product.images.length > 0 ? (
                  <Image 
                    source={{ uri: getProductImageUrl(product) }}
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
              </Animated.View>
              
              <Animated.View 
                entering={SlideInRight.duration(400).delay(300)}
                style={styles.productDetails}
              >
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
              </Animated.View>
              
              {product.id > 0 && (
                <Animated.View entering={FadeIn.duration(500).delay(400)}>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor="#666"
                    onPress={handleViewProduct}
                  />
                </Animated.View>
              )}
            </TouchableOpacity>
          </Surface>
        </Animated.View>
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
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
      />

      <Surface style={styles.inputContainer}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={{ flex: 1 }}
        >
          <TextInput
            ref={inputRef}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Écrire un message..."
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            maxLength={500}
            onFocus={onFocus}
          />
        </Animated.View>
        
        <Animated.View
          entering={ZoomIn.duration(300)}
        >
          <RNAnimated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size={26} color="#fff" />
              ) : (
                <View style={styles.sendIconContainer}>
                  <Ionicons name="paper-plane" size={22} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </RNAnimated.View>
        </Animated.View>
      </Surface>

      {/* Afficher le toast d'erreur s'il y en a un */}
      {toastError && (
        <ErrorToast message={toastError} onDismiss={dismissErrorToast} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Conteneur principal pour tout l'écran de chat
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Conteneur affiché pendant le chargement des messages
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  // Texte affiché pendant le chargement
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  // Conteneur affiché en cas d'erreur
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  // Style du texte d'erreur
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontWeight: '500',
  },
  // Style du bouton de réessai en cas d'erreur
  retryButton: {
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#ff6b9b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // Barre d'en-tête contenant les informations du vendeur et du produit
  header: {
    backgroundColor: '#ffffff',
    elevation: 4,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  // Partie principale de l'en-tête contenant les infos
  headerContent: {
    flex: 1,
    marginLeft: 4,
    justifyContent: 'flex-start',
    paddingVertical: 0,
  },
  // Conteneur des informations de l'utilisateur dans l'en-tête
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    marginTop: 0,
  },
  // Avatar dans l'en-tête
  headerAvatar: {
    marginRight: 6,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  // Titre dans l'en-tête (nom du vendeur)
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    paddingTop: 0,
    marginTop: 0,
  },
  // Sous-titre dans l'en-tête (titre du produit)
  headerSubtitle: {
    fontSize: 13,
    color: '#6B3CE9',
    fontWeight: '500',
    marginLeft: 34,
    marginTop: -2,
  },
  // Bouton d'action dans l'en-tête (info)
  headerAction: {
    padding: 2,
    marginRight: 4,
  },
  // Wrapper pour la carte d'informations du produit
  productCardWrapper: {
    overflow: 'visible',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    zIndex: 10,
  },
  // Conteneur principal des informations du produit
  productInfoContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  // Disposition du contenu des informations du produit
  productInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 65,
  },
  // Conteneur de l'image du produit
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginRight: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // Conteneur de l'image placeholder quand aucune image n'est disponible
  placeholderImageContainer: {
    width: 60, 
    height: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 10,
  },
  // Style de l'image du produit
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  // Conteneur des détails textuels du produit
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  // Titre du produit dans la carte d'info
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  // Conteneur du prix et autres infos
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Badge visuel pour le prix
  priceTag: {
    backgroundColor: 'rgba(255,107,155,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,155,0.15)',
    marginRight: 10,
  },
  // Style du texte du prix
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff6b9b',
  },
  // Texte "Voir l'annonce" cliquable
  viewProductText: {
    fontSize: 12,
    color: '#6B3CE9',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  // Conteneur de la liste des messages
  messagesContainer: {
    padding: 12,
    paddingBottom: 16,
    marginBottom: hp('2%'),
  },
  // Style pour le conteneur vide (pas de messages)
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Wrapper pour le message "chat vide" (avec rotation pour l'inversion)
  emptyChatWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Conteneur pour le message "chat vide"
  emptyChatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  // Titre pour le chat vide
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 8,
  },
  // Texte explicatif pour le chat vide
  emptyChatText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Bulle contenant un message
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 4,
    maxWidth: '85%',
  },
  // Avatar à côté des messages reçus
  messageAvatar: {
    marginRight: 4,
    alignSelf: 'flex-end',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  // Style pour les messages envoyés (alignés à droite)
  sentMessage: {
    alignSelf: 'flex-end',
    marginLeft: 16,
    marginBottom: 8,
  },
  // Style pour les messages reçus (alignés à gauche)
  receivedMessage: {
    alignSelf: 'flex-start',
    marginRight: 16,
    marginBottom: 8,
  },
  // Contenu du message (texte et heure)
  messageContent: {
    borderRadius: 18,
    padding: 10,
    paddingHorizontal: 14,
    minWidth: 60,
    maxWidth: '100%',
  },
  // Style spécifique pour le contenu des messages envoyés
  sentMessageContent: {
    backgroundColor: '#ff6b9b',
    borderBottomRightRadius: 4,
    elevation: 2,
    shadowColor: '#ff3b7b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  // Style spécifique pour le contenu des messages reçus
  receivedMessageContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  // Style pour les messages consécutifs du même expéditeur
  consecutiveMessage: {
    marginLeft: 34,
  },
  // Style du texte des messages
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  // Style du texte pour les messages envoyés
  sentMessageText: {
    color: '#fff',
    fontWeight: '400',
  },
  // Style du texte pour les messages reçus
  receivedMessageText: {
    color: '#333',
    fontWeight: '400',
  },
  // Style de l'heure du message
  messageTime: {
    fontSize: 10,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  // Conteneur pour l'heure et les indicateurs de lecture
  messageTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  // Style de l'heure pour les messages envoyés
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Style de l'heure pour les messages reçus
  receivedMessageTime: {
    color: '#999',
  },
  // Conteneur pour la date séparant les messages
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  // Style du texte de la date
  dateText: {
    fontSize: 12,
    color: '#888',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontWeight: '500',
  },
  // Conteneur pour la zone de saisie de message en bas
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 24,
  },
  // Champ de saisie du message
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ececec',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  // Bouton d'envoi du message
  sendButton: {
    backgroundColor: '#ff6b9b',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#ff3b7b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  // Style du bouton d'envoi désactivé
  sendButtonDisabled: {
    backgroundColor: '#ffb3cb',
    elevation: 2,
    shadowOpacity: 0.2,
  },
  // Conteneur pour l'icône d'envoi avec effets visuels
  sendIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -1 }], // Petit ajustement pour centrer l'icône
  },
  // Toast d'erreur en bas de l'écran
  errorToast: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    left: 0,
    zIndex: 999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  // Contenu du toast d'erreur
  errorToastContent: {
    backgroundColor: 'rgba(255, 70, 70, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  // Texte du toast d'erreur
  errorToastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 10,
    flex: 1,
  },
  // Bouton de retour dans l'en-tête
  backButton: {
    marginRight: 6,
    marginLeft: 2,
    padding: 8,
    backgroundColor: 'rgba(255, 107, 155, 0.1)',
    borderRadius: 20,
  },
}); 