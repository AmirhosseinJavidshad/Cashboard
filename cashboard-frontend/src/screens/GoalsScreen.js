// src/screens/GoalsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useObservable } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import { addWishlistItem, syncAllData } from '../database/db';
import digikalaScraper from '../utils/digikalaScraper'; // local guest/offline scraper
import axios from 'axios';

export default function GoalsScreen({ userId, isGuest }) {
  const db = useDatabase();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistData, setWishlistData] = useState([]);

  // Live query for guest/local mode
  const localWishlist = useObservable(() =>
    db.collections.get('wishlist_items')
      .query(Q.where('deleted_at', null))
      .observe()
  );

  // Fetch backend wishlist items (logged-in)
  const fetchBackendWishlist = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`https://api.cashboardapp.ir/api/wishlist-items/`, {
        headers: { Authorization: `Bearer ${userId}` }, // JWT token
      });
      setWishlistData(res.data || []);
    } catch (err) {
      console.error('Backend wishlist fetch failed', err);
      Alert.alert('Error', 'Failed to fetch wishlist from server');
    }
  };

  const syncWishlist = async () => {
    try {
      if (isGuest) return; // guest sync only uses local DB
      if (userId) {
        await syncAllData(userId);
        await fetchBackendWishlist();
      }
    } catch (err) {
      console.error('Sync failed', err);
      Alert.alert('Error', 'Failed to sync wishlist');
    }
  };

  useEffect(() => {
    if (isGuest) {
      setWishlistData(localWishlist || []);
    } else {
      fetchBackendWishlist();
    }
  }, [localWishlist]);

  const submitUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Validation', 'Please enter a product URL');
      return;
    }

    setLoading(true);
    try {
      let scrapedData = { title: '', price: 0, image_url: null, updated_at: Date.now() };

      if (isGuest) {
        // Guest/offline: use local scraper
        try {
          const result = await digikalaScraper(url);
          if (!result.error) {
            scrapedData = {
              ...result,
              updated_at: result.updated_at ? new Date(result.updated_at).getTime() : Date.now(),
            };
          }
        } catch (err) {
          console.warn('Local scraping failed:', err);
        }
      } else {
        // Logged-in: use backend scraper via API
        try {
          const res = await axios.post(
            `https://api.cashboardapp.ir/api/fetch-product/`,
            { url },
            { headers: { Authorization: `Bearer ${userId}` } }
          );
          if (res.data && !res.data.error) {
            scrapedData = {
              title: res.data.title || '',
              price: res.data.price || 0,
              image_url: res.data.image_url || null,
              updated_at: new Date(res.data.updated_at).getTime(),
            };
          }
        } catch (err) {
          console.warn('Backend scraping failed:', err);
        }
      }

      // Save to WatermelonDB
      await addWishlistItem({
        url,
        title: scrapedData.title || '',
        price: scrapedData.price || 0,
        image_url: scrapedData.image_url || null,
        updated_at: scrapedData.updated_at,
        synced: !isGuest,
      });

      setUrl('');
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
        <Text style={styles.title}>{item.title || 'No Title yet'}</Text>
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
          data={wishlistData || []}
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
