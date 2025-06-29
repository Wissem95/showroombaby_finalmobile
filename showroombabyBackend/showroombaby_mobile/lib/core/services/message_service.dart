import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../app/constants/api_constants.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../models/api_response.dart';

class MessageService {
  final Dio _dio = Dio();
  late SharedPreferences _prefs;

  MessageService() {
    _initializePrefs();
  }

  Future<void> _initializePrefs() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Récupère toutes les conversations de l'utilisateur
  Future<List<Conversation>> getConversations() async {
    try {
      final response = await _dio.get(
        '${ApiConstants.baseUrl}/messages/conversations',
        options: Options(
          headers: await _getHeaders(),
        ),
      );

      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData is Map<String, dynamic> && responseData['data'] != null) {
          final conversationsList = responseData['data'] as List;
          return conversationsList
              .map((json) => Conversation.fromJson(json as Map<String, dynamic>))
              .toList();
        } else {
          throw Exception('Format de réponse inattendu pour les conversations');
        }
      } else {
        throw Exception('Erreur lors du chargement des conversations');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Vous devez être connecté pour voir vos messages');
      }
      throw Exception('Erreur réseau: ${e.message}');
    }
  }

  /// Récupère les messages d'une conversation
  Future<List<Message>> getConversationMessages(int userId) async {
    try {
      final response = await _dio.get(
        '${ApiConstants.baseUrl}/messages/conversation/$userId',
        options: Options(
          headers: await _getHeaders(),
        ),
      );

      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData is Map<String, dynamic> && responseData['data'] != null) {
          final messagesList = responseData['data'] as List;
          return messagesList
              .map((json) => Message.fromJson(json as Map<String, dynamic>))
              .toList();
        } else {
          throw Exception('Format de réponse inattendu pour les messages');
        }
      } else {
        throw Exception('Erreur lors du chargement des messages');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Vous devez être connecté pour voir les messages');
      }
      throw Exception('Erreur réseau: ${e.message}');
    }
  }

  /// Envoie un nouveau message
  Future<Message> sendMessage({
    required int receiverId,
    required String content,
    int? productId,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.baseUrl}/messages',
        data: {
          'receiver_id': receiverId,
          'content': content,
          if (productId != null) 'product_id': productId,
        },
        options: Options(
          headers: await _getHeaders(),
        ),
      );

      if (response.statusCode == 201) {
        final responseData = response.data;
        if (responseData is Map<String, dynamic> && responseData['data'] != null) {
          return Message.fromJson(responseData['data'] as Map<String, dynamic>);
        } else {
          throw Exception('Format de réponse inattendu pour l\'envoi du message');
        }
      } else {
        throw Exception('Erreur lors de l\'envoi du message');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Vous devez être connecté pour envoyer des messages');
      }
      throw Exception('Erreur réseau: ${e.message}');
    }
  }

  /// Marque un message comme lu
  Future<void> markAsRead(int messageId) async {
    try {
      await _dio.post(
        '${ApiConstants.baseUrl}/messages/$messageId/read',
        options: Options(
          headers: await _getHeaders(),
        ),
      );
    } on DioException catch (e) {
      // Ignore l'erreur si le message est déjà lu
      if (e.response?.statusCode != 404) {
        throw Exception('Erreur lors du marquage du message: ${e.message}');
      }
    }
  }

  /// Récupère le nombre de messages non lus
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get(
        '${ApiConstants.baseUrl}/messages/unread/count',
        options: Options(
          headers: await _getHeaders(),
        ),
      );

      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData is Map<String, dynamic>) {
          return responseData['count'] ?? 0;
        }
      }
      return 0;
    } on DioException catch (e) {
      // En cas d'erreur, retourner 0
      return 0;
    }
  }

  /// Archive une conversation
  Future<void> archiveConversation(int userId) async {
    try {
      await _dio.post(
        '${ApiConstants.baseUrl}/messages/conversation/$userId/archive',
        options: Options(
          headers: await _getHeaders(),
        ),
      );
    } on DioException catch (e) {
      throw Exception('Erreur lors de l\'archivage: ${e.message}');
    }
  }

  /// Désarchive une conversation
  Future<void> unarchiveConversation(int userId) async {
    try {
      await _dio.post(
        '${ApiConstants.baseUrl}/messages/conversation/$userId/unarchive',
        options: Options(
          headers: await _getHeaders(),
        ),
      );
    } on DioException catch (e) {
      throw Exception('Erreur lors du désarchivage: ${e.message}');
    }
  }

  /// Headers pour les requêtes API avec token d'authentification
  Future<Map<String, String>> _getHeaders() async {
    final token = _prefs.getString('auth_token');
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
} 