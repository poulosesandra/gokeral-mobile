import React from 'react';

interface RouteListProps {
  routes: google.maps.DirectionsRoute[];
  highlightedIndex: number; // transient highlight (hover/click)
  confirmedIndex: number; // confirmed selection
  onHighlight: (index: number) => void; // highlight only
  onConfirm: (index: number) => void; // confirms and opens panel
}

const RouteList: React.FC<RouteListProps> = ({ routes, highlightedIndex, confirmedIndex, onHighlight, onConfirm }) => {
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  React.useEffect(() => {
    const idx = highlightedIndex >= 0 ? highlightedIndex : (confirmedIndex >= 0 ? confirmedIndex : -1);
    if (idx >= 0) {
      const el = itemRefs.current[idx];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // small focus outline for accessibility
        el.focus({ preventScroll: true });
      }
    }
  }, [highlightedIndex, confirmedIndex]);

  if (!routes || routes.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mt-4 pt-4">
      <h3 className="font-semibold text-gray-700">Recommended Routes</h3>
      {routes.map((route, index) => {
        const leg = route.legs[0];
        const isConfirmed = index === confirmedIndex;
        const isHighlighted = index === highlightedIndex;
        const stepsCount = leg?.steps?.length || 0;

        return (
          <div
            key={index}
            role="button"
            tabIndex={0}
            ref={(el) => { itemRefs.current[index] = el; }}
            onClick={() => onHighlight(index)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onHighlight(index); }}
            className={`p-3 rounded-lg border cursor-pointer transition-all outline-none ${
              isConfirmed ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' : isHighlighted ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
            aria-pressed={isConfirmed}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-bold ${isConfirmed ? 'text-blue-700' : (isHighlighted ? 'text-blue-600' : 'text-gray-700')}`}>
                {index === 0 ? 'Fastest Route' : `Route ${index + 1}`}
              </span>
              {isConfirmed && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Selected</span>}
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

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onConfirm(index); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${isConfirmed ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                aria-pressed={isConfirmed}
                aria-label={`Select route ${index + 1}`}
              >
                {isConfirmed ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RouteList;
