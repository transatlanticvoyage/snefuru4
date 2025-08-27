'use client';

import { useState } from 'react';

type AvatarDisplayProps = {
  avatarUrl?: string | null;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDeleteButton?: boolean;
  onDelete?: () => void;
  className?: string;
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-lg'
};

export default function AvatarDisplay({
  avatarUrl,
  email,
  size = 'md',
  showDeleteButton = false,
  onDelete,
  className = ''
}: AvatarDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate initials from email
  const getInitials = (email?: string): string => {
    if (!email) return '?';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  // Generate a consistent color based on email
  const getInitialsBgColor = (email?: string): string => {
    if (!email) return 'bg-gray-500';
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500'
    ];
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const shouldShowImage = avatarUrl && !imageError;

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-lg`}>
        {shouldShowImage ? (
          <img
            src={avatarUrl}
            alt="Profile picture"
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div
            className={`
              w-full h-full flex items-center justify-center text-white font-semibold
              ${getInitialsBgColor(email)}
            `}
          >
            {getInitials(email)}
          </div>
        )}
      </div>

      {/* Delete Button */}
      {showDeleteButton && shouldShowImage && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`
            absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 
            text-white rounded-full flex items-center justify-center
            transition-colors shadow-sm border border-white
            ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title="Delete profile picture"
        >
          {isDeleting ? (
            <div className="animate-spin w-2 h-2 border border-white border-t-transparent rounded-full"></div>
          ) : (
            <svg 
              className="w-3 h-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}