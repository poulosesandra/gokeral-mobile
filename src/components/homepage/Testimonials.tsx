import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";

type Testimonial = {
  name: string;
  location: string;
  rating: number;
  text: string;
};

type Props = {
  testimonials: Testimonial[];
};

const Testimonials: React.FC<Props> = ({ testimonials }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">What Our Customers Say</h2>
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
                className={`w-3 h-3 rounded-full transition-none lg:transition-all lg:duration-300 ${index === currentSlide ? "bg-green-600 w-8" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
