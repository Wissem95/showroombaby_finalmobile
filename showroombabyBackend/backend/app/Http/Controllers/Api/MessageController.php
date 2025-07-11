<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Envoyer un nouveau message
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'recipientId' => 'required|exists:users,id',
            'content' => 'required|string|max:1000',
            'productId' => 'nullable|exists:products,id',
        ]);

        $user = Auth::user();

        // Vérifier que l'utilisateur n'envoie pas de message à lui-même
        if ($user->id == $request->recipientId) {
            return response()->json([
                'message' => 'Vous ne pouvez pas vous envoyer un message à vous-même'
            ], 400);
        }

        // Si un productId est fourni, vérifier que le produit existe
        if ($request->has('productId') && $request->productId) {
            $product = Product::find($request->productId);
            if (!$product) {
                return response()->json([
                    'message' => 'Le produit spécifié n\'existe pas'
                ], 404);
            }
        }

        $message = Message::create([
            'content' => $request->content,
            'sender_id' => $user->id,
            'recipient_id' => $request->recipientId,
            'product_id' => $request->productId,
            'read' => false,
            'archived_by_sender' => false,
            'archived_by_recipient' => false,
        ]);

        return response()->json([
            'message' => 'Message envoyé avec succès',
            'data' => $message
        ], 201);
    }

    /**
     * Récupérer la liste des conversations de l'utilisateur
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function conversations(Request $request)
    {
        $user = Auth::user();
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 10);

        // Récupérer les conversations non archivées
        $conversations = $this->getConversationsQuery($user, false)
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'data' => $conversations,
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total()
            ]
        ]);
    }

    /**
     * Récupérer la liste des conversations archivées de l'utilisateur
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function archivedConversations(Request $request)
    {
        $user = Auth::user();
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 10);

        // Récupérer les conversations archivées
        $conversations = $this->getConversationsQuery($user, true)
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'data' => $conversations,
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total()
            ]
        ]);
    }

    /**
     * Récupérer les messages d'une conversation avec un utilisateur spécifique
     *
     * @param Request $request
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function conversationMessages(Request $request, $userId)
    {
        $user = Auth::user();
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 20);
        $productId = $request->input('productId'); // Récupérer le productId de la requête

        // Vérifier que l'utilisateur existe
        $otherUser = User::find($userId);
        if (!$otherUser) {
            return response()->json([
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        // Récupérer les messages entre les deux utilisateurs
        $query = Message::where(function($query) use ($user, $userId) {
                $query->where('sender_id', $user->id)
                      ->where('recipient_id', $userId);
            })
            ->orWhere(function($query) use ($user, $userId) {
                $query->where('sender_id', $userId)
                      ->where('recipient_id', $user->id);
            });

        // Filtrer par productId si ce paramètre est fourni
        if ($productId) {
            $query->where(function($query) use ($productId) {
                $query->where('product_id', $productId)
                    ->orWhereNull('product_id'); // Inclure aussi les messages sans product_id (messages généraux)
            });
        }

        $messages = $query->with(['sender', 'product'])
            ->orderBy('created_at', 'desc')
            ->paginate($limit, ['*'], 'page', $page);

        // Marquer les messages non lus comme lus (seulement ceux reçus par l'utilisateur)
        $markAsReadQuery = Message::where('sender_id', $userId)
            ->where('recipient_id', $user->id)
            ->where('read', false);

        // Appliquer également le filtre par productId pour le marquage comme lu
        if ($productId) {
            $markAsReadQuery->where(function($query) use ($productId) {
                $query->where('product_id', $productId)
                    ->orWhereNull('product_id');
            });
        }

        $markAsReadQuery->update(['read' => true]);

        return response()->json([
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total()
            ]
        ]);
    }

    /**
     * Marquer un message comme lu
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();

        $message = Message::where('id', $id)
            ->where('recipient_id', $user->id)
            ->first();

        if (!$message) {
            return response()->json([
                'message' => 'Message non trouvé ou vous n\'êtes pas autorisé à le marquer comme lu'
            ], 404);
        }

        $message->markAsRead();

        return response()->json([
            'message' => 'Message marqué comme lu'
        ]);
    }

    /**
     * Archiver un message
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function archive(Request $request, $id)
    {
        $user = Auth::user();

        $message = Message::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('recipient_id', $user->id);
            })
            ->first();

        if (!$message) {
            return response()->json([
                'message' => 'Message non trouvé ou vous n\'êtes pas autorisé à l\'archiver'
            ], 404);
        }

        if ($message->sender_id == $user->id) {
            $message->archiveBySender();
        } else {
            $message->archiveByRecipient();
        }

        return response()->json([
            'message' => 'Message archivé'
        ]);
    }

    /**
     * Archiver une conversation entière avec un utilisateur
     *
     * @param Request $request
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function archiveConversation(Request $request, $userId)
    {
        $user = Auth::user();

        // Vérifier que l'utilisateur existe
        $otherUser = User::find($userId);
        if (!$otherUser) {
            return response()->json([
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        // Archiver tous les messages envoyés par l'utilisateur
        Message::where('sender_id', $user->id)
            ->where('recipient_id', $userId)
            ->update(['archived_by_sender' => true]);

        // Archiver tous les messages reçus par l'utilisateur
        Message::where('sender_id', $userId)
            ->where('recipient_id', $user->id)
            ->update(['archived_by_recipient' => true]);

        return response()->json([
            'message' => 'Conversation archivée'
        ]);
    }

    /**
     * Désarchiver une conversation entière avec un utilisateur
     *
     * @param Request $request
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function unarchiveConversation(Request $request, $userId)
    {
        $user = Auth::user();

        // Vérifier que l'utilisateur existe
        $otherUser = User::find($userId);
        if (!$otherUser) {
            return response()->json([
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        // Désarchiver tous les messages envoyés par l'utilisateur
        Message::where('sender_id', $user->id)
            ->where('recipient_id', $userId)
            ->update(['archived_by_sender' => false]);

        // Désarchiver tous les messages reçus par l'utilisateur
        Message::where('sender_id', $userId)
            ->where('recipient_id', $user->id)
            ->update(['archived_by_recipient' => false]);

        return response()->json([
            'message' => 'Conversation désarchivée'
        ]);
    }

    /**
     * Récupérer le nombre de messages non lus
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function unreadCount()
    {
        $user = Auth::user();

        $count = Message::where('recipient_id', $user->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'count' => $count
        ]);
    }

    /**
     * Requête pour récupérer les conversations
     *
     * @param User $user
     * @param bool $archived
     * @return \Illuminate\Database\Query\Builder
     */
    private function getConversationsQuery($user, $archived = false)
    {
        // Inclure l'ID du produit et créer une requête plus complète
        return DB::table('messages')
            ->select(
                'messages.id',
                'messages.sender_id',
                'messages.recipient_id',
                'messages.content',
                'messages.created_at',
                'messages.read',
                'messages.product_id',
                'messages.archived_by_sender',
                'messages.archived_by_recipient',
                'sender.id as sender_id',
                'sender.username as sender_username',
                'sender.email as sender_email',
                'sender.avatar as sender_avatar',
                'recipient.id as recipient_id',
                'recipient.username as recipient_username',
                'recipient.email as recipient_email',
                'recipient.avatar as recipient_avatar',
                'products.id as product_id',
                'products.title as product_title',
                'products.price as product_price',
                'products.images as product_images'
            )
            ->join('users as sender', 'messages.sender_id', '=', 'sender.id')
            ->join('users as recipient', 'messages.recipient_id', '=', 'recipient.id')
            ->leftJoin('products', 'messages.product_id', '=', 'products.id')
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('recipient_id', $user->id);
            })
            ->orderBy('messages.created_at', 'desc');
    }
}
