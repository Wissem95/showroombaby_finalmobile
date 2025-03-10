import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoPlaceholderProps {
  width?: number;
  height?: number;
}

/**
 * Composant de logo temporaire
 * À remplacer plus tard par un vrai logo
 */
const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({ width = 150, height = 100 }) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.text}>ShowroomBaby</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF7043',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LogoPlaceholder; 