import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, Surface, Avatar, Divider, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  Layout,
  FadeInRight
} from 'react-native-reanimated';

const API_URL = 'http://127.0.0.1:8000';
const DEFAULT_AVATAR_URL = 'https://ui-avatars.com/api/?background=ff6b9b&color=fff&name=User';

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

type RootStackParamList = {
  Chat: {
    receiverId: number;
    productId: number;
    productTitle: string;
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

export default function ChatScreen({ route, navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { receiverId, productId, productTitle } = route.params;

  useEffect(() => {
    navigation.setOptions({
      title: 'Retour',
    });

    loadInitialData();
    
    // Rafraîchir les messages toutes les 5 secondes
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        getUserId(),
        loadProductDetails(),
        loadSellerDetails(),
        loadMessages()
      ]);
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      setError('Une erreur est survenue lors du chargement des données.');
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

  const loadProductDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProduct(response.data.data || response.data);
    } catch (error) {
      console.error('Erreur chargement produit:', error);
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
      Alert.alert(
        'Erreur',
        'Impossible de charger les informations du vendeur. Veuillez réessayer.'
      );
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
        // Filtrer les messages pour ce produit spécifique
        const filteredMessages = response.data.data.filter(
          (msg: Message) => msg.product_id === productId
        );
        
        setMessages(filteredMessages.reverse());
      } else {
        console.error('Format de réponse invalide pour les messages');
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les messages. Veuillez réessayer.'
      );
      setLoading(false);
    }
  };

  const getUserId = async () => {
    const id = await AsyncStorage.getItem('userId');
    setUserId(id ? parseInt(id) : null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/messages`,
        {
          recipientId: receiverId,
          productId: productId,
          content: newMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewMessage('');
      loadMessages(); // Recharger les messages après l'envoi
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View
      entering={FadeInRight.duration(300)}
      style={[
        styles.messageBubble,
        item.sender_id === userId ? styles.sentMessage : styles.receivedMessage
      ]}
    >
      <Surface style={[
        styles.messageContent,
        item.sender_id === userId ? styles.sentMessageContent : styles.receivedMessageContent
      ]}>
        <Text style={[
          styles.messageText,
          item.sender_id === userId ? styles.sentMessageText : styles.receivedMessageText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          item.sender_id === userId ? styles.sentMessageTime : styles.receivedMessageTime
        ]}>
          {new Date(item.created_at).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </Surface>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b9b" />
        <Text style={styles.loadingText}>Chargement de la conversation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={loadInitialData}
          style={styles.retryButton}
        >
          Réessayer
        </Button>
      </View>
    );
  }

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {seller && (
            <Animated.View 
              style={styles.sellerInfo}
              entering={SlideInRight.duration(400)}
            >
              <Avatar.Image
                size={40}
                source={
                  seller.avatar
                    ? { uri: `${API_URL}/storage/${seller.avatar}` }
                    : { uri: DEFAULT_AVATAR_URL }
                }
              />
              <Text style={styles.sellerName}>{seller.username}</Text>
            </Animated.View>
          )}
        </View>
      </View>

      {product && (
        <Animated.View 
          style={styles.productInfo}
          entering={SlideInRight.duration(400).delay(100)}
        >
          <Surface style={styles.productCard}>
            <Animated.Image
              source={{ 
                uri: product.images && product.images[0] 
                  ? `${API_URL}/storage/${product.images[0]}`
                  : 'default-product-image-url'
              }}
              style={styles.productImage}
              sharedTransitionTag={`product-${product.id}`}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {product.title}
              </Text>
              <Text style={styles.productPrice}>
                {product.price.toLocaleString('fr-FR')} €
              </Text>
            </View>
          </Surface>
        </Animated.View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        inverted
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <Animated.View 
          style={styles.inputWrapper}
          entering={SlideInRight.duration(400)}
        >
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Écrivez votre message..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            onPress={sendMessage}
            style={styles.sendButton}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newMessage.trim() ? "#ff6b9b" : "#ccc"} 
            />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: wp('2%'),
    marginRight: wp('2%'),
  },
  headerInfo: {
    flex: 1,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    marginLeft: wp('3%'),
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#333',
  },
  productInfo: {
    backgroundColor: '#ffffff',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('3%'),
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: 8,
    marginRight: wp('3%'),
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '500',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  productPrice: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#ff6b9b',
  },
  divider: {
    marginVertical: hp('1%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  messagesList: {
    padding: wp('4%'),
  },
  messageBubble: {
    marginVertical: hp('0.5%'),
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  messageContent: {
    padding: wp('3%'),
    borderRadius: 16,
    elevation: 1,
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  sentMessageContent: {
    backgroundColor: '#ff6b9b',
  },
  receivedMessageContent: {
    backgroundColor: '#ffffff',
  },
  messageText: {
    fontSize: wp('3.8%'),
    marginBottom: hp('0.5%'),
  },
  sentMessageText: {
    color: '#ffffff',
  },
  receivedMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: wp('3%'),
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receivedMessageTime: {
    color: '#999',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: wp('3%'),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  input: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: '#333',
    maxHeight: hp('15%'),
    paddingTop: Platform.OS === 'ios' ? hp('1%') : 0,
  },
  sendButton: {
    marginLeft: wp('2%'),
    padding: wp('2%'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('4%'),
  },
  errorText: {
    fontSize: wp('4%'),
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  retryButton: {
    backgroundColor: '#ff6b9b',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    color: '#666',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
}); 