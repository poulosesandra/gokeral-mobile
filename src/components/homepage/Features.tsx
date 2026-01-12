import React from "react";

type Feature = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

type Props = {
  features: Feature[];
};

const Features: React.FC<Props> = ({ features }) => {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white via-green-100 to-green-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Why Choose Kerides?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Experience the best vehicle booking service in Kerala</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl lg:group-hover:scale-110 transition-none lg:transition-all lg:duration-300">
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
