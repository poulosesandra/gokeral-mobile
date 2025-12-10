import React, { useEffect, useState, useCallback, useRef } from 'react';

interface PhotoStackProps {
  images: string[];
  interval?: number;
  className?: string;
}

type Card = {
  id: number;
  image: string;
  zIndex: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  isExiting: boolean;
};

const PhotoStack: React.FC<PhotoStackProps> = ({ 
  images,
  interval = 3000,
  className = '' 
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const currentIndexRef = useRef(0);
  const [isCycling, setIsCycling] = useState(false);
  const initializedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!images || images.length === 0) return;
    
    // Only initialize once, ignore subsequent renders with same images
    if (initializedRef.current) return;
    
    initializedRef.current = true;

    // Show ALL images in the stack with alternating peek pattern
    const initialCards: Card[] = images.map((img, idx) => ({
      id: idx,
      image: img,
      zIndex: images.length - idx,
      rotation: idx % 2 === 0 ? -6 : 6,
      offsetX: idx % 2 === 0 ? -20 : 20,
      offsetY: idx * 4,
      scale: 1 - idx * 0.02,
      isExiting: false,
    }));

    setCards(initialCards);
    currentIndexRef.current = images.length;
  }, [images]);

  const cycleCards = useCallback(() => {
    if (!images || images.length === 0 || isCycling) return;

    setIsCycling(true);

    setCards(prevCards => {
      const newCards = [...prevCards]
      if (newCards[0]) {
        newCards[0] = { ...newCards[0], isExiting: true };
      }
      return newCards;
    });

    setTimeout(() => {
      setCards(prevCards => {
        const [, ...remainingCards] = prevCards;
        const nextImage = images[currentIndexRef.current % images.length];
        
        const newCard: Card = {
          id: currentIndexRef.current,
          image: nextImage,
          zIndex: 0,
          rotation: remainingCards.length % 2 === 0 ? 6 : -6,
          offsetX: remainingCards.length % 2 === 0 ? 20 : -20,
          offsetY: remainingCards.length * 4,
          scale: 1 - remainingCards.length * 0.02,
          isExiting: false,
        };

        currentIndexRef.current++;

        const updatedCards = [
          ...remainingCards.map((card, idx) => ({
            ...card,
            zIndex: images.length - idx,
            rotation: idx % 2 === 0 ? -6 : 6,
            offsetX: idx % 2 === 0 ? -20 : 20,
            offsetY: idx * 4,
            scale: 1 - idx * 0.02,
            isExiting: false,
          })),
          newCard,
        ];

        setIsCycling(false);
        return updatedCards;
      });
    }, 600);
  }, [images, isCycling]);

  // Auto-cycle effect
  useEffect(() => {
    if (!images || images.length <= 1) return;

    intervalRef.current = setInterval(() => {
      cycleCards();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [images, interval, cycleCards]);

  const handleClick = () => {
    if (isCycling || !images || images.length <= 1) return;
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cycle immediately
    cycleCards();

    // Restart interval after cycling
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        cycleCards();
      }, interval);
    }, 700);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`relative w-full max-w-xs mx-auto ${className}`}>
      <div 
        className="relative w-full aspect-[3/4] cursor-pointer"
        onClick={handleClick}
        style={{ perspective: '1000px' }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className="absolute inset-0 transition-all duration-[600ms] ease-out"
            style={{
              zIndex: card.zIndex,
              transform: card.isExiting
                ? 'translateX(120%) translateY(50px) rotate(35deg) scale(1.05)'
                : `translateX(${card.offsetX}px) translateY(${card.offsetY}px) rotate(${card.rotation}deg) scale(${card.scale})`,
              opacity: card.isExiting ? 0 : 1,
            }}
          >
            <div className="w-full h-full rounded-xl overflow-hidden shadow-lg bg-white">
              <img
                src={card.image}
                alt={`Photo ${card.id}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoStack;