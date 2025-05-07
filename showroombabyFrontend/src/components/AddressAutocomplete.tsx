import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, List } from 'react-native-paper';
import axios from 'axios';
import debounce from 'lodash.debounce';

// Token Mapbox pour l'autocomplétion
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoid2lzc2VtOTUiLCJhIjoiY204bG52Z3cyMWQ5dTJrcXI2d210ZnY2ZSJ9.-xQ5BHlcU51dTyLmbHoXog';

interface AddressAutocompleteProps {
  onSelect: (address: {
    street?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  placeholder?: string;
  style?: any;
}

export default function AddressAutocomplete({ onSelect, placeholder = "Entrez une adresse", style }: AddressAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fonction pour rechercher les adresses
  const searchAddress = async (text: string) => {
    if (text.length > 2) {
      try {
        // Utiliser l'API Mapbox Geocoding pour la recherche d'adresses
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=fr&types=address,place,postcode`
        );
        
        if (response.data && response.data.features) {
          // Transformation des résultats de l'API en suggestions
          const apiSuggestions = response.data.features.map((feature: any) => {
            // Extraire les composants de l'adresse
            const addressParts = feature.place_name.split(',');
            const streetAddress = addressParts[0] || '';
            
            // Extraire le code postal (s'il existe)
            let postalCode = '';
            let city = '';
            
            // Essayer d'extraire le code postal et la ville des context
            if (feature.context) {
              for (const context of feature.context) {
                if (context.id.startsWith('postcode')) {
                  postalCode = context.text;
                }
                if (context.id.startsWith('place')) {
                  city = context.text;
                }
              }
            }
            
            // Si la ville n'est pas trouvée dans les contextes, essayer de l'extraire du place_name
            if (!city && addressParts.length > 1) {
              // La ville est souvent le deuxième élément dans l'adresse
              city = addressParts[1].trim();
            }
            
            // Pour les lieux (places) sans contexte, utiliser le text comme ville
            if (feature.place_type && feature.place_type.includes('place') && !city) {
              city = feature.text;
            }
            
            return {
              title: feature.place_name,
              id: feature.id,
              city: city,
              postalCode: postalCode,
              place_type: feature.place_type,
              position: {
                lat: feature.center[1],
                lng: feature.center[0]
              }
            };
          });
          
          setSuggestions(apiSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Erreur lors de la recherche d\'adresse:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  // Appliquer un debounce avec useCallback pour s'assurer qu'il n'est pas recréé à chaque rendu
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      searchAddress(text);
    }, 300),
    []
  );

  // Nettoyage du debounce lors du démontage du composant
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSelect = (item: any) => {
    // S'assurer que le code postal est correctement extrait
    const address = {
      street: item.title.split(',')[0] || '',
      city: item.city || '',
      postalCode: item.postalCode || '',
      latitude: item.position?.lat,
      longitude: item.position?.lng,
    };
    
    // Mettre à jour le champ de recherche avec l'adresse sélectionnée
    setQuery(item.title);
    setSelectedItem(item);
    
    // Cacher les suggestions après la sélection
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Transmettre les informations au composant parent
    onSelect(address);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setShowSuggestions(true);
          // Réinitialiser l'adresse sélectionnée si l'utilisateur modifie le texte
          if (selectedItem && text !== selectedItem.title) {
            setSelectedItem(null);
          }
          debouncedSearch(text);
        }}
        placeholder={placeholder}
        mode="outlined"
        style={styles.input}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <List.Item
              key={index}
              title={item.title}
              description={item.postalCode ? `${item.city}, ${item.postalCode}` : item.city}
              onPress={() => handleSelect(item)}
              style={styles.suggestionItem}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000, // Augmenter le z-index pour s'assurer que les suggestions s'affichent au-dessus de tout
  },
  input: {
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
    zIndex: 1001, // Supérieur au container
    overflow: 'visible',
  },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
}); 