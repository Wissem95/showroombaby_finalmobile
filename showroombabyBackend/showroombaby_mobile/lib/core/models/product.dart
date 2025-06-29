import 'package:freezed_annotation/freezed_annotation.dart';
import 'user.dart';
import 'category.dart';
import 'product_image.dart';

part 'product.freezed.dart';
part 'product.g.dart';

enum ProductCondition {
  @JsonValue('NEW')
  newCondition,
  @JsonValue('LIKE_NEW')
  likeNew,
  @JsonValue('GOOD')
  good,
  @JsonValue('FAIR')
  fair,
}

enum ProductStatus {
  @JsonValue('DRAFT')
  draft,
  @JsonValue('PUBLISHED')
  published,
  @JsonValue('SOLD')
  sold,
  @JsonValue('ARCHIVED')
  archived,
}

@freezed
class Product with _$Product {
  const factory Product({
    @JsonKey(fromJson: _parseRequiredInt) required int id,
    required String title,
    required String description,
    @JsonKey(fromJson: _parsePrice) double? price, // Parsing custom pour gérer les types mixtes
    required ProductCondition condition,
    required ProductStatus status,
    @JsonKey(name: 'user_id', fromJson: _parseRequiredInt) required int userId,
    @JsonKey(name: 'category_id', fromJson: _parseRequiredInt) required int categoryId,
    @JsonKey(name: 'subcategory_id', fromJson: _parseOptionalInt) int? subcategoryId,
    String? brand,
    @JsonKey(fromJson: _parseDouble) double? latitude,
    @JsonKey(fromJson: _parseDouble) double? longitude,
    String? address,
    String? city,
    @JsonKey(name: 'zipCode') String? zipcode,
    String? phone,
    @JsonKey(name: 'hide_phone') @Default(false) bool hidePhone,
    @JsonKey(name: 'view_count', fromJson: _parseInt) @Default(0) int viewCount,
    User? seller,
    Category? category,
    Category? subcategory,
    @Default([]) List<ProductImage> images,
    @Default(false) bool isFavorite,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
}

// Fonctions helper pour parsing sécurisé
double? _parsePrice(dynamic value) {
  if (value == null) return null;
  if (value is int) return value.toDouble();
  if (value is double) return value;
  if (value is String) return double.tryParse(value);
  return null;
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is int) return value.toDouble();
  if (value is double) return value;
  if (value is String) return double.tryParse(value);
  return null;
}

int _parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

int _parseRequiredInt(dynamic value) {
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  if (value == null) return 0; // Retourner 0 au lieu de lancer une exception
  return 0;
}

int? _parseOptionalInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
} 