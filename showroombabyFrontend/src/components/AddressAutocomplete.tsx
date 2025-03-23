import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, List } from 'react-native-paper';
import axios from 'axios';
import debounce from 'lodash/debounce';

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

  // Appliquer un debounce pour éviter trop d'appels API
  const debouncedSearch = debounce((text: string) => {
    searchAddress(text);
  }, 300);

  const searchAddress = async (text: string) => {
    setQuery(text);
    
    if (text.length > 2) {
      try {
        // Utiliser l'API Mapbox Geocoding pour la recherche d'adresses
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=fr&types=address,place,postcode`
        );
        
        // Transformation des résultats de l'API en suggestions
        const apiSuggestions = response.data.features.map((feature: any) => {
          // Extraire les composants de l'adresse
          const addressParts = feature.place_name.split(',');
          const streetAddress = addressParts[0] || '';
          
          // Extraire le code postal (s'il existe)
          let postalCode = '';
          let city = '';
          
          // Essayer d'extraire le code postal des context
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
          
          return {
            title: feature.place_name,
            id: feature.id,
            city: city,
            postalCode: postalCode,
            position: {
              lat: feature.center[1],
              lng: feature.center[0]
            }
          };
        });
        
        setSuggestions(apiSuggestions);
      } catch (error) {
        console.error('Erreur lors de la recherche d\'adresse:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (item: any) => {
    console.log('Adresse sélectionnée:', JSON.stringify(item, null, 2));
    
    // S'assurer que le code postal est correctement extrait
    const address = {
      street: item.title.split(',')[0] || '',
      city: item.city || '',
      postalCode: item.postalCode || '',
      latitude: item.position?.lat,
      longitude: item.position?.lng,
    };
    
    console.log('Données d\'adresse extraites:', address);
    
    setQuery(item.title || '');
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(address);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setShowSuggestions(true);
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
    zIndex: 1,
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
    zIndex: 2,
  },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
}); 