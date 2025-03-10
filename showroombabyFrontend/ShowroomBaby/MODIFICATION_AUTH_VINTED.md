# Implémentation du Système d'Authentification Style Vinted

## Description

Cette modification transforme le flux d'authentification de l'application pour adopter une approche similaire à celle de l'application Vinted : les utilisateurs peuvent naviguer dans l'application sans être connectés, et l'authentification se fait depuis l'écran de profil.

## Modifications Réalisées

### 1. Navigateur Principal (AppNavigator.tsx)

- **Avant** : L'application affichait soit l'écran d'authentification, soit l'application principale selon le statut de connexion.
- **Après** : L'application affiche toujours le navigateur principal, que l'utilisateur soit connecté ou non.
- Les écrans d'authentification sont maintenant accessibles en modal depuis l'écran de profil.

```typescript
// Avant
return (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  </NavigationContainer>
);

// Après
return (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Toujours afficher le navigateur principal */}
      <Stack.Screen name="Main" component={MainNavigator} />
      {/* Les écrans d'authentification sont accessibles en modal */}
      <Stack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);
```

### 2. Écran de Profil (ProfileScreen.tsx)

- **Création** d'un nouvel écran de profil complet qui s'adapte selon le statut de connexion.
- **Non-connecté** : Affiche des options de connexion et d'inscription.
- **Connecté** : Affiche les informations du profil et les fonctionnalités associées.

```typescript
// Extrait pour utilisateur non connecté
const renderNotLoggedIn = () => (
  <View style={styles.container}>
    {/* ... */}
    <TouchableOpacity
      style={styles.loginButton}
      onPress={handleLogin}
    >
      <Text style={styles.loginButtonText}>Se connecter</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.registerButton}
      onPress={handleRegister}
    >
      <Text style={styles.registerButtonText}>Créer un compte</Text>
    </TouchableOpacity>
    {/* ... */}
  </View>
);
```

### 3. Navigateur Principal (MainNavigator.tsx)

- Remplacement du placeholder de l'écran de profil par notre écran de profil personnalisé

```typescript
// Avant
const ProfileScreen = () => (
  <View style={styles.placeholder}>
    <Text>Profil</Text>
  </View>
);

// Après
import ProfileScreen from '../screens/profile/ProfileScreen';
```

## Navigation vers l'Authentification

L'authentification est désormais accessible depuis l'écran de profil :

```typescript
// Depuis l'écran de profil
const handleLogin = () => {
  navigation.navigate('Auth', {
    screen: 'Login',
    params: {},
  });
};

const handleRegister = () => {
  navigation.navigate('Auth', {
    screen: 'Register',
    params: { isProfessional: false },
  });
};
```

## Gestion de la Déconnexion

La déconnexion est également gérée dans l'écran de profil :

```typescript
const handleLogout = () => {
  dispatch(logoutUser());
};
```

## Avantages de cette Approche

1. **Meilleure expérience utilisateur** : Les utilisateurs peuvent explorer l'application avant de s'inscrire
2. **Conversion facilitée** : Réduit les frictions à l'entrée de l'application
3. **Navigation plus flexible** : Les utilisateurs peuvent se connecter quand ils en ont besoin (par exemple pour contacter un vendeur)
4. **Similarité avec Vinted** : Adopte une approche d'authentification familière aux utilisateurs d'applications similaires

## Comment Tester

1. Lancer l'application
2. Naviguer entre les différents onglets sans être connecté
3. Accéder à l'onglet "Profil" pour voir les options de connexion/inscription
4. Se connecter et vérifier que l'écran de profil affiche maintenant les informations utilisateur
5. Se déconnecter en utilisant l'icône en haut à droite
