import React from 'react';
import { Shuffle } from 'lucide-react';
import { Button } from './button';

interface ShuffleButtonProps {
  isShuffling: boolean;
  onShuffle: () => void;
}

export const ShuffleButton: React.FC<ShuffleButtonProps> = ({ 
  isShuffling, 
  onShuffle 
}) => {
  return (
    <div className="mt-6 flex justify-center">
      <Button
        variant="ghost"
        className={`border border-white/10 hover:border-white/20 bg-black hover:bg-black/90 transition-all duration-300 ${
          isShuffling ? 'text-white' : 'text-white/60'
        }`}
        onClick={onShuffle}
      >
        <Shuffle className="w-4 h-4 mr-2" />
        <span className="font-light tracking-wider text-xs uppercase">
          Shuffle Both
        </span>
      </Button>
    </div>
  );
};
