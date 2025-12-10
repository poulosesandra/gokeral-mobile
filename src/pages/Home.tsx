import { useState, useEffect, useRef } from "react";
import { Car, Truck, MapPin, Star, Users, ArrowRight, Phone, Mail, Ambulance, Facebook, Instagram, Twitter, CheckCircle } from "lucide-react";
import PhotoStack from "../components/homepage/photostack";
import stack1 from "../assets/photostack/stack1.jpg";
import stack2 from "../assets/photostack/stack2.jpg";
import stack3 from "../assets/photostack/stack3.jpg";
import stack4 from "../assets/photostack/stack4.jpg";
import stack5 from "../assets/photostack/stack5.jpg";
import stack6 from "../assets/photostack/stack6.jpg";

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);

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
    { name: "Munnar", image: "https://plus.unsplash.com/premium_photo-1697730314165-2cd71dc3a6a4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { name: "Alleppey", image: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { name: "Palakkad", image: "https://images.unsplash.com/photo-1730458555257-887039de379e?q=80&w=1034&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { name: "Wayanad", image: "https://images.unsplash.com/photo-1572408992122-a530c9a09dbb?q=80&w=839&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { name: "Kochi", image: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1170&auto=format&fit=crop" },
    { name: "Thekkady", image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1170&auto=format&fit=crop" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              {!isMenuOpen && (
                <>
                  <Car className="h-8 w-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">Kerides</span>
                </>
              )}
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/driver/register" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Drivers</a>
              <a href="/contact" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Contact</a>
              <a href="/about" className="text-gray-700 hover:text-green-600 transition-colors font-medium">About</a>
            </nav>
            <div className="hidden md:flex space-x-4 items-center">
              <a href="/user/login">
                <button className="text-green-600 hover:text-green-700 font-semibold transition-colors">Login</button>
              </a>
              <a href="/user/register">
                <button className="bg-green-600 text-white px-6 py-2.5 rounded-full hover:bg-green-700 transition-all transform hover:scale-105 font-semibold shadow-md">
                  Sign Up
                </button>
              </a>
            </div>
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1.5">
                <div className="w-full h-0.5 bg-gray-700 rounded-full transition-all"></div>
                <div className="w-full h-0.5 bg-gray-700 rounded-full transition-all"></div>
                <div className="w-full h-0.5 bg-gray-700 rounded-full transition-all"></div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Enhanced Parallax */}
      <section id="home" ref={heroRef} className="relative pt-24 pb-20 bg-gradient-to-br from-green-50 via-blue-50 to-white overflow-hidden">
        {/* Multi-Layer Parallax Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
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
          }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-yellow-200 rounded-full blur-3xl opacity-15"
          style={{
            transform: `translate(${scrollY * 0.1}px, ${scrollY * -0.15}px) scale(${1 + scrollY * 0.0002})`,
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
                  <button className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
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
              className="flex justify-center lg:justify-end transition-transform duration-100"
              style={{
                transform: `translateX(${scrollY * 0.2}px) translateY(${scrollY * -0.15}px) rotateY(${scrollY * 0.05}deg)`,
                transformStyle: 'preserve-3d',
                perspective: '1000px',
              }}
            >
              <PhotoStack images={stackImages} className="w-full max-w-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Types with Stagger Animation */}
      <section id="vehicles" ref={vehiclesRef} className="py-20 lg:py-28 bg-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div
          className="absolute top-0 left-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-20"
          style={{
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.05}px)`,
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"
          style={{
            transform: `translate(${-scrollY * 0.05}px, ${-scrollY * 0.05}px)`,
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Choose Your Vehicle</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">We have the perfect vehicle for every journey in Kerala</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {vehicles.map((vehicle, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border border-gray-100 group"
                style={{
                  transform: `translateY(${Math.max(0, (scrollY - 400) * 0.05 * (index + 1))}px)`,
                  opacity: Math.min(1, (scrollY - 200) / 300),
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
          }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-60 h-60 bg-white/30 rounded-full blur-2xl"
          style={{
            transform: `translate(${-scrollY * 0.06}px, ${-scrollY * 0.06}px) scale(${1 + scrollY * 0.0001})`,
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

          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {destinations.map((destination, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 snap-center"
                style={{
                  transform: `translateY(${Math.sin((scrollY + index * 100) * 0.005) * 10}px)`,
                }}
              >
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-3xl h-96 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-white text-2xl font-bold tracking-tight">{destination.name}</h3>
                    </div>
                  </div>
                </div>
              </div>
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
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${-scrollY * 0.02}px, ${-scrollY * 0.02}px)`,
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
      <footer id="contact" className="bg-gray-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Car className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold tracking-tight">Kerides</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">Your trusted partner for vehicle booking across Kerala. Safe, reliable, and affordable transportation solutions.</p>
              <div className="flex space-x-4">
                <Facebook className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Instagram className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Twitter className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Our Services</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6">Services</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Car Rental</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Bus Booking</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Auto Rickshaw</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Bike Rental</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-400">+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-400">info@kerides.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-400">Kochi, Kerala, India</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 Kerides. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Sidebar */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Sidebar */}
          <nav
            className="fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl flex flex-col p-0 overflow-hidden transition-transform duration-300"
            style={{ transform: isMenuOpen ? "translateX(0)" : "translateX(100%)" }}
          >
            {/* Green accent bar and logo */}
            <div className="flex items-center gap-3 px-6 py-6 bg-gradient-to-r from-green-600 to-green-500">
              <Car className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white tracking-tight">Kerides</span>
              <button
                className="ml-auto text-white text-3xl font-light hover:text-green-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                &times;
              </button>
            </div>
            {/* Menu links */}
            <div className="flex flex-col gap-2 px-6 py-8 flex-1">
              <a
                href="/driver/register"
                className="flex items-center gap-3 text-lg font-semibold text-gray-800 rounded-xl px-4 py-3.5 hover:bg-green-50 hover:text-green-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Car className="h-5 w-5 text-green-500" /> Drivers
              </a>
              <a
                href="/contact"
                className="flex items-center gap-3 text-lg font-semibold text-gray-800 rounded-xl px-4 py-3.5 hover:bg-green-50 hover:text-green-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Phone className="h-5 w-5 text-green-500" /> Contact
              </a>
              <a
                href="/about"
                className="flex items-center gap-3 text-lg font-semibold text-gray-800 rounded-xl px-4 py-3.5 hover:bg-green-50 hover:text-green-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-5 w-5 text-green-500" /> About
              </a>
              <div className="border-t border-gray-200 my-4"></div>
              <a
                href="/user/login"
                className="flex items-center gap-3 text-lg font-semibold text-green-600 rounded-xl px-4 py-3.5 hover:bg-green-100 hover:text-green-700 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <ArrowRight className="h-5 w-5 text-green-500" /> Login
              </a>
              <a href="/user/register" onClick={() => setIsMenuOpen(false)}>
                <button
                  className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-500 text-white text-lg font-bold px-6 py-4 rounded-full shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-600 transition-all transform hover:scale-105"
                >
                  Sign Up
                </button>
              </a>
            </div>
          </nav>
        </>
      )}
    </div>
  );
};

export default HomePage;
