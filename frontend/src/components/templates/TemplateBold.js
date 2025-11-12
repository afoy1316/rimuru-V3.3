import React from 'react';
import { Button } from '../ui/button';

const TemplateBold = ({ page, handleWhatsAppClick, formatPrice }) => {
  const primaryColor = page.primary_color || '#1E40AF';
  const accentColor = page.accent_color || '#F59E0B';

  return (
    <div className="min-h-screen bg-gray-900 text-white" style={{ fontFamily: page.font_body }}>
      {/* Hero Section - Bold & Dramatic */}
      <section 
        className="relative min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #000000 100%)`
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8">
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-none"
            style={{ 
              fontFamily: page.font_heading,
              textShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            {page.product_name}
          </h1>
          
          <p className="text-xl md:text-3xl font-bold max-w-3xl mx-auto" style={{ color: accentColor }}>
            {page.product_description}
          </p>

          {page.product_price && page.pricing_mode === "single" && (
            <div className="py-8">
              <div className="text-6xl md:text-8xl font-black" style={{ color: accentColor }}>
                {formatPrice(page.product_price, page.currency)}
              </div>
            </div>
          )}

          {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
            <Button
              onClick={handleWhatsAppClick}
              className="px-12 py-8 text-2xl font-black uppercase transform hover:scale-110 transition-all duration-300 shadow-2xl"
              style={{ 
                backgroundColor: accentColor,
                color: '#000'
              }}
            >
              GET IT NOW →
            </Button>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Benefits Section - High Contrast */}
      {page.benefits?.length > 0 && page.benefits[0] !== "" && (
        <section className="bg-black py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 
              className="text-5xl md:text-6xl font-black uppercase mb-16 text-center"
              style={{ fontFamily: page.font_heading, color: accentColor }}
            >
              POWER FEATURES
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {page.benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="p-8 border-4 transform hover:scale-105 transition-transform"
                  style={{ borderColor: primaryColor }}
                >
                  <div className="text-6xl font-black mb-4" style={{ color: accentColor }}>
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  <p className="text-xl font-bold">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Packages - Bold Design */}
      {page.pricing_mode === "multiple" && page.pricing_packages?.length > 0 && (
        <section 
          className="py-24"
          style={{ background: `linear-gradient(180deg, #000 0%, ${primaryColor} 100%)` }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <h2 
              className="text-5xl md:text-6xl font-black uppercase mb-16 text-center"
              style={{ fontFamily: page.font_heading }}
            >
              CHOOSE YOUR PLAN
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {page.pricing_packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`p-8 border-4 transform transition-all ${
                    pkg.is_highlighted 
                      ? 'scale-110 z-10' 
                      : 'hover:scale-105'
                  }`}
                  style={{ 
                    borderColor: pkg.is_highlighted ? accentColor : primaryColor,
                    backgroundColor: pkg.is_highlighted ? primaryColor : '#000'
                  }}
                >
                  {pkg.badge && (
                    <div 
                      className="inline-block px-4 py-2 mb-4 font-black text-sm"
                      style={{ backgroundColor: accentColor, color: '#000' }}
                    >
                      {pkg.badge}
                    </div>
                  )}

                  <h3 className="text-3xl font-black uppercase mb-4">{pkg.name}</h3>
                  
                  <div className="mb-6">
                    <div className="text-5xl font-black" style={{ color: accentColor }}>
                      {formatPrice(pkg.price, page.currency)}
                    </div>
                    {pkg.original_price > pkg.price && (
                      <div className="text-xl line-through opacity-50">
                        {formatPrice(pkg.original_price, page.currency)}
                      </div>
                    )}
                  </div>

                  {pkg.features?.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 font-bold">
                          <span style={{ color: accentColor }}>▶</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
                    <button
                      onClick={handleWhatsAppClick}
                      className="w-full py-4 text-xl font-black uppercase border-4 transform hover:scale-105 transition-all"
                      style={{ 
                        borderColor: accentColor,
                        backgroundColor: pkg.is_highlighted ? accentColor : 'transparent',
                        color: pkg.is_highlighted ? '#000' : accentColor
                      }}
                    >
                      {pkg.cta_text || "CLAIM NOW"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials - Dramatic */}
      {page.testimonials?.length > 0 && page.testimonials[0]?.name && (
        <section className="bg-black py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 
              className="text-5xl md:text-6xl font-black uppercase mb-16 text-center"
              style={{ fontFamily: page.font_heading, color: accentColor }}
            >
              SUCCESS STORIES
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {page.testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="p-8 border-4"
                  style={{ borderColor: primaryColor }}
                >
                  <div className="text-6xl font-black mb-4" style={{ color: accentColor }}>"</div>
                  <p className="text-xl mb-6 font-bold">{testimonial.quote}</p>
                  <p className="text-2xl font-black uppercase" style={{ color: accentColor }}>
                    — {testimonial.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA - Explosive */}
      {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
        <section 
          className="py-32 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #000 100%)` }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 animate-pulse" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, ${accentColor} 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, ${primaryColor} 0%, transparent 50%)`
            }}></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
            <h2 
              className="text-6xl md:text-7xl font-black uppercase"
              style={{ fontFamily: page.font_heading }}
            >
              DON'T WAIT
            </h2>
            <p className="text-3xl font-bold" style={{ color: accentColor }}>
              Take Action Now!
            </p>
            <Button
              onClick={handleWhatsAppClick}
              className="px-16 py-10 text-3xl font-black uppercase transform hover:scale-110 transition-all duration-300 shadow-2xl animate-pulse"
              style={{ 
                backgroundColor: accentColor,
                color: '#000'
              }}
            >
              CONTACT US NOW
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-black py-8 border-t-4" style={{ borderColor: primaryColor }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 font-bold">
            © 2025 {page.product_name}. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TemplateBold;
