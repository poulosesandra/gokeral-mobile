import React, { useEffect, useState } from "react";

type Destination = {
  name: string;
  image: string;
};

type Props = {
  destinations: Destination[];
  isLargeScreen: boolean;
};

const Destinations: React.FC<Props> = ({ destinations, isLargeScreen }) => {
  const [currentDestination, setCurrentDestination] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDestination((prev) => (prev + 1) % destinations.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [destinations.length]);

  const getVisibleDestinations = () => {
    const prev = (currentDestination - 1 + destinations.length) % destinations.length;
    const next = (currentDestination + 1) % destinations.length;
    return [prev, currentDestination, next];
  };

  return (
    <section id="destinations" className="py-20 lg:py-28 bg-gradient-to-b from-green-200 via-green-100 to-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 lg:transition-transform lg:duration-200 lg:ease-out"
        style={{
          transform: isLargeScreen ? `translateY(${0}px)` : undefined,
          willChange: isLargeScreen ? "transform" : undefined,
        }}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Popular Destinations</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Explore the most beautiful places in Kerala</p>
        </div>

        <div className="relative h-[380px] flex items-center justify-center gap-4 px-4 overflow-hidden">
          {getVisibleDestinations().map((destIndex, idx) => {
            const destination = destinations[destIndex];
            const isCenter = idx === 1;

            return (
              <div
                key={destIndex}
                className={`absolute transition-none lg:transition-all lg:duration-700 lg:ease-in-out ${
                  isCenter
                    ? "z-20 scale-100 opacity-100"
                    : "z-10 scale-75 opacity-50 blur-md"
                }`}
                style={{
                  transform: isLargeScreen ? `translateX(${(idx - 1) * (isCenter ? 0 : idx === 0 ? -80 : 80)}%) ${
                    isCenter ? "scale(1)" : "scale(0.75)"
                  }` : undefined,
                  width: isCenter ? "600px" : "400px",
                  maxWidth: isCenter ? "90vw" : "60vw",
                }}
              >
                <div className="group cursor-pointer">
                  <div
                    className={`relative overflow-hidden rounded-3xl shadow-xl group-hover:shadow-2xl transition-none lg:transition-all lg:duration-300 ${
                      isCenter ? "h-[350px]" : "h-[280px]"
                    }`}
                  >
                    <img src={destination.image} alt={destination.name} className="w-full h-full object-cover group-hover:scale-110 transition-none lg:transition-transform lg:duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className={`text-white font-bold tracking-tight ${isCenter ? "text-3xl" : "text-xl"}`}>{destination.name}</h3>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-12 space-x-3">
          {destinations.map((_, index) => (
            <button
              key={index}
              className={`transition-none lg:transition-all lg:duration-300 rounded-full ${
                index === currentDestination
                  ? "bg-green-600 w-8 h-3"
                  : "bg-gray-300 hover:bg-gray-400 w-3 h-3"
              }`}
              onClick={() => setCurrentDestination(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Destinations;
