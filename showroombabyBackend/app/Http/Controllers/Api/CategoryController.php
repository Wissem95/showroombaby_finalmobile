<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Affiche la liste de toutes les catégories
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $categories = Category::all();
        return response()->json(['data' => $categories]);
    }

    /**
     * Stocke une nouvelle catégorie dans la base de données
     * Réservé aux administrateurs
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Vérification que l'utilisateur est admin
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Validation des données
        $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'required|string',
        ]);

        // Création de la catégorie
        $category = Category::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json(['data' => $category], 201);
    }

    /**
     * Affiche les détails d'une catégorie spécifique
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $category = Category::with('products')->findOrFail($id);
        return response()->json(['data' => $category]);
    }

    /**
     * Met à jour une catégorie existante
     * Réservé aux administrateurs
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        // Vérification que l'utilisateur est admin
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $category = Category::findOrFail($id);

        // Validation des données
        $request->validate([
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $id,
            'description' => 'sometimes|string',
        ]);

        // Mise à jour des champs
        if ($request->has('name')) $category->name = $request->name;
        if ($request->has('description')) $category->description = $request->description;

        $category->save();

        return response()->json(['data' => $category]);
    }

    /**
     * Supprime une catégorie
     * Réservé aux administrateurs
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        // Vérification que l'utilisateur est admin
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $category = Category::findOrFail($id);

        // Vérification que la catégorie n'a pas de produits associés
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer une catégorie contenant des produits'
            ], 400);
        }

        $category->delete();

        return response()->json(['message' => 'Catégorie supprimée avec succès']);
    }
}
