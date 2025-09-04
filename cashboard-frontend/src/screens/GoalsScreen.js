// GoalsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, Image,
  FlatList, StyleSheet, Alert, ActivityIndicator,
  RefreshControl
} from 'react-native';
import {
  getWishlistItems,
  insertWishlistItem,
  syncWishlistWithBackend
} from '../db';
import digikalaScraper from '../utils/digikalaScraper'; // JS scraper

export default function GoalsScreen() {
  const [url, setUrl] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load wishlist from SQLite
  const loadWishlist = async () => {
    setLoading(true);
    try {
      const items = await getWishlistItems();
      setWishlist(items);
    } catch (err) {
      console.error('Failed to load wishlist', err);
      Alert.alert('Error', 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Sync local <-> backend
  const syncWishlist = async () => {
    try {
      await syncWishlistWithBackend();
      await loadWishlist(); // refresh after sync
    } catch (err) {
      console.error('Sync failed', err);
    }
  };

  useEffect(() => {
    loadWishlist();
    syncWishlist();
  }, []);

  // Add new wishlist item
  const submitUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Validation', 'Please enter a product URL');
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Try to scrape locally first
      let scrapedData = { title: '', price: 0, image_url: null, updated_at: new Date() };
      try {
        const result = await digikalaScraper(url);
        if (!result.error) {
          scrapedData = result;
        } else {
          console.warn('Local scraper failed, will fallback to backend:', result.error);
        }
      } catch (scrapeErr) {
        console.warn('Local scraping exception:', scrapeErr);
      }

      // 2️⃣ Insert item locally with scraped info
      await insertWishlistItem(
        url,
        scrapedData.title,
        scrapedData.price,
        scrapedData.image_url,
        0 // synced flag
      );

      setUrl('');
      await loadWishlist();

      // 3️⃣ Trigger backend sync (will run digikala_scraper.py on server)
      await syncWishlist();
    } catch (err) {
      console.error('Add wishlist failed', err);
      Alert.alert('Error', 'Could not add wishlist item');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await syncWishlist();
    setRefreshing(false);
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
        <Text style={styles.title}>{item.title || 'No Title (waiting for sync)'}</Text>
        <Text style={styles.price}>
          {item.price ? `${item.price} Toman` : 'No Price yet'}
        </Text>
        {item.updated_at && (
          <Text style={styles.date}>
            {new Date(item.updated_at).toLocaleDateString()}
          </Text>
        )}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
