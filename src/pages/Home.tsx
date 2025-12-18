import { useState, useEffect, useRef } from "react";
import { Car, Truck, MapPin, Star, Users, ArrowRight, Ambulance, CheckCircle } from "lucide-react";
import PhotoStack from "../components/homepage/photostack";
import Header from "../components/Header";
import Footer from "../components/Footer";
import stack1 from "../assets/photostack/stack1.webp";
import stack2 from "../assets/photostack/stack2.webp"
import stack3 from "../assets/photostack/stack3.webp";
import stack4 from "../assets/photostack/stack4.webp";
import stack5 from "../assets/photostack/stack5.webp";
import stack6 from "../assets/photostack/stack6.webp";
import kochi from "../assets/destinations/kochi.jpg";
import munnar from "../assets/destinations/munnar.jpg";

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [currentDestination, setCurrentDestination] = useState(0);
  const scrollRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const vehiclesRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const vehicles = [
    { name: "Luxury Cars", icon: Car, count: "100+" },
    { name: "Buses", icon: Truck, count: "30+" },
    { name: "Auto Rickshaw", icon: Car, count: "100+" },
    { name: "Ambulance", icon: Ambulance, count: "20+" }
  ];

  const features = [
    { icon: CheckCircle, title: "24/7 Support", desc: "Round the clock customer service" },
    { icon: MapPin, title: "All Kerala", desc: "Coverage across entire Kerala state" },
    { icon: Star, title: "Top Rated", desc: "4.8+ rating from 10,000+ customers" },
    { icon: Users, title: "Verified Drivers", desc: "All drivers are background verified" }
  ];

  const testimonials = [
    { name: "Arjun Menon", location: "Kochi", rating: 5, text: "Excellent service! Booked a car for Munnar trip. Driver was professional and vehicle was clean." },
    { name: "Priya Nair", location: "Thiruvananthapuram", rating: 5, text: "Best vehicle booking platform in Kerala. Used for my wedding functions. Highly recommended!" },
    { name: "Rahul Krishnan", location: "Kozhikode", rating: 5, text: "Quick booking, fair prices, and reliable service. Will definitely use again for my business trips." }
  ];

  const stackImages = [
    stack1,
    stack2,
    stack3,
    stack4,
    stack5,
    stack6,
  ];

  const destinations = [
    { name: "Munnar", image: munnar },
    { name: "Alleppey", image: "https://images.unsplash.com/photo-1598948485421-33a1655d3c18?q=80&w=2070&auto=format&fit=crop" },
    { name: "Palakkad", image: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?q=80&w=2068&auto=format&fit=crop" },
    { name: "Wayanad", image: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?q=80&w=2062&auto=format&fit=crop" },
    { name: "Kochi", image: kochi },
    { name: "Thekkady", image: "https://images.unsplash.com/photo-1587476544789-76a9a14c28b8?q=80&w=2070&auto=format&fit=crop" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
      
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          setScrollY(scrollRef.current);
          animationFrameRef.current = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDestination((prev) => (prev + 1) % destinations.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const getVisibleDestinations = () => {
    const prev = (currentDestination - 1 + destinations.length) % destinations.length;
    const next = (currentDestination + 1) % destinations.length;
    return [prev, currentDestination, next];
  };

  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Hero Section with Enhanced Parallax */}
      <section id="home" ref={heroRef} className="relative pt-24 pb-20 bg-gradient-to-br from-green-50 via-blue-50 to-white overflow-hidden">
        {/* Multi-Layer Parallax Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
          }}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>

        {/* Additional Floating Elements */}
        <div
          className="absolute top-1/4 right-1/4 w-40 h-40 bg-purple-200 rounded-full blur-2xl opacity-20"
          style={{
            transform: `translate(${scrollY * -0.15}px, ${scrollY * 0.2}px) rotate(${scrollY * 0.1}deg)`,
            willChange: 'transform',
            transition: 'transform 0.15s ease-out',
          }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-yellow-200 rounded-full blur-3xl opacity-15"
          style={{
            transform: `translate(${scrollY * 0.1}px, ${scrollY * -0.15}px) scale(${1 + scrollY * 0.0002})`,
            willChange: 'transform',
            transition: 'transform 0.15s ease-out',
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              {/* Badge with subtle animation */}
              <div
                style={{
                  transform: `translateY(${scrollY * 0.15}px)`,
                  opacity: Math.max(0, 1 - scrollY * 0.002),
                }}
              >
                <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
                  ✨ Premium Travel Experience
                </span>
              </div>

              {/* Main heading with layered parallax */}
              <div
                className="space-y-6"
                style={{
                  transform: `translateY(${scrollY * 0.12}px)`,
                  opacity: Math.max(0, 1 - scrollY * 0.0015),
                }}
              >
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                  <span
                    className="block"
                    style={{
                      transform: `translateX(${scrollY * -0.05}px)`,
                    }}
                  >
                    Discover Kerala
                  </span>
                  <span
                    className="text-green-600 block mt-2"
                    style={{
                      transform: `translateX(${scrollY * 0.08}px)`,
                    }}
                  >
                    in Comfort
                  </span>
                </h1>
              </div>

              {/* Description with fade */}
              <div
                style={{
                  transform: `translateY(${scrollY * 0.1}px)`,
                  opacity: Math.max(0, 1 - scrollY * 0.0012),
                }}
              >
                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                  Book any vehicle across Kerala - from luxury cars to auto rickshaws.
                  Explore God's Own Country with verified drivers and transparent pricing.
                </p>
              </div>

              {/* Buttons with stagger effect */}
              <div
                className="flex flex-col sm:flex-row gap-4"
                style={{
                  transform: `translateY(${scrollY * 0.08}px)`,
                  opacity: Math.max(0, 1 - scrollY * 0.001),
                }}
              >
                <a href="/driver/register">
                  <button className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105">
                    Join as a Driver <ArrowRight className="inline ml-2 h-5 w-5" />
                  </button>
                </a>
                <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 transition-all transform hover:scale-105">
                  Learn More
                </button>
              </div>

              {/* Stats with individual parallax */}
              <div
                className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200"
                style={{
                  transform: `translateY(${scrollY * 0.06}px)`,
                  opacity: Math.max(0, 1 - scrollY * 0.0008),
                }}
              >
                <div
                  className="text-center"
                  style={{
                    transform: `translateY(${Math.sin(scrollY * 0.01) * 5}px)`,
                  }}
                >
                  <div className="text-4xl font-bold text-gray-900 mb-1">500+</div>
                  <div className="text-sm text-gray-600 font-medium">Vehicles</div>
                </div>
                <div
                  className="text-center"
                  style={{
                    transform: `translateY(${Math.sin(scrollY * 0.01 + 2) * 5}px)`,
                  }}
                >
                  <div className="text-4xl font-bold text-gray-900 mb-1">10K+</div>
                  <div className="text-sm text-gray-600 font-medium">Happy Customers</div>
                </div>
                <div
                  className="text-center"
                  style={{
                    transform: `translateY(${Math.sin(scrollY * 0.01 + 4) * 5}px)`,
                  }}
                >
                  <div className="text-4xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-600 font-medium">Support</div>
                </div>
              </div>
            </div>

            {/* PhotoStack with 3D rotation effect */}
            <div
              className="flex justify-center lg:justify-end"
              style={{
                transform: `translateX(${scrollY * 0.2}px) translateY(${scrollY * -0.15}px) rotateY(${scrollY * 0.05}deg)`,
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                willChange: 'transform',
                transition: 'transform 0.15s ease-out',
              }}
            >
              <PhotoStack images={stackImages} className="w-full max-w-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Types with Smooth Parallax */}
      <section id="vehicles" ref={vehiclesRef} className="py-20 lg:py-28 bg-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div
          className="absolute top-0 left-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-20"
          style={{
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.05}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"
          style={{
            transform: `translate(${-scrollY * 0.05}px, ${-scrollY * 0.05}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div
            className="text-center mb-16 lg:mb-20"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - 200) * 0.1)}px)`,
              opacity: Math.min(1, Math.max(0, 1 - (scrollY - 200) * 0.001)),
            }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Choose Your Vehicle</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">We have the perfect vehicle for every journey in Kerala</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {vehicles.map((vehicle, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border border-gray-100 group"
                style={{
                  transform: `translateY(${Math.max(0, (scrollY - 300) * 0.08)}px)`,
                  opacity: Math.min(1, Math.max(0, (scrollY - 200) / 400)),
                }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-green-600 group-hover:to-green-500 transition-all duration-300">
                  <vehicle.icon className="h-10 w-10 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{vehicle.name}</h3>
                <p className="text-green-600 font-semibold mb-4">{vehicle.count} Available</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with Layered Parallax */}
      <section ref={featuresRef} className="py-20 lg:py-28 bg-gradient-to-b from-white via-green-100 to-green-200 relative overflow-hidden">
        {/* Floating Shapes */}
        <div
          className="absolute top-20 left-10 w-40 h-40 bg-white/30 rounded-full blur-2xl"
          style={{
            transform: `translate(${scrollY * 0.08}px, ${scrollY * 0.08}px) scale(${1 + scrollY * 0.0001})`,
            willChange: 'transform',
            transition: 'transform 0.15s ease-out',
          }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-60 h-60 bg-white/30 rounded-full blur-2xl"
          style={{
            transform: `translate(${-scrollY * 0.06}px, ${-scrollY * 0.06}px) scale(${1 + scrollY * 0.0001})`,
            willChange: 'transform',
            transition: 'transform 0.15s ease-out',
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Why Choose Kerides?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Experience the best vehicle booking service in Kerala</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center group"
                style={{
                  transform: `translateY(${Math.max(0, (scrollY - 1000) * 0.03 * (index + 1))}px)`,
                  opacity: Math.min(1, (scrollY - 800) / 400),
                }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section id="destinations" className="py-20 lg:py-28 bg-gradient-to-b from-green-200 via-green-100 to-white relative overflow-hidden">
        {/* Parallax Background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            willChange: 'transform',
            transition: 'transform 0.2s ease-out',
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

          {/* Carousel Container */}
          <div className="relative h-[380px] flex items-center justify-center gap-4 px-4 overflow-hidden">
            {getVisibleDestinations().map((destIndex, idx) => {
              const destination = destinations[destIndex];
              const isCenter = idx === 1;
              
              return (
                <div
                  key={destIndex}
                  className={`absolute transition-all duration-700 ease-in-out ${
                    isCenter 
                      ? 'z-20 scale-100 opacity-100' 
                      : 'z-10 scale-75 opacity-50 blur-md'
                  }`}
                  style={{
                    transform: `translateX(${(idx - 1) * (isCenter ? 0 : idx === 0 ? -80 : 80)}%) ${
                      isCenter ? 'scale(1)' : 'scale(0.75)'
                    }`,
                    width: isCenter ? '600px' : '400px',
                    maxWidth: isCenter ? '90vw' : '60vw',
                  }}
                >
                  <div className="group cursor-pointer">
                    <div className={`relative overflow-hidden rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-300 ${
                      isCenter ? 'h-[350px]' : 'h-[280px]'
                    }`}>
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className={`text-white font-bold tracking-tight ${
                          isCenter ? 'text-3xl' : 'text-xl'
                        }`}>
                          {destination.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-12 space-x-3">
            {destinations.map((_, index) => (
              <button
                key={index}
                className={`transition-all duration-300 rounded-full ${
                  index === currentDestination 
                    ? 'bg-green-600 w-8 h-3' 
                    : 'bg-gray-300 hover:bg-gray-400 w-3 h-3'
                }`}
                onClick={() => setCurrentDestination(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Read reviews from satisfied customers across Kerala</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-10 lg:p-12 shadow-xl border border-gray-100">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-xl text-gray-700 mb-8 italic leading-relaxed">"{testimonials[currentSlide].text}"</p>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{testimonials[currentSlide].name}</h4>
                  <p className="text-gray-500 mt-1">{testimonials[currentSlide].location}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-10 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-green-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
        {/* Animated Background Circles */}
        <div
          className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${scrollY * 0.02}px, ${scrollY * 0.02}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${-scrollY * 0.02}px, ${-scrollY * 0.02}px)`,
            willChange: 'transform',
            transition: 'transform 0.1s ease-out',
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">Ready to Start Your Journey?</h2>
          <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">Book your perfect vehicle today and explore Kerala in comfort</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/user/register">
              <button className="bg-white text-green-600 px-10 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl">
                Book Vehicle Now
              </button>
            </a>
            <button className="border-2 border-white text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-green-600 transition-all transform hover:scale-105">
              Download App
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;