import  { useState } from "react";
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Send,
    MessageCircle,
    Globe,
} from "lucide-react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        travelType: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e:any) => {
        e.preventDefault();
        setIsSubmitting(true);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        alert(
            "Thank you for contacting us! We'll get back to you within 24 hours.",
        );
        setFormData({
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
            travelType: "",
        });
        setIsSubmitting(false);
    };

    const handleChange = (e:any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <div className="relative z-10 container mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                        Ready to embark on your next adventure? We're here to
                        help you create unforgettable memories.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">
                                Contact Information
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-green-100 rounded-lg shadow-md">
                                        <MapPin className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-semibold text-lg">
                                            Address
                                        </h3>
                                        <p className="text-gray-600">
                                            123 Adventure Boulevard
                                            <br />
                                            Wanderlust City, WL 12345
                                            <br />
                                            United States
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-green-100 rounded-lg shadow-md">
                                        <Phone className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-semibold text-lg">
                                            Phone
                                        </h3>
                                        <p className="text-gray-600">
                                            +1 (555) 123-4567
                                            <br />
                                            +1 (555) 987-6543
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-green-100 rounded-lg shadow-md">
                                        <Mail className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-semibold text-lg">
                                            Email
                                        </h3>
                                        <p className="text-gray-600">
                                            info@wanderlustadventures.com
                                            <br />
                                            support@wanderlustadventures.com
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-green-100 rounded-lg shadow-md">
                                        <Clock className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-semibold text-lg">
                                            Business Hours
                                        </h3>
                                        <p className="text-gray-600">
                                            Mon - Fri: 9 AM - 8 PM
                                            <br />
                                            Sat - Sun: 10 AM - 6 PM
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Quick Connect
                            </h3>
                            <div className="flex space-x-4">
                                <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Live Chat</span>
                                </button>
                                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all duration-300 shadow">
                                    <Globe className="w-4 h-4" />
                                    <span>Virtual Tour</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                        <h2 className="text-3xl font-bold text-gray-900 mb-8">
                            Send us a Message
                        </h2>
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Travel Type
                                    </label>
                                    <select
                                        name="travelType"
                                        value={formData.travelType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="">
                                            Select travel type
                                        </option>
                                        <option value="adventure">
                                            Adventure Travel
                                        </option>
                                        <option value="luxury">
                                            Luxury Travel
                                        </option>
                                        <option value="family">
                                            Family Vacation
                                        </option>
                                        <option value="business">
                                            Business Travel
                                        </option>
                                        <option value="honeymoon">
                                            Honeymoon
                                        </option>
                                        <option value="group">
                                            Group Travel
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Message subject"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Your message..."
                                />
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center space-x-2 bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md disabled:opacity-50 transform hover:scale-105"
                            >
                                <Send className="w-5 h-5" />
                                <span>
                                    {isSubmitting
                                        ? "Sending..."
                                        : "Send Message"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
