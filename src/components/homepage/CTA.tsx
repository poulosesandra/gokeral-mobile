import React from "react";

type Props = {
  scrollY: number;
  isLargeScreen: boolean;
};

const CTA: React.FC<Props> = ({ scrollY, isLargeScreen }) => {
  return (
    <section className="py-20 lg:py-24 bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl lg:transition-transform lg:duration-100 lg:ease-out"
        style={{
          transform: isLargeScreen ? `translate(${scrollY * 0.02}px, ${scrollY * 0.02}px)` : undefined,
          willChange: isLargeScreen ? "transform" : undefined,
        }}
      ></div>
      <div
        className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl lg:transition-transform lg:duration-100 lg:ease-out"
        style={{
          transform: isLargeScreen ? `translate(${-scrollY * 0.02}px, ${-scrollY * 0.02}px)` : undefined,
          willChange: isLargeScreen ? "transform" : undefined,
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Ready to Start Your Journey?</h2>
        <p className="text-base sm:text-lg text-green-50 mb-10 max-w-2xl mx-auto">Book your perfect vehicle today and explore Kerala in comfort</p>
        <div className="flex flex-row gap-3 justify-center items-center">
          <a href="/user/register" className="flex-1">
            <button className="w-full bg-white text-green-600 px-6 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:bg-gray-50 transition-none lg:transition-all lg:duration-150 transform lg:hover:scale-105 shadow-xl">
              Book Now
            </button>
          </a>
          <div className="flex-1">
            <button className="w-full border-2 border-white text-white px-6 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:bg-white hover:text-green-600 transition-none lg:transition-all lg:duration-150 transform lg:hover:scale-105">
              Download App
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
