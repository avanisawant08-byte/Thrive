import { isValidImageUrl, optimizeImageUrl } from './imageUtils';

export const SHOP_CATEGORY_BANNERS = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800',
  retail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  bakery: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
  other: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=800',
  default: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=800'
};

export const getShopBannerSrc = (shop, isBroken = false) => {
  if (isValidImageUrl(shop?.shopDetails?.banner, isBroken)) {
    return optimizeImageUrl(shop.shopDetails.banner, 600);
  }
  const cat = (shop?.shopDetails?.category || shop?.category || '').toLowerCase();
  const name = (shop?.shopDetails?.shopName || shop?.name || '').toLowerCase();

  if (cat.includes('restaurant') || name.includes('dhaba') || name.includes('food') || name.includes('kitchen') || name.includes('dine')) {
    return optimizeImageUrl(SHOP_CATEGORY_BANNERS.restaurant, 600);
  }
  if (cat.includes('cafe') || name.includes('coffee') || name.includes('tea') || name.includes('brew')) {
    return optimizeImageUrl(SHOP_CATEGORY_BANNERS.cafe, 600);
  }
  if (cat.includes('retail') || name.includes('cloth') || name.includes('fashion') || name.includes('store') || name.includes('mart')) {
    return optimizeImageUrl(SHOP_CATEGORY_BANNERS.retail, 600);
  }
  if (cat.includes('hotel') || name.includes('resort') || name.includes('inn') || name.includes('stay')) {
    return optimizeImageUrl(SHOP_CATEGORY_BANNERS.hotel, 600);
  }
  if (cat.includes('bakery') || name.includes('cake') || name.includes('pastry')) {
    return optimizeImageUrl(SHOP_CATEGORY_BANNERS.bakery, 600);
  }
  if (cat.includes('grocery') || name.includes('organic') || name.includes('kirana')) {
    return optimizeImageUrl(SHOP_CATEGORY_BANNERS.grocery, 600);
  }
  if (cat.includes('gym') || cat.includes('fitness')) {
    return optimizeImageUrl(SHOP_CATEGORY_BANNERS.fitness, 600);
  }

  return optimizeImageUrl(SHOP_CATEGORY_BANNERS.default, 600);
};

export const getShopLogoSrc = (shop, isBroken = false) => {
  const logo = shop?.shopDetails?.logo || shop?.profilePhoto;
  if (!isValidImageUrl(logo, isBroken)) {
    return null; // Will trigger stylized initial avatar
  }
  return optimizeImageUrl(logo, 200);
};
