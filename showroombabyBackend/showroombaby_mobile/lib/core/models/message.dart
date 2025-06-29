import 'package:freezed_annotation/freezed_annotation.dart';
import 'user.dart';
import 'product.dart';

part 'message.freezed.dart';
part 'message.g.dart';

@freezed
class Message with _$Message {
  const factory Message({
    required int id,
    required String content,
    required int senderId,
    required int recipientId,
    int? productId,
    @Default(false) bool read,
    @Default(false) bool archivedBySender,
    @Default(false) bool archivedByRecipient,
    User? sender,
    User? recipient,
    Product? product,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _Message;

  factory Message.fromJson(Map<String, dynamic> json) => _$MessageFromJson(json);
} 