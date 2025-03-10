# Documentation des Améliorations de ShowroomBaby

## 1. Intégration de TailwindCSS avec NativeWind

### Installation

Nous avons intégré TailwindCSS dans l'application React Native grâce à NativeWind, permettant d'utiliser des classes Tailwind directement dans nos composants React Native.

```bash
npm install nativewind
npm install --save-dev tailwindcss@3.3.2
```

### Configuration

1. **babel.config.js**

   ```javascript
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         ['nativewind/babel', { mode: 'compileOnly' }],
         'react-native-reanimated/plugin',
         [
           'module:react-native-dotenv',
           {
             moduleName: '@env',
             path: '.env',
             blacklist: null,
             whitelist: null,
             safe: false,
             allowUndefined: true,
           },
         ],
       ],
     };
   };
   ```

2. **tailwind.config.js**

   ```javascript
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
     theme: {
       extend: {
         colors: {
           primary: '#FF7043',
           secondary: '#FFA726',
           background: '#F8F8F8',
           card: '#FFFFFF',
           text: '#333333',
           border: '#EEEEEE',
           notification: '#FF3B30',
           placeholder: '#999999',
           backdrop: 'rgba(0, 0, 0, 0.5)',
         },
         fontFamily: {
           sans: ['System'],
           bold: ['System-Bold'],
         },
       },
     },
     plugins: [],
   };
   ```

3. **Types TypeScript**

   ```typescript
   /// <reference types="nativewind/types" />

   declare module 'nativewind' {
     import type { ComponentType } from 'react';

     export function styled<T extends ComponentType<any>>(
       Component: T,
     ): T & { className?: string };

     export type StyledProps = {
       className?: string;
     };
   }
   ```

4. **tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "types": ["nativewind/types"]
     }
   }
   ```

### Utilisation

Pour utiliser TailwindCSS dans les composants :

1. Importer `styled` de NativeWind :

   ```typescript
   import { styled } from 'nativewind';
   ```

2. Créer des composants stylés :

   ```typescript
   const StyledView = styled(View);
   const StyledText = styled(Text);
   ```

3. Utiliser les classes Tailwind directement :
   ```tsx
   <StyledView className="flex-1 bg-white p-4">
     <StyledText className="text-xl font-bold text-primary">
       Hello World
     </StyledText>
   </StyledView>
   ```

## 2. Intégration API avec Axios

### Installation

```bash
npm install axios react-native-dotenv
```

### Service API

Nous avons créé un service pour gérer les requêtes API, utilisant axios pour les appels HTTP :

```typescript
// src/services/ProductService.ts
import axios from 'axios';
import { API_URL } from '@env';

const apiClient = axios.create({
  baseURL: API_URL || 'http://192.168.1.68:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

class ProductService {
  async getProducts(params = {}) {
    try {
      const response = await apiClient.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  }

  // Autres méthodes...
}

export default new ProductService();
```

### Utilisation dans les Composants

Dans les composants, nous utilisons ces services pour récupérer des données réelles :

```typescript
// Exemple dans HomeScreen.tsx
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Charger les produits depuis l'API
const loadProducts = async () => {
  try {
    setError(null);
    const response = await ProductService.getProducts();
    setProducts(response.data);
  } catch (err) {
    console.error('Erreur lors du chargement des produits:', err);
    setError(
      'Impossible de charger les produits. Veuillez réessayer plus tard.',
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// Appel au montage du composant
useEffect(() => {
  loadProducts();
}, []);
```

## 3. Gestion des Erreurs et États de Chargement

Pour une expérience utilisateur optimale, nous gérons les différents états de l'interface :

```tsx
// Afficher un indicateur de chargement
if (loading) {
  return (
    <StyledView className="flex-1 justify-center items-center bg-background">
      <ActivityIndicator size="large" color="#FF7043" />
      <StyledText className="mt-3 text-gray-600">
        Chargement des produits...
      </StyledText>
    </StyledView>
  );
}

// Afficher un message d'erreur
if (error) {
  return (
    <StyledView className="flex-1 justify-center items-center bg-background p-5">
      <StyledText className="text-error text-center mb-4">{error}</StyledText>
      <StyledTouchableOpacity
        className="bg-primary py-3 px-6 rounded-lg"
        onPress={loadProducts}
      >
        <StyledText className="text-white font-bold">Réessayer</StyledText>
      </StyledTouchableOpacity>
    </StyledView>
  );
}
```

## 4. Avantages des Modifications

### TailwindCSS (NativeWind)

- **Cohérence** : Système de design unifié sur toute l'application
- **Productivité** : Moins de code pour le styling, focus sur la logique
- **Responsive** : Classes adaptatives pour différents écrans
- **Maintenabilité** : Pas de styles inline ou de StyleSheet complexes

### API Service

- **Organisation** : Séparation des responsabilités (UI vs données)
- **Réutilisabilité** : Services utilisables dans toute l'application
- **Testabilité** : Possibilité de mocker facilement les services
- **Maintenance** : Centralisation des requêtes API

## 5. Configurations Restantes

1. **Variables d'environnement** :
   Créer un fichier `.env` à la racine du projet avec les variables nécessaires :

   ```
   API_URL=http://your-api-url/api
   ```

2. **Mises à jour des packages** :
   Mettre à jour les packages suivants pour une meilleure compatibilité :
   ```
   @react-native-async-storage/async-storage@1.23.1
   react-native-gesture-handler@~2.20.2
   react-native-reanimated@~3.16.1
   react-native-safe-area-context@4.12.0
   react-native-screens@~4.4.0
   ```
