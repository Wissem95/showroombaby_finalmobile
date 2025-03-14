import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, ActivityIndicator, Appbar } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:8000';

interface Conversation {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  created_at: string;
  read: boolean;
  archived_by_sender: boolean;
  archived_by_recipient: boolean;
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
  };
  recipient?: {
    id: number;
    username: string;
    email?: string;
  };
}

export default function MessagesScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    loadConversations();
    getUserId();
    
    // Rafraîchir les conversations toutes les 30 secondes
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const getUserId = async () => {
    const id = await AsyncStorage.getItem('userId');
    setUserId(id ? parseInt(id) : null);
  };

  const loadConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/messages/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Vérifier si les données sont présentes et valides
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        setConversations(response.data.data.data);
      } else {
        console.error('Format de données invalide:', response.data);
        setConversations([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      setLoading(false);
    }
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

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserId = item.sender_id === userId ? item.recipient_id : item.sender_id;
    
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(300)}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('Chat', {
            receiverId: otherUserId,
            productId: item.product?.id,
            productTitle: item.product?.title || 'Conversation'
          })}
          style={styles.conversationTouchable}
          activeOpacity={0.7}
        >
          <Surface style={[styles.conversationCard, !item.read && styles.unreadCard]}>
            <View style={styles.conversationContent}>
              {item.product?.images && item.product.images[0] && (
                <Animated.Image 
                  source={{ uri: `${API_URL}/storage/${item.product.images[0]}` }}
                  style={[styles.productImage]}
                  sharedTransitionTag={`product-${item.product.id}`}
                />
              )}
              <View style={styles.textContainer}>
                <Animated.Text style={[styles.productTitle, !item.read && styles.unreadText]} numberOfLines={1}>
                  {item.product?.title || 'Conversation'}
                </Animated.Text>
                <Animated.Text style={[styles.lastMessage, !item.read && styles.unreadText]} numberOfLines={2}>
                  {item.content}
                </Animated.Text>
              </View>
              <Text style={styles.timeText}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </Surface>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Messages" />
      </Appbar.Header>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b9b" />
          <Text style={styles.loadingText}>Chargement des conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aucune conversation pour le moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item, index) => `${item.sender_id}-${item.recipient_id}-${index}`}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('4%'),
  },
  emptyText: {
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: wp('4%'),
  },
  conversationTouchable: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('1%'),
    transform: [{ scale: 1 }],
  },
  conversationCard: {
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
    transform: [{ scale: 1 }],
  },
  unreadCard: {
    backgroundColor: '#fff9fb',
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b9b',
  },
  conversationContent: {
    flexDirection: 'row',
    padding: wp('4%'),
    alignItems: 'center',
  },
  productImage: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: 8,
    marginRight: wp('3%'),
  },
  textContainer: {
    flex: 1,
    marginRight: wp('3%'),
  },
  productTitle: {
    fontSize: wp('4%'),
    fontWeight: '500',
    marginBottom: hp('0.5%'),
    color: '#333',
  },
  unreadText: {
    fontWeight: '600',
    color: '#000',
  },
  lastMessage: {
    fontSize: wp('3.5%'),
    color: '#666',
  },
  timeText: {
    fontSize: wp('3%'),
    color: '#999',
  },
}); 