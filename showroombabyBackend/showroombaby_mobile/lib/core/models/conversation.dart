import 'package:freezed_annotation/freezed_annotation.dart';
import 'user.dart';
import 'message.dart';
import 'product.dart';

part 'conversation.freezed.dart';
part 'conversation.g.dart';

@freezed
class Conversation with _$Conversation {
  const factory Conversation({
    required User otherUser,
    required Message lastMessage,
    required int unreadCount,
    Product? product,
    @Default(false) bool isArchived,
  }) = _Conversation;

  factory Conversation.fromJson(Map<String, dynamic> json) => _$ConversationFromJson(json);
} 