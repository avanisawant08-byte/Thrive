import React, { useState } from 'react';
import { isValidImageUrl, optimizeImageUrl } from '../utils/imageUtils';

const UserAvatar = ({ src, name, size = 'w-12 h-12', iconSize = 'text-2xl', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const hasValidPhoto = isValidImageUrl(src, imgError);

  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center bg-white/10 text-primary-container font-black flex-shrink-0 border border-white/10 ${size} ${className}`}>
      {hasValidPhoto ? (
        <img
          src={optimizeImageUrl(src, 160)}
          alt={name || 'User Profile'}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`material-symbols-outlined text-primary-container/80 select-none ${iconSize}`}>
          person
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
