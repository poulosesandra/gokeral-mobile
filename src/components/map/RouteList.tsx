import React from 'react';

interface RouteListProps {
  routes: google.maps.DirectionsRoute[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const RouteList: React.FC<RouteListProps> = ({ routes, selectedIndex, onSelect }) => {
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  React.useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // small focus outline for accessibility
      el.focus({ preventScroll: true });
    }
  }, [selectedIndex]);

  if (!routes || routes.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mt-4 border-t pt-4">
      <h3 className="font-semibold text-gray-700">Recommended Routes</h3>
      {routes.map((route, index) => {
        const leg = route.legs[0];
        const isSelected = index === selectedIndex;
        const stepsCount = leg?.steps?.length || 0;

        return (
          <div
            key={index}
            role="button"
            tabIndex={0}
            ref={(el) => { itemRefs.current[index] = el; }}
            onClick={() => onSelect(index)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(index); }}
            className={`p-3 rounded-lg border cursor-pointer transition-all outline-none ${
              isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
            }`}
            aria-pressed={isSelected}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                {index === 0 ? 'Fastest Route' : `Route ${index + 1}`}
              </span>
              {isSelected && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Selected</span>}
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>{leg.duration?.text}</span>
              <span className="text-gray-400">|</span>
              <span>{leg.distance?.text}</span>
            </div>

            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <div className="truncate">via {route.summary || '—'}</div>
              <div className="ml-2 text-xs text-gray-400">{stepsCount} turns</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RouteList;
