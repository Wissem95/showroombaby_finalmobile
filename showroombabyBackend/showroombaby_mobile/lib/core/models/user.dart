import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class User with _$User {
  const factory User({
    required int id,
    required String email,
    required String username,
    String? name,
    String? firstName,
    String? lastName,
    String? avatar,
    String? phone,
    String? street,
    String? city,
    String? zipcode,
    String? country,
    double? latitude,
    double? longitude,
    double? rating,
    @Default('USER') String role,
    @Default(false) bool isEmailVerified,
    DateTime? emailVerifiedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
} 