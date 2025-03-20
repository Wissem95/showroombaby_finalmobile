import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, List } from 'react-native-paper';
import axios from 'axios';
import debounce from 'lodash/debounce';

const HERE_API_KEY = 'mJTj_ivJS2vjA9GLOtq6AtOFK91e8CoNoBpvK1mEQ7c';

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

  const searchAddress = debounce(async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(text)}&apiKey=${HERE_API_KEY}&limit=5`
      );

      if (response.data?.items) {
        setSuggestions(response.data.items);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresse:', error);
      setSuggestions([]);
    }
  }, 300);

  const handleSelect = (item: any) => {
    const address = {
      street: item.address?.street,
      city: item.address?.city,
      postalCode: item.address?.postalCode,
      latitude: item.position?.lat,
      longitude: item.position?.lng,
    };

    setQuery(item.title || item.address?.label || '');
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
          searchAddress(text);
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
              title={item.title || item.address?.label}
              description={item.address?.city}
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