import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text, Avatar, List, Divider } from 'react-native-paper';
import AuthService from '../services/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const user = AuthService.getUser();

  const handleLogout = async () => {
    await AuthService.logout();
    // La navigation sera gérée par le AppNavigator
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={user?.name?.charAt(0) || 'U'} />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Divider />

      <List.Section>
        <List.Subheader>Paramètres du compte</List.Subheader>
        <List.Item
          title="Informations personnelles"
          left={props => <List.Icon {...props} icon="account" />}
          onPress={() => {}}
        />
        <List.Item
          title="Changer de mot de passe"
          left={props => <List.Icon {...props} icon="lock" />}
          onPress={() => {}}
        />
        <List.Item
          title="Adresses de livraison"
          left={props => <List.Icon {...props} icon="map-marker" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Mes achats</List.Subheader>
        <List.Item
          title="Commandes"
          left={props => <List.Icon {...props} icon="shopping" />}
          onPress={() => {}}
        />
        <List.Item
          title="Liste de souhaits"
          left={props => <List.Icon {...props} icon="heart" />}
          onPress={() => {}}
        />
        <List.Item
          title="Avis et évaluations"
          left={props => <List.Icon {...props} icon="star" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Application</List.Subheader>
        <List.Item
          title="À propos"
          left={props => <List.Icon {...props} icon="information" />}
          onPress={() => {}}
        />
        <List.Item
          title="Aide et support"
          left={props => <List.Icon {...props} icon="help-circle" />}
          onPress={() => {}}
        />
      </List.Section>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Déconnexion
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    marginVertical: 20,
  },
}); 