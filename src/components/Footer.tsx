import { Droplets, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1A202C] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-8 h-8 text-[#38B2AC]" />
              <h3 className="text-2xl font-bold">BlueGrid</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Smart water management system for efficient distribution, maintenance tracking, and community engagement.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="bg-[#006D77] hover:bg-[#38B2AC] p-2 rounded-full transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="bg-[#006D77] hover:bg-[#38B2AC] p-2 rounded-full transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="bg-[#006D77] hover:bg-[#38B2AC] p-2 rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="bg-[#006D77] hover:bg-[#38B2AC] p-2 rounded-full transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-[#006D77] pb-2">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[#83C5BE]">›</span> Home
                </a>
              </li>
              <li>
                <a href="/auth" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[#83C5BE]">›</span> Login / Sign Up
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[#83C5BE]">›</span> About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[#83C5BE]">›</span> Services
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[#83C5BE]">›</span> Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-[#006D77] pb-2">Our Services</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-300 flex items-center gap-2">
                <span className="text-[#83C5BE]">✓</span> Water Distribution Management
              </li>
              <li className="text-gray-300 flex items-center gap-2">
                <span className="text-[#83C5BE]">✓</span> Pipe Maintenance Tracking
              </li>
              <li className="text-gray-300 flex items-center gap-2">
                <span className="text-[#83C5BE]">✓</span> Real-time Notifications
              </li>
              <li className="text-gray-300 flex items-center gap-2">
                <span className="text-[#83C5BE]">✓</span> Community Reporting
              </li>
              <li className="text-gray-300 flex items-center gap-2">
                <span className="text-[#83C5BE]">✓</span> Analytics & Insights
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-[#006D77] pb-2">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-[#83C5BE] flex-shrink-0 mt-0.5" />
                <span>Panchayat Office, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-[#83C5BE] flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-[#83C5BE] flex-shrink-0" />
                <a href="mailto:info@bluegrid.in" className="hover:text-white transition-colors">
                  info@bluegrid.in
                </a>
              </li>
            </ul>
            <div className="pt-2">
              <p className="text-xs text-gray-400">
                <strong>Office Hours:</strong><br />
                Monday - Friday: 9:00 AM - 5:00 PM<br />
                Saturday: 9:00 AM - 1:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#006D77]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-gray-300 text-center md:text-left">
              © {currentYear} <span className="font-semibold text-white">BlueGrid</span>. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-gray-300">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span className="text-gray-600">|</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <span className="text-gray-600">|</span>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
            <div className="text-gray-400 text-xs text-center md:text-right">
              Made with 💙 for better water management
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
