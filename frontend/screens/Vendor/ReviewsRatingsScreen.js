import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const mockReviews = [
  { id: 1, name: 'Amit', rating: 5, comment: 'Great food and fast delivery!' },
  { id: 2, name: 'Priya', rating: 4, comment: 'Tasty food, but delivery was a bit late.' },
  { id: 3, name: 'Rahul', rating: 5, comment: 'Excellent service and delicious meals.' },
];

const ReviewsRatingsScreen = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Reviews & Ratings</Text>
    {mockReviews.map((review) => (
      <View key={review.id} style={styles.card}>
        <View style={styles.row}>
          <MaterialIcons name="person" size={24} color="#FF9800" />
          <Text style={styles.name}>{review.name}</Text>
          <View style={styles.ratingRow}>
            {[...Array(review.rating)].map((_, i) => (
              <MaterialIcons key={i} name="star" size={20} color="#FFD600" />
            ))}
          </View>
        </View>
        <Text style={styles.comment}>{review.comment}</Text>
      </View>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8, flex: 1 },
  ratingRow: { flexDirection: 'row' },
  comment: { fontSize: 15, color: '#666', marginTop: 4 },
});

export default ReviewsRatingsScreen; 