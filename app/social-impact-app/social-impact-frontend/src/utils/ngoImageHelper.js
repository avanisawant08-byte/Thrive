import { isValidImageUrl, optimizeImageUrl } from './imageUtils';

export const NGO_CAUSE_BANNERS = {
  'Disaster Relief': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600',
  'disaster_relief': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600',
  'disaster': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600',
  'Education': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
  'education': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
  'Health': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
  'health': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
  'healthcare': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
  'Environment': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
  'environment': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
  'nature': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
  'Animal Welfare': 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600',
  'animal': 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600',
  'Food Drive': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
  'food': 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
  'default': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600'
};

export const NGO_DEFAULT_LOGOS = [
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=200'
];

/**
 * Returns a high quality cause banner for an NGO card or profile header.
 */
export const getNGOBannerSrc = (ngo, isBroken = false) => {
  if (isValidImageUrl(ngo?.banner, isBroken)) {
    return optimizeImageUrl(ngo.banner, 600);
  }
  const text = `${ngo?.name || ''} ${ngo?.description || ''} ${(ngo?.causes || []).join(' ')}`.toLowerCase();

  if (text.includes('disaster') || text.includes('relief') || text.includes('flood') || text.includes('earthquake')) {
    return optimizeImageUrl(NGO_CAUSE_BANNERS['Disaster Relief'], 600);
  }
  if (text.includes('educat') || text.includes('school') || text.includes('child') || text.includes('teach') || text.includes('student')) {
    return optimizeImageUrl(NGO_CAUSE_BANNERS['Education'], 600);
  }
  if (text.includes('health') || text.includes('medic') || text.includes('blood') || text.includes('care') || text.includes('hospital')) {
    return optimizeImageUrl(NGO_CAUSE_BANNERS['Health'], 600);
  }
  if (text.includes('tree') || text.includes('plant') || text.includes('nature') || text.includes('green') || text.includes('clean') || text.includes('earth') || text.includes('environment')) {
    return optimizeImageUrl(NGO_CAUSE_BANNERS['Environment'], 600);
  }
  if (text.includes('animal') || text.includes('dog') || text.includes('cat') || text.includes('wildlife') || text.includes('pet') || text.includes('rescue')) {
    return optimizeImageUrl(NGO_CAUSE_BANNERS['Animal Welfare'], 600);
  }
  if (text.includes('food') || text.includes('meal') || text.includes('feed') || text.includes('ration') || text.includes('hunger')) {
    return optimizeImageUrl(NGO_CAUSE_BANNERS['Food Drive'], 600);
  }

  return optimizeImageUrl(NGO_CAUSE_BANNERS['default'], 600);
};

/**
 * Returns a valid logo image for an NGO, falling back gracefully without broken URLs.
 */
export const getNGOLogoSrc = (ngo, isBroken = false) => {
  if (!isValidImageUrl(ngo?.logo, isBroken)) {
    return optimizeImageUrl(NGO_DEFAULT_LOGOS[0], 200);
  }
  return optimizeImageUrl(ngo.logo, 200);
};
