import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icons3DModel from './Icons3DModel';

export default function IconsTest() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Icons3DModel name="person" size={60} />
        <Icons3DModel name="heart" size={60} />
        <Icons3DModel name="chat" size={60} />
      </View>
      <View style={styles.row}>
        <Icons3DModel name="search" size={60} />
        <Icons3DModel name="add" size={60} />
        <Icons3DModel name="call" size={60} />
      </View>
      <View style={styles.row}>
        <Icons3DModel name="person" size={60} isActive={true} />
        <Icons3DModel name="heart" size={60} isActive={true} />
        <Icons3DModel name="chat" size={60} isActive={true} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
}); 