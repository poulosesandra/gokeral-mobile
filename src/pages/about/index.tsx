import { useState } from 'react';
import { Shield, FileText, Users, Globe, Car, MapPin, Heart, Eye, Lock, AlertCircle } from 'lucide-react';

export default function TermsPrivacyPage() {
  const [activeTab, setActiveTab] = useState('terms');

  const highlights = [
    { icon: Shield, number: '100%', label: 'Secure Bookings', color: 'from-green-500 to-green-700' },
    { icon: Car, number: '24/7', label: 'Support Available', color: 'from-green-600 to-green-800' },
    { icon: Users, number: '10K+', label: 'Happy Travelers', color: 'from-green-400 to-green-600' },
    { icon: Globe, number: '14', label: 'Districts Covered', color: 'from-green-500 to-green-700' }
  ];

  const privacyPrinciples = [
    {
      icon: Lock,
      title: 'Data Protection',
      description: 'We use advanced encryption and security measures to protect your personal information.',
      gradient: 'from-green-50 to-green-100'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Clear information about what data we collect and how we use it for your Kerala journey.',
      gradient: 'from-green-100 to-green-150'
    },
    {
      icon: Heart,
      title: 'User Control',
      description: 'You have full control over your data and can update or delete it at any time.',
      gradient: 'from-green-50 to-white'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              Kerala's Trusted Vehicle Booking Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              <span className="text-green-600">Kerides</span> Legal
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8">
              Your privacy and trust matter to us. Explore Kerala's heritage safely with clear terms and transparent policies.
            </p>
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-green-200 shadow-lg">
              <MapPin className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Proudly Serving God's Own Country • Kerala, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {highlights.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-lg">
              {['terms', 'privacy', 'booking'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  {tab === 'terms' ? 'Terms of Service' : tab === 'privacy' ? 'Privacy Policy' : 'Booking Terms'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-200 shadow-lg">
            {activeTab === 'terms' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <FileText className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h2>
                  <p className="text-gray-600">Last updated: July 1, 2025</p>
                </div>
                
                <div className="space-y-8 text-left max-w-4xl mx-auto">
                  <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Welcome to Kerides</h3>
                    <p className="text-gray-700 leading-relaxed">
                      By using Kerides vehicle booking platform, you agree to these terms. Our service connects you with verified drivers and vehicles across Kerala to explore the state's rich heritage and natural beauty.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">1. Service Description</h3>
                    <div className="pl-4 space-y-4">
                      <p className="text-gray-700 leading-relaxed">
                        • Kerides provides a digital platform connecting travelers with licensed vehicle operators across Kerala
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        • We facilitate bookings for tourism, heritage site visits, and local transportation
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        • All drivers are verified and vehicles are regularly inspected for safety compliance
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">2. User Responsibilities</h3>
                    <div className="pl-4 space-y-4">
                      <p className="text-gray-700 leading-relaxed">
                        • Provide accurate information during booking and maintain respectful behavior
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        • Follow Kerala tourism guidelines and respect local customs and heritage sites
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        • Report any issues immediately through our 24/7 support system
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">3. Payment & Cancellation</h3>
                    <div className="pl-4 space-y-4">
                      <p className="text-gray-700 leading-relaxed">
                        • Secure payment processing with multiple options including UPI, cards, and digital wallets
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        • Free cancellation up to 2 hours before scheduled pickup time
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        • Transparent pricing with no hidden charges for Kerala tourism bookings
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-amber-800 mb-2">Important Notice</h4>
                        <p className="text-amber-700 text-sm">
                          Kerides operates under Kerala State Transport Department regulations. All bookings are subject to local laws and tourism guidelines.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
                  <p className="text-gray-600">Your data protection is our priority</p>
                </div>

                <div className="space-y-8 max-w-4xl mx-auto">
                  {privacyPrinciples.map((principle, index) => (
                    <div key={index} className="flex items-start space-x-6 group">
                      <div className={`p-4 rounded-2xl bg-gradient-to-r ${principle.gradient} border border-green-200 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <principle.icon className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{principle.title}</h3>
                        <p className="text-gray-600 text-lg leading-relaxed">{principle.description}</p>
                      </div>
                    </div>
                  ))}

                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Data We Collect</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Personal Information</h4>
                        <ul className="space-y-2 text-gray-600 text-sm">
                          <li>• Name, phone number, and email address</li>
                          <li>• Location data for pickup and drop-off</li>
                          <li>• Payment information (securely encrypted)</li>
                          <li>• Trip history and preferences</li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Usage Data</h4>
                        <ul className="space-y-2 text-gray-600 text-sm">
                          <li>• App usage patterns and features used</li>
                          <li>• Device information and IP address</li>
                          <li>• GPS location for service optimization</li>
                          <li>• Customer feedback and ratings</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Data</h3>
                    <div className="space-y-3 text-gray-700">
                      <p>• <strong>Service Delivery:</strong> Connect you with drivers and manage your Kerala travel bookings</p>
                      <p>• <strong>Safety & Security:</strong> Verify identities and ensure secure transactions</p>
                      <p>• <strong>Personalization:</strong> Recommend heritage sites and tourism experiences based on your interests</p>
                      <p>• <strong>Communication:</strong> Send booking confirmations, updates, and Kerala tourism tips</p>
                      <p>• <strong>Legal Compliance:</strong> Meet regulatory requirements and resolve disputes</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <Car className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Booking Terms</h2>
                  <p className="text-gray-600">Special terms for Kerala tourism and heritage bookings</p>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-b from-green-50 to-white rounded-2xl p-6 border border-green-100 shadow-lg">
                      {/* <div className="text-4xl mb-4">🏛️</div> */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Heritage Site Visits</h3>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li>• Advance booking required for popular monuments</li>
                        <li>• Driver will assist with entry tickets and guides</li>
                        <li>• Flexible timing based on site operating hours</li>
                        <li>• Special rates for multi-day heritage tours</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-b from-green-50 to-white rounded-2xl p-6 border border-green-100 shadow-lg">
                      {/* <div className="text-4xl mb-4">🌴</div> */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Backwater Tours</h3>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li>• Weather-dependent scheduling with free rescheduling</li>
                        <li>• AC vehicles recommended for comfort</li>
                        <li>• Coordination with houseboat operators</li>
                        <li>• Seasonal pricing for peak tourist months</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-b from-green-50 to-white rounded-2xl p-6 border border-green-100 shadow-lg">
                      {/* <div className="text-4xl mb-4">⛰️</div> */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Hill Station Trips</h3>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li>• Experienced drivers familiar with mountain roads</li>
                        <li>• Vehicle suitability check for terrain</li>
                        <li>• Emergency contact sharing for safety</li>
                        <li>• Monsoon travel advisories provided</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-b from-green-50 to-white rounded-2xl p-6 border border-green-100 shadow-lg">
                      {/* <div className="text-4xl mb-4">🛶</div> */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Airport Transfers</h3>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li>• Flight tracking for delayed arrivals</li>
                        <li>• Meet and greet service available</li>
                        <li>• Fixed pricing regardless of traffic</li>
                        <li>• 24/7 availability from all major airports</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Kerala Tourism Partnership</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Kerides is an authorized partner of Kerala Tourism, committed to promoting responsible tourism and preserving the state's natural and cultural heritage. Our drivers are trained ambassadors who can share local knowledge and ensure authentic experiences.
                    </p>
                    <div className="flex items-center space-x-3 text-blue-700">
                      <Globe className="w-5 h-5" />
                      <span className="font-semibold">Certified by Kerala Tourism Development Corporation</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Questions About Our Policies?</h2>
          <p className="text-gray-600 text-lg mb-8">
            Our dedicated support team is here to help you understand our terms and address any privacy concerns.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <h3 className="font-bold text-gray-900 mb-2">Legal Support</h3>
              <p className="text-gray-600 text-sm mb-3">For terms and policy questions</p>
              <p className="text-green-600 font-semibold">legal@kerides.com</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <h3 className="font-bold text-gray-900 mb-2">Privacy Officer</h3>
              <p className="text-gray-600 text-sm mb-3">For data protection queries</p>
              <p className="text-green-600 font-semibold">privacy@kerides.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-green-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Explore Kerala?</h2>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              Book your vehicle with confidence. Experience God's Own Country with transparent policies and secure bookings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-green-600 font-bold py-4 px-8 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Book Your Ride
              </button>
              <button className="border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white hover:text-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}