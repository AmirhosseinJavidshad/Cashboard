// src/screens/GoalsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, Image,
  FlatList, StyleSheet, Alert, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useObservable } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import { addWishlistItem, syncAllData } from '../database/db';
import digikalaScraper from '../utils/digikalaScraper';

export default function GoalsScreen({ userId }) {
  const db = useDatabase();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Live query of wishlist items (non-deleted)
  const wishlist = useObservable(() =>
    db.collections.get('wishlist_items')
      .query(Q.where('deleted_at', null))
      .observe()
  );

  const syncWishlist = async () => {
    try {
      if (userId) await syncAllData(userId);
    } catch (err) {
      console.error('Sync failed', err);
      Alert.alert('Error', 'Failed to sync wishlist');
    }
  };

  useEffect(() => {
    syncWishlist();
  }, []);

  const submitUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Validation', 'Please enter a product URL');
      return;
    }

    setLoading(true);
    try {
      // Scrape product data locally
      let scrapedData = { title: '', price: 0, image_url: null, updated_at: new Date().getTime() };
      try {
        const result = await digikalaScraper(url);
        if (!result.error) scrapedData = {
          ...result,
          updated_at: result.updated_at ? new Date(result.updated_at).getTime() : new Date().getTime()
        };
      } catch (scrapeErr) {
        console.warn('Local scraping exception:', scrapeErr);
      }

      // Insert into WatermelonDB
      await addWishlistItem({
        url,
        title: scrapedData.title || '',
        price: scrapedData.price || 0,
        image_url: scrapedData.image_url || null,
        updated_at: scrapedData.updated_at,
        synced: false,
      });

      setUrl('');

      // Trigger backend sync
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
          data={wishlist || []}
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
