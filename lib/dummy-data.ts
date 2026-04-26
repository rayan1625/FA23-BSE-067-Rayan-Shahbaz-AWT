export const DUMMY_CATEGORIES = [
  { id: 1, name: 'Real Estate', slug: 'real-estate', icon: 'Home' },
  { id: 2, name: 'Vehicles', slug: 'vehicles', icon: 'Car' },
  { id: 3, name: 'Electronics', slug: 'electronics', icon: 'Laptop' },
  { id: 4, name: 'Jobs', slug: 'jobs', icon: 'Briefcase' },
  { id: 5, name: 'Services', slug: 'services', icon: 'Wrench' },
  { id: 6, name: 'Fashion', slug: 'fashion', icon: 'Shirt' },
  { id: 7, name: 'Home & Garden', slug: 'home-garden', icon: 'Flower' },
  { id: 8, name: 'Pets', slug: 'pets', icon: 'Dog' },
  { id: 9, name: 'Community', slug: 'community', icon: 'Users' },
  { id: 10, name: 'Events', slug: 'events', icon: 'Calendar' },
]

export const DUMMY_CITIES = [
  // North America
  { id: 1, name: 'New York', state: 'USA' },
  { id: 2, name: 'Toronto', state: 'Canada' },
  { id: 3, name: 'Mexico City', state: 'Mexico' },
  // Europe
  { id: 4, name: 'London', state: 'UK' },
  { id: 5, name: 'Paris', state: 'France' },
  { id: 6, name: 'Berlin', state: 'Germany' },
  // Asia
  { id: 7, name: 'Tokyo', state: 'Japan' },
  { id: 8, name: 'Dubai', state: 'UAE' },
  { id: 9, name: 'Singapore', state: 'Singapore' },
  { id: 10, name: 'Mumbai', state: 'India' },
  { id: 11, name: 'Sargodha', state: 'Pakistan' },
  { id: 12, name: 'Lahore', state: 'Pakistan' },
  { id: 13, name: 'Karachi', state: 'Pakistan' },
  // Australia
  { id: 14, name: 'Sydney', state: 'Australia' },
  // Africa
  { id: 15, name: 'Cairo', state: 'Egypt' },
]

export const DUMMY_PACKAGES = [
  { id: 1, name: 'Basic', duration_days: 7, weight: 0, is_featured: false, price: 9.99 },
  { id: 2, name: 'Standard', duration_days: 15, weight: 5, is_featured: false, price: 19.99 },
  { id: 3, name: 'Premium', duration_days: 30, weight: 10, is_featured: true, price: 49.99 },
]

export const DUMMY_ADS = [
  {
    id: '1',
    title: 'Luxury Apartment in Downtown',
    slug: 'luxury-apartment-in-downtown',
    description: 'Beautiful 2 bedroom apartment with city views, modern amenities, and a balcony.',
    price: 3500.00,
    status: 'published',
    category: DUMMY_CATEGORIES[0],
    city: DUMMY_CITIES[0],
    is_featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    created_at: new Date().toISOString(),
    seller: { name: 'Acme Real Estate', is_verified: true }
  },
  {
    id: '2',
    title: '2022 Tesla Model 3 Long Range',
    slug: '2022-tesla-model-3-lr',
    description: 'Excellent condition, white exterior, black interior, FSD included.',
    price: 45000.00,
    status: 'published',
    category: DUMMY_CATEGORIES[1],
    city: DUMMY_CITIES[1],
    is_featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
    created_at: new Date().toISOString(),
    seller: { name: 'John Doe', is_verified: false }
  },
  {
    id: '3',
    title: 'MacBook Pro M2 Max 64GB',
    slug: 'macbook-pro-m2-max',
    description: 'Barely used, perfectly clean. Comes with original box and AppleCare+.',
    price: 2800.00,
    status: 'published',
    category: DUMMY_CATEGORIES[2],
    city: DUMMY_CITIES[2],
    is_featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    created_at: new Date().toISOString(),
    seller: { name: 'Tech Reseller LLC', is_verified: true }
  }
]
