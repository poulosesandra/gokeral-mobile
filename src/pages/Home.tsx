import { useState, useEffect, useRef } from "react";
import { Car, Truck, MapPin, Star, Users, Ambulance, CheckCircle } from "lucide-react";
import { Hero, Vehicles, Features, Destinations, Testimonials, CTA } from "../components/homepage";
import Header from "../components/homepage/Header";
import Footer from "../components/homepage/Footer";
// Using raw Cloudinary URLs for images; no helper is required


// Stack images (Cloudinary public IDs)
const stackImageIds = [
  "https://res.cloudinary.com/duv9ijtrw/image/upload/f_auto,q_auto,w_800/v1768387405/stack6_dynxea.webp",
  "https://res.cloudinary.com/duv9ijtrw/image/upload/f_auto,q_auto,w_800/v1768387403/stack3_ornps8.webp",
  "https://res.cloudinary.com/duv9ijtrw/image/upload/f_auto,q_auto,w_800/v1768387403/stack2_sbvbbn.webp",
  "https://res.cloudinary.com/duv9ijtrw/image/upload/f_auto,q_auto,w_800/v1768387403/stack1_phaqa5.webp",
  "https://res.cloudinary.com/duv9ijtrw/image/upload/f_auto,q_auto,w_800/v1768387404/stack4_lvm5od.webp",
  "https://res.cloudinary.com/duv9ijtrw/image/upload/f_auto,q_auto,w_800/v1768387646/Alappuha_tbnqfa.webp",
];




const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Responsive flag: enable parallax/transform effects only on large screens (>= lg / 1024px)
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);



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

  // Stack images: use the provided raw URLs directly
  const stackImages = stackImageIds;

  const destinations = [
    { name: "Munnar", image: "https://res.cloudinary.com/duv9ijtrw/image/upload/v1768387648/munnar_ffd7cn.jpg" },
    { name: "Alleppey", image: "https://res.cloudinary.com/duv9ijtrw/image/upload/v1768387646/Alappuha_tbnqfa.webp" },
    { name: "Palakkad", image: "https://res.cloudinary.com/duv9ijtrw/image/upload/v1768387648/palakkad_wbppvc.jpg" },
    { name: "Wayanad", image: "https://res.cloudinary.com/duv9ijtrw/image/upload/v1768387405/stack6_dynxea.webp" },
    { name: "Kochi", image: "https://res.cloudinary.com/duv9ijtrw/image/upload/v1768387647/kochi_uqt75l.jpg" },
    { name: "Thekkady", image: "https://res.cloudinary.com/duv9ijtrw/image/upload/v1768387649/thekkady_klv9hd.jpg" }
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


  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Hero Section with Enhanced Parallax */}
      <Hero stackImages={stackImages} scrollY={scrollY} isLargeScreen={isLargeScreen} />

      {/* Vehicle Types with Smooth Parallax */}
      <Vehicles vehicles={vehicles} scrollY={scrollY} isLargeScreen={isLargeScreen} />

      {/* Features with Layered Parallax */}
      <Features features={features} />

      {/* Popular Destinations */}
      <Destinations destinations={destinations} isLargeScreen={isLargeScreen} />

      {/* Testimonials */}
      <Testimonials testimonials={testimonials} />

      {/* CTA Section */}
      <CTA scrollY={scrollY} isLargeScreen={isLargeScreen} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;