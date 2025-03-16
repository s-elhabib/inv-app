import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StyledText, StyledCard } from './StyledComponents';

export function ProductCard({ product }) {
  return (
    <StyledCard style={styles.container}>
      <StyledText style={styles.title}>{product.name}</StyledText>
      <StyledText style={styles.price}>{product.price}</StyledText>
    </StyledCard>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    opacity: 0.7,
  },
});
