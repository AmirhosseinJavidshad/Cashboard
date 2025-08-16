// GoalsScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, Image, FlatList, StyleSheet, Alert, ActivityIndicator 
} from 'react-native';

export default function GoalsScreen() {
  const [url, setUrl] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist items from backend
  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://10.0.2.2:8000/api/wishlistitems/');
      const json = await response.json();
      setWishlist(json.results);
    } catch (error) {
      Alert.alert('Error', 'Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Submit new URL to backend
  const submitUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Validation', 'Please enter a product URL');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://10.0.2.2:8000/api/wishlistitems/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
      setUrl('');
      fetchWishlist(); // Refresh list
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };


  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text>No Image</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title || 'No Title'}</Text>
        <Text style={styles.price}>{item.price ? item.price + ' Toman' : 'No Price'}</Text>
        <Text style={styles.date}>{new Date(item.updated_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏆 Goals</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter product URL"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button title="Add Product" onPress={submitUrl} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 20 }}
          ListEmptyComponent={<Text>No wishlist items yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  image: { width: 80, height: 80, borderRadius: 4, marginRight: 12 },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 14, color: 'green', marginTop: 4 },
  date: { fontSize: 10, color: '#666', marginTop: 2 },
});
