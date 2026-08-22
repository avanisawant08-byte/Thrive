import { isValidImageUrl, optimizeImageUrl } from './imageUtils';

export const DEFAULT_CATEGORY_IMAGES = {
  'Blood Donation': 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=600',
  'blood_donation': 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=600',
  'Tree Plant': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
  'tree_plantation': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
  'Beach Clean': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&q=80&w=600',
  'beach_cleanup': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&q=80&w=600',
  'Food Drive': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
  'food_drive': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
  'Education': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
  'education': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
  'Volunteering': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600',
  'volunteering': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600',
  'Other': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600',
  'other': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600'
};

export const getCategoryDefaultImage = (activityType) => {
  if (!activityType) return DEFAULT_CATEGORY_IMAGES['Volunteering'];
  return DEFAULT_CATEGORY_IMAGES[activityType] || DEFAULT_CATEGORY_IMAGES['Volunteering'];
};

export const getEventImageSrc = (event, isBroken = false) => {
  const src = !isValidImageUrl(event?.eventImage, isBroken)
    ? getCategoryDefaultImage(event?.activityType)
    : event.eventImage;
  return optimizeImageUrl(src, 500);
};
