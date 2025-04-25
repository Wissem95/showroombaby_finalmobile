import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_IP } from '../config/ip';

// URL de l'API selon l'environnement
const API_URL = process.env.NODE_ENV === 'development' || __DEV__ 
  ? `http://${SERVER_IP}:8000/api`
  : 'https://api.showroombaby.com/api';

class ConversationService {
  private static instance: ConversationService;

  private constructor() {}

  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  async getConversations() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      throw error;
    }
  }

  async markAsRead(conversationId: number) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      const response = await axios.post(
        `${API_URL}/messages/mark-as-read`,
        { conversation_id: conversationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  async sendMessage(receiverId: number, content: string, productId?: number) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      const data = {
        recipient_id: receiverId,
        content,
        product_id: productId
      };
      
      const response = await axios.post(
        `${API_URL}/messages`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }
}

export default ConversationService.getInstance(); 