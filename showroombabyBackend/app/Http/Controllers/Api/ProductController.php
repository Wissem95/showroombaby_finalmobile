<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    /**
     * Affiche une liste paginée des produits avec filtres
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Initialisation de la requête
        $query = Product::with(['seller', 'category'])
            ->where('status', 'PUBLISHED');

        // Filtre par catégorie
        if ($request->has('categoryId')) {
            $query->where('category_id', $request->categoryId);
        }

        // Filtre par prix
        if ($request->has('minPrice')) {
            $query->where('price', '>=', $request->minPrice);
        }

        if ($request->has('maxPrice')) {
            $query->where('price', '<=', $request->maxPrice);
        }

        // Filtre par état
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        // Recherche textuelle
        if ($request->has('query')) {
            $searchTerm = $request->query;
            $query->where(function($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        // Recherche géographique
        if ($request->has('latitude') && $request->has('longitude') && $request->has('radius')) {
            // Calcul de la distance en utilisant la formule de Haversine
            $lat = $request->latitude;
            $lng = $request->longitude;
            $radius = $request->radius;

            // Conversion du rayon en degrés (approximation)
            $radiusInDegrees = $radius / 111.32;

            $query->whereRaw("
                (
                    6371 * acos(
                        cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
                        sin(radians(?)) * sin(radians(latitude))
                    )
                ) <= ?
            ", [$lat, $lng, $lat, $radius]);
        }

        // Tri
        if ($request->has('sortBy')) {
            switch ($request->sortBy) {
                case 'price':
                    $query->orderBy('price', 'asc');
                    break;
                case 'date':
                    $query->orderBy('created_at', 'desc');
                    break;
                case 'views':
                    $query->orderBy('view_count', 'desc');
                    break;
                // Le tri par distance est géré différemment et nécessiterait une logique plus complexe
            }
        } else {
            // Tri par défaut
            $query->orderBy('created_at', 'desc');
        }

        // Pagination
        $page = $request->page ?? 1;
        $limit = $request->limit ?? 10;

        $products = $query->paginate($limit, ['*'], 'page', $page);

        // Charger et formater les images pour chaque produit
        $formattedProducts = [];
        foreach ($products->items() as $product) {
            $productImages = ProductImage::where('product_id', $product->id)->get();

            $formattedImages = [];
            foreach ($productImages as $image) {
                $formattedImages[] = [
                    'id' => $image->id,
                    'path' => $image->path,
                    'url' => asset('storage/' . $image->path),
                    'is_primary' => $image->is_primary,
                    'order' => $image->order
                ];
            }

            // Ajouter les images formatées au produit
            $product->images = $formattedImages;
            $formattedProducts[] = $product;
        }

        return response()->json([
            'items' => $formattedProducts,
            'total' => $products->total(),
            'page' => $products->currentPage(),
            'limit' => $products->perPage(),
            'totalPages' => $products->lastPage()
        ]);
    }

    /**
     * Stocke un nouveau produit dans la base de données
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validation des données
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'condition' => 'required|string|in:NEW,LIKE_NEW,GOOD,FAIR',
            'categoryId' => 'required|exists:categories,id',
            'subcategoryId' => 'required|exists:categories,id',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'required|string',
            'city' => 'required|string',
            'zipcode' => 'required|string',
            'phone' => 'required|string',
        ]);

        // Création du produit
        $product = new Product();
        $product->title = $request->title;
        $product->description = $request->description;
        $product->price = $request->price;
        $product->condition = $request->condition;
        $product->status = 'PUBLISHED';
        $product->category_id = $request->categoryId;
        $product->subcategory_id = $request->subcategoryId;
        $product->user_id = $request->user()->id;
        $product->latitude = $request->latitude;
        $product->longitude = $request->longitude;
        $product->address = $request->address;
        $product->city = $request->city;
        $product->zipCode = $request->input('zipcode', $request->input('zipCode'));
        $product->phone = $request->phone;
        $product->view_count = 0;
        $product->save();

        // Traitement des images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');

                $productImage = new ProductImage();
                $productImage->product_id = $product->id;
                $productImage->path = $path;
                $productImage->save();
            }
        }

        // Chargement des relations
        $product->load(['category', 'images']);

        return response()->json(['data' => $product], 201);
    }

    /**
     * Affiche les détails d'un produit spécifique
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $product = Product::with(['category', 'subcategory'])->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Produit non trouvé'
            ], 404);
        }

        // Incrémenter le compteur de vues
        $product->increment('view_count');

        // Charger les images du produit
        $productImages = ProductImage::where('product_id', $product->id)->get();

        // Formatter les images pour l'API
        $formattedImages = [];
        foreach ($productImages as $image) {
            $formattedImages[] = [
                'id' => $image->id,
                'path' => $image->path,
                'url' => asset('storage/' . $image->path),
                'is_primary' => $image->is_primary,
                'order' => $image->order
            ];
        }

        // Récupérer la sous-catégorie si elle existe
        $subcategory = null;
        if ($product->subcategory_id) {
            // Définir les sous-catégories statiquement
            $subcategories = $this->getStaticSubcategories();
            // Chercher la sous-catégorie par son ID
            foreach ($subcategories as $subcat) {
                if ($subcat['id'] == $product->subcategory_id) {
                    $subcategory = $subcat;
                    break;
                }
            }
        }

        // Formater la réponse
        $response = [
            'id' => $product->id,
            'title' => $product->title,
            'description' => $product->description,
            'price' => $product->price,
            'condition' => $product->condition,
            'status' => $product->status,
            'categoryId' => $product->category_id,
            'subcategoryId' => $product->subcategory_id,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name
            ] : null,
            'subcategory' => $subcategory ? [
                'id' => $subcategory['id'],
                'name' => $subcategory['name']
            ] : null,
            'city' => $product->city,
            'location' => $product->location,
            'address' => $product->address,
            'view_count' => $product->view_count,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
            'images' => $formattedImages,
            'is_trending' => $product->is_trending,
            'is_featured' => $product->is_featured,
            'user_id' => $product->user_id,
            'size' => $product->size,
            'color' => $product->color,
            'warranty' => $product->warranty,
            'phone' => $product->phone,
            'hide_phone' => $product->hide_phone,
            'zip_code' => $product->zipCode,
            'brand' => $product->brand,
            'model' => $product->model,
            'material' => $product->material,
            'dimensions' => $product->dimensions,
            'weight' => $product->weight,
            'latitude' => $product->latitude,
            'longitude' => $product->longitude
        ];

        return response()->json([
            'status' => 'success',
            'data' => $response
        ]);
    }

    /**
     * Récupère la liste complète des sous-catégories
     *
     * @return array
     */
    private function getStaticSubcategories()
    {
        $allSubcategories = [];

        // Liste statique des sous-catégories (identique à celle dans CategoryController)
        $subcategoriesByCategory = [
            1 => [ // Poussette
                ['id' => 1, 'name' => 'Poussette canne'],
                ['id' => 2, 'name' => 'Poussette 3 roues'],
                ['id' => 3, 'name' => 'Poussette 4 roues'],
                ['id' => 4, 'name' => 'Poussette combiné duo'],
                ['id' => 5, 'name' => 'Poussette combiné trio'],
                ['id' => 6, 'name' => 'Poussette double'],
                ['id' => 7, 'name' => 'Poussette tout terrain'],
            ],
            2 => [ // Sièges auto
                ['id' => 8, 'name' => 'Groupe 0/0+'],
                ['id' => 9, 'name' => 'Groupe 0+/1'],
                ['id' => 10, 'name' => 'Groupe 1'],
                ['id' => 11, 'name' => 'Groupe 2/3'],
                ['id' => 12, 'name' => 'Groupe 1/2/3'],
                ['id' => 13, 'name' => 'Siège auto pivotant'],
            ],
            3 => [ // Chambre
                ['id' => 14, 'name' => 'Applique et suspension'],
                ['id' => 15, 'name' => 'Armoire'],
                ['id' => 16, 'name' => 'Berceau bébé'],
                ['id' => 17, 'name' => 'Bibliothèque'],
                ['id' => 18, 'name' => 'Bureau'],
                ['id' => 19, 'name' => 'Coffre à jouet'],
                ['id' => 20, 'name' => 'Commode'],
                ['id' => 21, 'name' => 'Deco/ lampe'],
                ['id' => 22, 'name' => 'Lit bébé'],
                ['id' => 23, 'name' => 'Lit enfant'],
                ['id' => 24, 'name' => 'Lit mezzanine'],
                ['id' => 25, 'name' => 'Matelas'],
                ['id' => 26, 'name' => 'Parc à bébé'],
                ['id' => 27, 'name' => 'Table à langer'],
                ['id' => 28, 'name' => 'Table de nuit'],
                ['id' => 29, 'name' => 'Tiroir de lit'],
                ['id' => 30, 'name' => 'Tour de lit'],
            ],
            4 => [ // Chaussure / Vêtements
                ['id' => 31, 'name' => 'Gigoteuse'],
                ['id' => 32, 'name' => 'Pyjama'],
                ['id' => 33, 'name' => 'T-shirt'],
                ['id' => 34, 'name' => 'Body'],
                ['id' => 35, 'name' => 'Salopette / Combinaison'],
                ['id' => 36, 'name' => 'Pantalon / Jean'],
                ['id' => 37, 'name' => 'Pull / Gilet / Sweat'],
                ['id' => 38, 'name' => 'Robe / Jupe'],
                ['id' => 39, 'name' => 'Short'],
                ['id' => 40, 'name' => 'Chemise / Blouse'],
                ['id' => 41, 'name' => 'Legging'],
                ['id' => 42, 'name' => 'Maillot de bain'],
                ['id' => 43, 'name' => 'Manteau / Blouson'],
                ['id' => 44, 'name' => 'Chaussure'],
                ['id' => 45, 'name' => 'Basket'],
                ['id' => 46, 'name' => 'Chausson'],
                ['id' => 47, 'name' => 'Chaussette'],
                ['id' => 48, 'name' => 'Culotte'],
            ],
            5 => [ // Jeux / Éveil
                ['id' => 49, 'name' => 'Transat'],
                ['id' => 50, 'name' => 'Balancelle / Bascule'],
                ['id' => 51, 'name' => 'Ballon'],
                ['id' => 52, 'name' => 'Trotteur / Porteur/ Chariot'],
                ['id' => 53, 'name' => 'Vélo'],
                ['id' => 54, 'name' => 'Doudou / Peluche'],
                ['id' => 55, 'name' => 'Tapis d\'éveil'],
                ['id' => 56, 'name' => 'Jouet de bain'],
                ['id' => 57, 'name' => 'Jouet en bois'],
                ['id' => 58, 'name' => 'Poupon / Poupée'],
                ['id' => 59, 'name' => 'Jeu de construction'],
                ['id' => 60, 'name' => 'Figurine'],
                ['id' => 61, 'name' => 'Puzzle'],
            ],
            6 => [ // Livre / Dvd
                ['id' => 62, 'name' => 'Livre sonore'],
                ['id' => 63, 'name' => 'Éveil et premier âge'],
                ['id' => 64, 'name' => 'Livre 0 mois à 2 ans'],
                ['id' => 65, 'name' => 'Livre 2 ans à 4 ans'],
                ['id' => 66, 'name' => 'Livre de bain'],
            ],
            7 => [ // Toilette
                ['id' => 67, 'name' => 'Baignoire'],
                ['id' => 68, 'name' => 'Couche réutilisable'],
                ['id' => 69, 'name' => 'Housse matelas à langer'],
                ['id' => 70, 'name' => 'Matelas à langer'],
                ['id' => 71, 'name' => 'Mouche bébé'],
                ['id' => 72, 'name' => 'Peigne / Brosse'],
                ['id' => 73, 'name' => 'Table à langer'],
                ['id' => 74, 'name' => 'Thermomètre de bain'],
                ['id' => 75, 'name' => 'Trousse de toilette'],
            ],
            8 => [ // Repas
                ['id' => 76, 'name' => 'Allaitement'],
                ['id' => 77, 'name' => 'Boîte'],
                ['id' => 78, 'name' => 'Boîte doseurs'],
                ['id' => 79, 'name' => 'Chaise haute bebe'],
                ['id' => 80, 'name' => 'Chauffe biberon'],
                ['id' => 81, 'name' => 'Chauffe repas'],
                ['id' => 82, 'name' => 'Coussin pour chaise haute'],
                ['id' => 83, 'name' => 'Vaisselle'],
                ['id' => 84, 'name' => 'Soutien gorge allaitement'],
            ],
            9 => [ // Sortie
                ['id' => 85, 'name' => 'Chancelière'],
                ['id' => 86, 'name' => 'Lit pliant'],
                ['id' => 87, 'name' => 'Sac a langer'],
                ['id' => 88, 'name' => 'Porte bébé'],
            ],
            10 => [ // Service
                ['id' => 89, 'name' => 'Garde d\'enfant'],
                ['id' => 90, 'name' => 'Aide au devoir'],
            ]
        ];

        // Aplatir toutes les sous-catégories en une seule liste
        foreach ($subcategoriesByCategory as $categorySubcats) {
            foreach ($categorySubcats as $subcat) {
                $allSubcategories[] = $subcat;
            }
        }

        return $allSubcategories;
    }

    /**
     * Met à jour un produit existant
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Vérification que l'utilisateur est bien le vendeur
        if ($product->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Validation des données
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'condition' => 'sometimes|string|in:NEW,LIKE_NEW,GOOD,FAIR',
            'categoryId' => 'sometimes|exists:categories,id',
            'subcategoryId' => 'sometimes|exists:categories,id',
            'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
            'address' => 'sometimes|string',
            'city' => 'sometimes|string',
            'zipCode' => 'sometimes|string',
            'phone' => 'sometimes|string',
        ]);

        // Mise à jour des champs
        if ($request->has('title')) $product->title = $request->title;
        if ($request->has('description')) $product->description = $request->description;
        if ($request->has('price')) $product->price = $request->price;
        if ($request->has('condition')) $product->condition = $request->condition;
        if ($request->has('categoryId')) $product->category_id = $request->categoryId;
        if ($request->has('subcategoryId')) $product->subcategory_id = $request->subcategoryId;
        if ($request->has('latitude')) $product->latitude = $request->latitude;
        if ($request->has('longitude')) $product->longitude = $request->longitude;
        if ($request->has('address')) $product->address = $request->address;
        if ($request->has('city')) $product->city = $request->city;
        if ($request->has('zipCode')) $product->zipCode = $request->input('zipcode', $request->input('zipCode'));
        if ($request->has('phone')) $product->phone = $request->phone;

        $product->save();

        // Traitement des nouvelles images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');

                $productImage = new ProductImage();
                $productImage->product_id = $product->id;
                $productImage->path = $path;
                $productImage->save();
            }
        }

        // Chargement des relations
        $product->load(['category', 'images']);

        return response()->json(['data' => $product]);
    }

    /**
     * Supprime un produit
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Vérification que l'utilisateur est bien le vendeur
        if ($product->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Suppression des images
        if ($product->images !== null) {
            foreach ($product->images as $image) {
                Storage::disk('public')->delete($image->path);
                $image->delete();
            }
        }

        // Suppression du produit
        $product->delete();

        return response()->json(['message' => 'Produit supprimé avec succès']);
    }

    /**
     * Récupère les produits tendances
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function trending(Request $request)
    {
        $limit = $request->limit ?? 10;

        $products = Product::with(['category', 'images'])
            ->where('status', 'PUBLISHED')
            ->orderBy('view_count', 'desc')
            ->take($limit)
            ->get();

        return response()->json([
            'data' => $products,
            'meta' => [
                'current_page' => 1,
                'total' => count($products),
                'per_page' => $limit,
                'last_page' => 1
            ]
        ]);
    }

    /**
     * Récupère les produits similaires
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function similar($id)
    {
        $product = Product::findOrFail($id);

        $similarProducts = Product::with(['category', 'images'])
            ->where('id', '!=', $id)
            ->where(function($query) use ($product) {
                $query->where('category_id', $product->category_id)
                      ->orWhere('subcategory_id', $product->subcategory_id);
            })
            ->where('status', 'PUBLISHED')
            ->take(4)
            ->get();

        return response()->json(['data' => $similarProducts]);
    }

    /**
     * Récupère tous les produits de l'utilisateur connecté
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserProducts()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            $products = Product::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->with(['images', 'category'])
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des produits: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la récupération des produits'
            ], 500);
        }
    }

    /**
     * Récupère les images d'un produit spécifique
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getImages($id)
    {
        $product = Product::findOrFail($id);

        $productImages = ProductImage::where('product_id', $id)->get();

        // Vérifier s'il y a des images avec des chemins d'accès complets NULL
        foreach ($productImages as $image) {
            // Si l'URL complète est NULL, la mettre à jour
            if ($image->full_path === null && $image->path !== null) {
                $image->full_path = '/storage/' . $image->path;
                $image->save();
            }
        }

        $formattedImages = [];
        foreach ($productImages as $image) {
            $formattedImages[] = [
                'id' => $image->id,
                'path' => $image->path,
                'url' => asset('storage/' . $image->path),
                'full_path' => $image->full_path,
                'is_primary' => $image->is_primary,
                'order' => $image->order
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $formattedImages
        ]);
    }
}
