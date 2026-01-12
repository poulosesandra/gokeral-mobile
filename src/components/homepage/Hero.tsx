import React from "react";
import { ArrowRight } from "lucide-react";
import PhotoStack from "./photostack";

type Props = {
  stackImages: string[];
  scrollY: number;
  isLargeScreen: boolean;
};

const Hero: React.FC<Props> = ({ stackImages, scrollY, isLargeScreen }) => {
  return (
    <section id="home" className="relative pt-24 pb-20 bg-gradient-to-br from-green-50 via-blue-50 to-white overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 lg:transition-transform lg:duration-100 lg:ease-out"
        style={{
          transform: isLargeScreen ? `translateY(${scrollY * 0.5}px)` : undefined,
          willChange: isLargeScreen ? "transform" : undefined,
        }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
      </div>

      <div
        className="absolute top-1/4 right-1/4 w-40 h-40 bg-purple-200 rounded-full blur-2xl opacity-20 lg:transition-transform lg:duration-150 lg:ease-out"
        style={{
          transform: isLargeScreen ? `translate(${scrollY * -0.15}px, ${scrollY * 0.2}px) rotate(${scrollY * 0.1}deg)` : undefined,
          willChange: isLargeScreen ? "transform" : undefined,
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <div
              style={{
                transform: isLargeScreen ? `translateY(${scrollY * 0.15}px)` : undefined,
                opacity: isLargeScreen ? Math.max(0, 1 - scrollY * 0.002) : 1,
              }}
            >
              <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
                ✨ Premium Travel Experience
              </span>
            </div>

            <div
              className="space-y-6"
              style={{
                transform: isLargeScreen ? `translateY(${scrollY * 0.12}px)` : undefined,
                opacity: isLargeScreen ? Math.max(0, 1 - scrollY * 0.0015) : 1,
              }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                <span
                  className="block"
                  style={{
                    transform: isLargeScreen ? `translateX(${scrollY * -0.05}px)` : undefined,
                  }}
                >
                  Discover Kerala
                </span>
                <span
                  className="text-green-600 block mt-2"
                  style={{
                    transform: isLargeScreen ? `translateX(${scrollY * 0.08}px)` : undefined,
                  }}
                >
                  in Comfort
                </span>
              </h1>
            </div>

            <div
              style={{
                transform: isLargeScreen ? `translateY(${scrollY * 0.1}px)` : undefined,
                opacity: isLargeScreen ? Math.max(0, 1 - scrollY * 0.0012) : 1,
              }}
            >
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
                Book any vehicle across Kerala - from luxury cars to auto rickshaws.
                Explore God's Own Country with verified drivers and transparent pricing.
              </p>
            </div>

            <div
              className="flex flex-row gap-4 flex-wrap"
              style={{
                transform: isLargeScreen ? `translateY(${scrollY * 0.08}px)` : undefined,
                opacity: isLargeScreen ? Math.max(0, 1 - scrollY * 0.001) : 1,
              }}
            >
              <a href="/user/login" className="flex-1 min-w-0">
                <button className="w-full flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-full text-base md:text-lg font-semibold transition-none lg:transition-all lg:duration-150">
                  Book Now <ArrowRight className="inline ml-2 h-5 w-5" />
                </button>
              </a>
              <div className="flex-1 min-w-0">
                <button className="w-full flex items-center justify-center border-2 border-green-600 text-green-600 px-6 py-3 rounded-full text-base md:text-lg font-semibold hover:bg-green-50 transition-none lg:transition-all lg:duration-150">
                  Learn More
                </button>
              </div>
            </div>

            <div
              className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200"
              style={{
                transform: isLargeScreen ? `translateY(${scrollY * 0.06}px)` : undefined,
                opacity: isLargeScreen ? Math.max(0, 1 - scrollY * 0.0008) : 1,
              }}
            >
              <div
                className="text-center"
                style={{
                  transform: isLargeScreen ? `translateY(${Math.sin(scrollY * 0.01) * 5}px)` : undefined,
                }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">500+</div>
                <div className="text-sm text-gray-600 font-medium">Vehicles</div>
              </div>
              <div
                className="text-center"
                style={{
                  transform: isLargeScreen ? `translateY(${Math.sin(scrollY * 0.01 + 2) * 5}px)` : undefined,
                }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">10K+</div>
                <div className="text-sm text-gray-600 font-medium">Happy Customers</div>
              </div>
              <div
                className="text-center"
                style={{
                  transform: isLargeScreen ? `translateY(${Math.sin(scrollY * 0.01 + 4) * 5}px)` : undefined,
                }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">24/7</div>
                <div className="text-sm text-gray-600 font-medium">Support</div>
              </div>
            </div>
          </div>

          <div
            className="flex justify-center lg:justify-end lg:transition-transform lg:duration-150 lg:ease-out"
            style={{
              transform: isLargeScreen ? `translateX(${scrollY * 0.2}px) translateY(${scrollY * -0.15}px) rotateY(${scrollY * 0.05}deg)` : undefined,
              transformStyle: "preserve-3d",
              perspective: "1000px",
              willChange: isLargeScreen ? "transform" : undefined,
            }}
          >
            <PhotoStack images={stackImages} className="w-full max-w-md" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
