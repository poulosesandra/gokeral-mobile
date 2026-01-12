import React from "react";

type Vehicle = {
  name: string;
  icon: React.ElementType;
  count: string;
};

type Props = {
  vehicles: Vehicle[];
  scrollY: number;
  isLargeScreen: boolean;
};

const Vehicles: React.FC<Props> = ({ vehicles, scrollY, isLargeScreen }) => {
  return (
    <section id="vehicles" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-20 lg:transition-transform lg:duration-100 lg:ease-out"
        style={{
          transform: isLargeScreen ? `translate(${scrollY * 0.05}px, ${scrollY * 0.05}px)` : undefined,
          willChange: isLargeScreen ? "transform" : undefined,
        }}
      ></div>
      <div
        className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20 lg:transition-transform lg:duration-100 lg:ease-out"
        style={{
          transform: isLargeScreen ? `translate(${-scrollY * 0.05}px, ${-scrollY * 0.05}px)` : undefined,
          willChange: isLargeScreen ? "transform" : undefined,
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="text-center mb-16 lg:mb-20"
          style={{
            transform: isLargeScreen ? `translateY(${Math.max(0, (scrollY - 200) * 0.1)}px)` : undefined,
            opacity: isLargeScreen ? Math.min(1, Math.max(0, 1 - (scrollY - 200) * 0.001)) : 1,
          }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Choose Your Vehicle</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">We have the perfect vehicle for every journey in Kerala</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {vehicles.map((vehicle, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-lg hover:shadow-2xl transition-none lg:transition-all lg:duration-300 transform lg:hover:scale-105 lg:hover:-translate-y-2 border border-gray-100 group"
              style={{
                transform: isLargeScreen ? `translateY(${Math.max(0, (scrollY - 300) * 0.08)}px)` : undefined,
                opacity: isLargeScreen ? Math.min(1, Math.max(0, (scrollY - 200) / 400)) : 1,
              }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-6 lg:group-hover:from-green-600 lg:group-hover:to-green-500 transition-none lg:transition-all lg:duration-300">
                <vehicle.icon className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 group-hover:text-white transition-none lg:transition-colors lg:duration-300" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{vehicle.name}</h3>
              <p className="text-green-600 font-semibold mb-4">{vehicle.count} Available</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Vehicles;
