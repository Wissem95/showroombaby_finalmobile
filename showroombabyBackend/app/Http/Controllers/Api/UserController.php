<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Affiche le profil de l'utilisateur connecté
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        // On ne renvoie pas le mot de passe
        $user->makeHidden(['password']);

        return response()->json($user);
    }

    /**
     * Met à jour le profil de l'utilisateur connecté
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        // Validation des données
        $request->validate([
            'firstName' => 'sometimes|string|max:255',
            'lastName' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Mise à jour des champs
        if ($request->has('firstName')) $user->firstName = $request->firstName;
        if ($request->has('lastName')) $user->lastName = $request->lastName;
        if ($request->has('username')) $user->username = $request->username;

        // Traitement de l'avatar
        if ($request->hasFile('avatar')) {
            // Suppression de l'ancien avatar s'il existe
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Stockage du nouvel avatar
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        // On ne renvoie pas le mot de passe
        $user->makeHidden(['password']);

        return response()->json($user);
    }

    /**
     * Change le mot de passe de l'utilisateur connecté
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        // Validation des données
        $request->validate([
            'oldPassword' => 'required|string',
            'newPassword' => ['required', 'confirmed', Password::defaults()],
        ]);

        // Vérification de l'ancien mot de passe
        if (!Hash::check($request->oldPassword, $user->password)) {
            throw ValidationException::withMessages([
                'oldPassword' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        // Mise à jour du mot de passe
        $user->password = Hash::make($request->newPassword);
        $user->save();

        return response()->json(['message' => 'Mot de passe modifié avec succès']);
    }

    /**
     * Supprime le compte de l'utilisateur connecté
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        // Suppression de l'avatar s'il existe
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Révocation de tous les tokens
        $user->tokens()->delete();

        // Suppression du compte
        $user->delete();

        return response()->json(['message' => 'Compte supprimé avec succès']);
    }
}
