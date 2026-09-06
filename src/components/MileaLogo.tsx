import React from 'react';

const logoImg = '/assets/images/logo.png';

interface MileaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'header';
  variant?: 'full' | 'icon' | 'wordmark';
  onClick?: () => void;
  color?: 'navy' | 'adaptive' | 'white';
}

export const MileaLogo: React.FC<MileaLogoProps> = ({
  className = '',
  size = 'md',
  onClick,
  color = 'navy',
}) => {
  const sizeClasses = {
    header: 'h-11 sm:h-13 md:h-15 lg:h-16',
    sm: 'h-10 sm:h-12',
    md: 'h-14 sm:h-18',
    lg: 'h-20 sm:h-24',
    xl: 'h-28 sm:h-36',
  };

  const filterClass =
    color === 'white'
      ? '[filter:brightness(0)_invert(1)] drop-shadow-md'
      : color === 'adaptive'
      ? '[filter:brightness(0)_saturate(100%)_invert(8%)_sepia(56%)_saturate(4420%)_hue-rotate(195deg)_brightness(94%)_contrast(106%)] dark:[filter:brightness(0)_invert(1)] drop-shadow-sm'
      : '[filter:brightness(0)_saturate(100%)_invert(8%)_sepia(56%)_saturate(4420%)_hue-rotate(195deg)_brightness(94%)_contrast(106%)] dark:[filter:brightness(0)_saturate(100%)_invert(8%)_sepia(56%)_saturate(4420%)_hue-rotate(195deg)_brightness(120%)_contrast(110%)] drop-shadow-sm';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={logoImg}
        alt="Diário de Viagens Logo"
        className={`${sizeClasses[size]} w-auto object-contain ${filterClass}`}
      />
    </div>
  );
};

