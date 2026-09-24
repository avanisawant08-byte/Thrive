import { isValidImageUrl, optimizeImageUrl } from './imageUtils';

export const REWARD_CATEGORY_IMAGES = {
  restaurant: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600',
  dhaba: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600',
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
  momos: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=600',
  fastfood: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
  bakery: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600',
  dessert: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=600',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600',
  clothing: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=600',
  shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600',
  wellness: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
  books: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600',
  electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
  experiences: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=600',
  coupon: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600',
  discount: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=600',
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
  default: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600'
};

/**
 * Resolves a high-quality contextual image for any reward, coupon, or discount offer.
 * Matches keywords in title, description, or category to select the most authentic banner.
 */
export const getRewardDefaultImage = (item) => {
  if (!item) return REWARD_CATEGORY_IMAGES.default;

  const text = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.shopName || ''}`.toLowerCase();

  if (text.includes('dhaba') || text.includes('pr da dhaba') || text.includes('punjabi') || text.includes('roti') || text.includes('paneer')) {
    return REWARD_CATEGORY_IMAGES.dhaba;
  }
  if (text.includes('momo') || text.includes('khim mom') || text.includes('dim sum') || text.includes('dumpling') || text.includes('chinese')) {
    return REWARD_CATEGORY_IMAGES.momos;
  }
  if (text.includes('coffee') || text.includes('cafe') || text.includes('cofee') || text.includes('cappuccino') || text.includes('latte') || text.includes('ccd') || text.includes('starbucks')) {
    return REWARD_CATEGORY_IMAGES.coffee;
  }
  if (text.includes('tea') || text.includes('chai') || text.includes('beverage')) {
    return REWARD_CATEGORY_IMAGES.tea;
  }
  if (text.includes('pizza') || text.includes('slice') || text.includes('domino') || text.includes('pasta')) {
    return REWARD_CATEGORY_IMAGES.pizza;
  }
  if (text.includes('burger') || text.includes('fast food') || text.includes('fries') || text.includes('snack') || text.includes('sandwich')) {
    return REWARD_CATEGORY_IMAGES.fastfood;
  }
  if (text.includes('restaurant') || text.includes('food') || text.includes('dining') || text.includes('meal') || text.includes('buffet') || text.includes('lunch') || text.includes('dinner') || text.includes('biryani')) {
    return REWARD_CATEGORY_IMAGES.restaurant;
  }
  if (text.includes('cake') || text.includes('bakery') || text.includes('pastry') || text.includes('pastries') || text.includes('sweet') || text.includes('dessert') || text.includes('ice cream')) {
    return REWARD_CATEGORY_IMAGES.bakery;
  }
  if (text.includes('shoe') || text.includes('sneaker') || text.includes('footwear')) {
    return REWARD_CATEGORY_IMAGES.shoes;
  }
  if (text.includes('cloth') || text.includes('apparel') || text.includes('shirt') || text.includes('dress') || text.includes('fashion') || text.includes('wear') || text.includes('boutique') || text.includes('outfit')) {
    return REWARD_CATEGORY_IMAGES.fashion;
  }
  if (text.includes('grocery') || text.includes('supermarket') || text.includes('mart') || text.includes('organic') || text.includes('kirana') || text.includes('fruits') || text.includes('vegetable')) {
    return REWARD_CATEGORY_IMAGES.grocery;
  }
  if (text.includes('gym') || text.includes('fitness') || text.includes('workout') || text.includes('muscle') || text.includes('protein') || text.includes('training')) {
    return REWARD_CATEGORY_IMAGES.fitness;
  }
  if (text.includes('spa') || text.includes('wellness') || text.includes('salon') || text.includes('massage') || text.includes('relax') || text.includes('beauty')) {
    return REWARD_CATEGORY_IMAGES.wellness;
  }
  if (text.includes('book') || text.includes('read') || text.includes('novel') || text.includes('stationery') || text.includes('pen') || text.includes('notebook')) {
    return REWARD_CATEGORY_IMAGES.books;
  }
  if (text.includes('tech') || text.includes('electronic') || text.includes('gadget') || text.includes('mobile') || text.includes('phone') || text.includes('laptop') || text.includes('earphone') || text.includes('headphone')) {
    return REWARD_CATEGORY_IMAGES.electronics;
  }
  if (text.includes('trek') || text.includes('experience') || text.includes('tour') || text.includes('trip') || text.includes('adventure') || text.includes('travel') || text.includes('camp')) {
    return REWARD_CATEGORY_IMAGES.experiences;
  }
  if (item.category === 'product' || text.includes('product')) {
    return REWARD_CATEGORY_IMAGES.product;
  }
  if (item.category === 'discount' || text.includes('discount')) {
    return REWARD_CATEGORY_IMAGES.discount;
  }
  if (item.category === 'coupon' || text.includes('coupon')) {
    return REWARD_CATEGORY_IMAGES.coupon;
  }

  return REWARD_CATEGORY_IMAGES.default;
};

/**
 * Returns the valid image URL or automatically falls back to category default image.
 */
export const getRewardImageSrc = (item, isBroken = false) => {
  const src = !isValidImageUrl(item?.imageUrl, isBroken)
    ? getRewardDefaultImage(item)
    : item.imageUrl;
  return optimizeImageUrl(src, 500);
};
