import React from 'react';

const horizontalLogoImg = '/assets/images/logo%20horizontal.png';

interface MileaLogoHorizontalProps {
  className?: string;
  size?: 'xs' | 'header' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const MileaLogoHorizontal: React.FC<MileaLogoHorizontalProps> = ({
  className = '',
  size = 'header',
  onClick,
}) => {
  const sizeClasses = {
    xs: 'h-5 sm:h-6',
    header: 'h-7 sm:h-8 md:h-9',
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9 md:h-10',
    lg: 'h-10 sm:h-12 md:h-13',
    xl: 'h-13 sm:h-16',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Light mode horizontal logo with deep navy / ocean blue palette filter */}
      <img
        src={horizontalLogoImg}
        alt="Melia - Diário de Viagens"
        className={`${sizeClasses[size]} w-auto object-contain [filter:brightness(0)_saturate(100%)_invert(13%)_sepia(49%)_saturate(2811%)_hue-rotate(185deg)_brightness(94%)_contrast(102%)] drop-shadow-sm dark:hidden`}
      />
      {/* Dark mode horizontal logo with bright lime / clean white glow */}
      <img
        src={horizontalLogoImg}
        alt="Melia - Diário de Viagens"
        className={`${sizeClasses[size]} w-auto object-contain hidden dark:block [filter:brightness(0)_saturate(100%)_invert(83%)_sepia(45%)_saturate(836%)_hue-rotate(34deg)_brightness(101%)_contrast(92%)] drop-shadow-[0_0_14px_rgba(163,230,53,0.4)]`}
      />
    </div>
  );
};
