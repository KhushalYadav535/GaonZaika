import { apiClient } from './apiService';

const foodService = {
  /**
   * Get all unique food categories
   */
  getCategories: async () => {
    try {
      const response = await apiClient.get('/foods/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching food categories:', error);
      throw error;
    }
  },

  /**
   * Get popular food items across all restaurants
   */
  getPopularFoods: async () => {
    try {
      const response = await apiClient.get('/foods/popular');
      return response.data;
    } catch (error) {
      console.error('Error fetching popular foods:', error);
      throw error;
    }
  },

  /**
   * Get all restaurants serving a specific dish
   */
  getRestaurantsByDish: async (dishName) => {
    try {
      const response = await apiClient.get(`/foods/restaurants/${encodeURIComponent(dishName)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching restaurants for dish ${dishName}:`, error);
      throw error;
    }
  },

  /**
   * Search for foods and restaurants
   */
  searchFoods: async (query, category = null) => {
    try {
      let url = `/foods/search?q=${encodeURIComponent(query)}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error searching for foods:`, error);
      throw error;
    }
  },

  /**
   * Get all dishes in a specific category
   */
  getDishesByCategory: async (category) => {
    try {
      const response = await apiClient.get(`/foods/by-category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching dishes for category ${category}:`, error);
      throw error;
    }
  },
};

export default foodService;
