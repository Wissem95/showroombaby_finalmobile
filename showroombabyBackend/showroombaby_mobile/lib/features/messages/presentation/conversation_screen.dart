import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ConversationScreen extends StatelessWidget {
  final int userId;
  final int? productId;

  const ConversationScreen({
    super.key,
    required this.userId,
    this.productId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Conversation avec utilisateur $userId'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble,
              size: 100,
              color: Colors.blue[300],
            ),
            const SizedBox(height: 16),
            const Text(
              'Conversation',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Utilisateur: $userId',
              style: const TextStyle(fontSize: 16),
            ),
            if (productId != null)
              Text(
                'Produit: $productId',
                style: const TextStyle(fontSize: 16),
              ),
            const SizedBox(height: 8),
            Text(
              '🚧 En cours de développement 🚧',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/messages'),
              child: const Text('Retour aux messages'),
            ),
          ],
        ),
      ),
    );
  }
} 