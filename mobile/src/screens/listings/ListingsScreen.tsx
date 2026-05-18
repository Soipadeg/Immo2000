import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useListings } from '../../hooks/useListings';

interface ListingItemProps {
  item: any;
  onPress: () => void;
}

const ListingItem = ({ item, onPress }: ListingItemProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {item.images?.[0] && (
      <Image source={{ uri: item.images[0] }} style={styles.image} />
    )}
    <View style={styles.content}>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.price}>{item.price.toLocaleString()} €</Text>
      <View style={styles.details}>
        <Text style={styles.detail}>
          {item.bedrooms} {item.bedrooms > 1 ? 'chambres' : 'chambre'}
        </Text>
        <Text style={styles.detail}>{item.area} m²</Text>
      </View>
      <Text style={styles.location} numberOfLines={1}>
        📍 {item.location}
      </Text>
    </View>
  </TouchableOpacity>
);

export const ListingsScreen = ({ navigation }: any) => {
  const { listings, loading, error, fetchListings } = useListings();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchListings();
    });

    return unsubscribe;
  }, [navigation]);

  const handleListingPress = (id: string) => {
    navigation.navigate('ListingDetail', { id });
  };

  if (loading && !listings.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchListings}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        renderItem={({ item }) => (
          <ListingItem
            item={item}
            onPress={() => handleListingPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  detail: {
    fontSize: 12,
    color: '#666',
  },
  location: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
