import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

const TemplateMinimalist = ({ page, handleWhatsAppClick, formatPrice, copyBlocks, getImageUrl, currentSlide, setCurrentSlide, timeLeft: initialTimeLeft }) => {
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft || { hours: 2, minutes: 0, seconds: 0 });

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Gallery Autoslide
  useEffect(() => {
    if (!page || !page.gallery_images || page.gallery_images.length <= 1 || !isAutoSliding) {
      return;
    }

    const autoSlide = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % page.gallery_images.length);
    }, 4000);

    return () => clearInterval(autoSlide);
  }, [page, isAutoSliding, setCurrentSlide]);

  const nextSlide = () => {
    if (page && page.gallery_images) {
      setCurrentSlide((prev) => (prev + 1) % page.gallery_images.length);
      setIsAutoSliding(false);
    }
  };

  const prevSlide = () => {
    if (page && page.gallery_images) {
      setCurrentSlide((prev) => (prev - 1 + page.gallery_images.length) % page.gallery_images.length);
      setIsAutoSliding(false);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoSliding(false);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: page.font_body }}>
      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      {/* SEO Meta Tags */}
      {page.seo_title && (
        <title>{page.seo_title}</title>
      )}

      {/* Hero Section - Clean & Simple */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-4 md:space-y-6 animate-fade-in-up">
            {/* Badge - AI Generated or Fallback */}
            {copyBlocks.subheadline && (
              <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 border border-gray-300 text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide break-words">
                {copyBlocks.subheadline}
              </div>
            )}
            
            <h1 
              className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight break-words"
              style={{ fontFamily: page.font_heading }}
            >
              {copyBlocks.hero_headline || page.product_name}
            </h1>
            
            <p className="text-base md:text-lg text-gray-700 leading-relaxed break-words">
              {copyBlocks.hero_description || page.product_description}
            </p>

            {page.product_price && page.pricing_mode === "single" && (
              <div className="py-4 md:py-6 border-t-2 border-b-2 border-gray-300">
                {page.product_original_price && page.product_original_price > page.product_price && (
                  <div className="mb-2 md:mb-3">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <span className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-400 line-through break-words">
                        {formatPrice(page.product_original_price, page.currency)}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-white bg-red-600 px-2 py-1 whitespace-nowrap">
                        HEMAT {Math.round(((page.product_original_price - page.product_price) / page.product_original_price) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 break-words">
                    {formatPrice(page.product_price, page.currency)}
                  </span>
                  <span className="text-gray-600 text-sm md:text-base lg:text-lg whitespace-nowrap">/ {page.currency}</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-2">Sudah termasuk pajak</p>
              </div>
            )}

            {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
              <div className="space-y-2 md:space-y-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full md:w-auto px-6 py-4 md:px-10 md:py-6 text-base md:text-lg font-bold bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 hover:shadow-xl"
                  style={{ borderRadius: 0 }}
                >
                  <span className="flex items-center justify-center gap-2 md:gap-3">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Pesan Sekarang</span>
                  </span>
                </Button>
                <p className="text-xs text-center md:text-left text-gray-600 break-words">
                  ✓ Pembayaran Aman • ✓ Pengiriman Cepat • ✓ Garansi Uang Kembali
                </p>
              </div>
            )}
          </div>

          {/* Right: Hero Image */}
          {page.hero_image && (
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full bg-gray-100 border-2 border-gray-300 overflow-hidden">
                <div style={{ paddingBottom: '100%' }}></div>
                <img
                  src={getImageUrl(page.hero_image)}
                  alt={page.product_name}
                  className="absolute inset-0 w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800"%3E%3Crect fill="%23f0f0f0" width="800" height="800"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="32"%3EGambar Produk%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Product Gallery Section - Manual Carousel */}
      {page.gallery_images && page.gallery_images.length > 0 && (
        <section className="py-16 bg-gray-50 border-t-2 border-b-2 border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center"
              style={{ fontFamily: page.font_heading }}
            >
              Galeri Produk
            </h2>
            
            <div className="relative bg-white border-2 border-gray-300 overflow-hidden">
              {/* Main Image */}
              <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                <img
                  src={getImageUrl(page.gallery_images[currentSlide])}
                  alt={`Galeri ${currentSlide + 1}`}
                  className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23f0f0f0" width="800" height="600"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24"%3EGambar Galeri ' + (currentSlide + 1) + '%3C/text%3E%3C/svg%3E';
                  }}
                />
                
                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-white border border-gray-300 text-sm font-bold text-gray-900">
                  {currentSlide + 1} / {page.gallery_images.length}
                </div>

                {/* Navigation Arrows */}
                {page.gallery_images.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all flex items-center justify-center"
                      aria-label="Gambar sebelumnya"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all flex items-center justify-center"
                      aria-label="Gambar selanjutnya"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {page.gallery_images.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-4 bg-gray-50 border-t-2 border-gray-200">
                  {page.gallery_images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`relative w-full border-2 overflow-hidden transition-all ${
                        currentSlide === index 
                          ? 'border-gray-900' 
                          : 'border-gray-300 hover:border-gray-600'
                      }`}
                      style={{ paddingBottom: '100%' }}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`Thumbnail ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3C/svg%3E';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Dots Indicator */}
              {page.gallery_images.length > 1 && (
                <div className="flex justify-center gap-2 py-4 bg-white">
                  {page.gallery_images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 transition-all ${
                        currentSlide === index 
                          ? 'bg-gray-900 w-8' 
                          : 'bg-gray-300 hover:bg-gray-600'
                      }`}
                      aria-label={`Ke slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Auto-slide Toggle */}
              {isAutoSliding && page.gallery_images.length > 1 && (
                <button
                  onClick={() => setIsAutoSliding(false)}
                  className="absolute top-4 right-4 px-3 py-1 bg-white border border-gray-300 text-xs font-bold text-gray-900 hover:bg-gray-100 transition-all"
                >
                  ⏸ Jeda
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section - Modern Minimalist Cards */}
      {(page.benefits || []).length > 0 && page.benefits[0] !== "" && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: page.font_heading }}
              >
                Mengapa Memilih Kami?
              </h2>
              <div className="w-20 h-1 bg-gray-900 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {page.benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="group relative bg-white border border-gray-200 p-8 transition-all duration-500 hover:border-gray-900 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Number Badge - Top Corner */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-bold text-xl border-4 border-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                    {index + 1}
                  </div>

                  {/* Icon Container */}
                  <div className="mb-6 relative">
                    <div className="w-16 h-16 border-2 border-gray-300 flex items-center justify-center transition-all duration-500 group-hover:border-gray-900 group-hover:scale-110">
                      <div className="w-8 h-8 bg-gray-900 transition-transform duration-500 group-hover:rotate-45"></div>
                    </div>
                    {/* Decorative line */}
                    <div className="absolute -bottom-3 left-0 w-12 h-0.5 bg-gray-300 transition-all duration-500 group-hover:w-full group-hover:bg-gray-900"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <p className="text-gray-900 font-semibold text-lg leading-relaxed">
                      {benefit}
                    </p>
                  </div>

                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gray-900 opacity-0 transition-opacity duration-500 group-hover:opacity-5 pointer-events-none"></div>
                </div>
              ))}
            </div>

            {/* Bottom Decorative Element */}
            <div className="flex justify-center gap-2 mt-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="w-2 h-2 bg-gray-900"></div>
              <div className="w-2 h-2 bg-gray-300"></div>
              <div className="w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Packages Section */}
      {page.pricing_mode === "multiple" && page.pricing_packages?.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50 border-t-2 border-b-2 border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: page.font_heading }}
              >
                Pilih Paket Anda
              </h2>
              <div className="w-20 h-1 bg-gray-900 mx-auto"></div>
            </div>
            
            <div className={`grid gap-8 ${
              page.pricing_packages.length === 2 
                ? 'md:grid-cols-2 max-w-4xl mx-auto' 
                : 'md:grid-cols-3'
            }`}>
              {page.pricing_packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`group bg-white border-2 p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 animate-fade-in-up ${
                    pkg.is_highlighted 
                      ? 'border-gray-900 scale-105 z-10' 
                      : 'border-gray-300 hover:border-gray-600'
                  }`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {pkg.badge && (
                    <div className="inline-block px-3 py-1 mb-4 text-xs font-bold bg-gray-900 text-white uppercase tracking-wider">
                      {pkg.badge}
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 transition-colors duration-300 group-hover:text-gray-700">
                    {pkg.name}
                  </h3>
                  
                  <div className="mb-6 pb-6 border-b-2 border-gray-200 transition-colors duration-300 group-hover:border-gray-900">
                    <div className="text-4xl font-bold text-gray-900 transition-transform duration-300 group-hover:scale-110 inline-block">
                      {formatPrice(pkg.price, page.currency)}
                    </div>
                    {pkg.original_price > pkg.price && (
                      <div className="text-lg text-gray-500 line-through mt-1">
                        {formatPrice(pkg.original_price, page.currency)}
                      </div>
                    )}
                    {pkg.description && (
                      <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                    )}
                  </div>

                  {pkg.features?.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 transition-transform duration-300 hover:translate-x-2">
                          <span className="text-gray-900 font-bold mt-0.5 transition-colors duration-300 group-hover:text-green-600">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
                    <button
                      onClick={handleWhatsAppClick}
                      className={`w-full py-4 text-sm font-bold uppercase tracking-wider border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                        pkg.is_highlighted
                          ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                          : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white'
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      {pkg.cta_text || "Pilih Paket"}
                    </button>
                  )}

                  {/* Hover Accent Line */}
                  <div className="absolute bottom-0 left-0 w-0 h-1 bg-gray-900 transition-all duration-500 group-hover:w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {page.testimonials?.length > 0 && page.testimonials[0]?.name && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: page.font_heading }}
              >
                Apa Kata Pelanggan Kami?
              </h2>
              <div className="w-20 h-1 bg-gray-900 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {page.testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className={`group bg-white border-2 border-gray-300 p-8 transition-all duration-500 hover:border-gray-900 hover:shadow-2xl hover:-translate-y-2 ${
                    index % 2 === 0 ? 'animate-slide-in-left' : 'animate-slide-in-right'
                  }`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Quote Icon */}
                  <div className="text-6xl text-gray-300 leading-none mb-4 transition-colors duration-300 group-hover:text-gray-900">
                    "
                  </div>

                  {/* Stars */}
                  <div className="mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className="text-gray-900 text-xl transition-transform duration-300 hover:scale-125 inline-block"
                          style={{ transitionDelay: `${i * 0.05}s` }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 mb-6 italic leading-relaxed text-lg">
                    {testimonial.quote}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-200 transition-colors duration-300 group-hover:border-gray-900">
                    <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-bold text-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-green-600">✓</span>
                        <span>Pelanggan Terverifikasi</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Accent Corner */}
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-8 border-r-8 border-transparent group-hover:border-gray-900 transition-all duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section - Rich Copywriting */}
      {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
        <section className="py-16 md:py-24 bg-gray-50 border-t-2 border-b-2 border-gray-200">
          <div className="max-w-5xl mx-auto px-4">
            {/* Main CTA */}
            <div className="text-center space-y-6 mb-12">
              <h2 
                className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight"
                style={{ fontFamily: page.font_heading }}
              >
                {copyBlocks.cta_headline || "Siap Untuk Memulai?"}
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                {copyBlocks.cta_subheadline || "Bergabunglah dengan ribuan pelanggan yang puas. Hubungi kami hari ini dan rasakan perbedaannya!"}
              </p>
            </div>

            {/* Urgency Message */}
            <div className="bg-white border-2 border-gray-900 p-6 mb-8 text-center">
              <p className="text-gray-900 font-bold text-lg mb-2">
                ⚡ {copyBlocks.urgency || "Penawaran Terbatas! Jangan Sampai Kehabisan!"}
              </p>
              <p className="text-gray-700 text-sm">
                Stok terbatas. Pesan sekarang sebelum terlambat!
              </p>
            </div>

            {/* Main CTA Button */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <Button
                onClick={handleWhatsAppClick}
                className="w-full md:w-auto px-16 py-8 text-xl md:text-2xl font-bold bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 hover:shadow-2xl transform hover:scale-105"
                style={{ borderRadius: 0 }}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>{copyBlocks.cta_primary || "HUBUNGI KAMI SEKARANG"}</span>
                </span>
              </Button>
              <p className="text-sm text-gray-600 text-center">
                ✓ Respon Instan • ✓ Dukungan Profesional • ✓ Kepuasan 100% Dijamin
              </p>
            </div>

            {/* Trust Indicators Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 border-2 border-gray-300 bg-white">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-gray-900 mb-2">Kualitas Terjamin</h3>
                <p className="text-sm text-gray-600">Produk berkualitas tinggi dengan standar terbaik</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-300 bg-white">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-gray-900 mb-2">Proses Cepat</h3>
                <p className="text-sm text-gray-600">Layanan cepat dan responsif untuk Anda</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-300 bg-white">
                <div className="text-4xl mb-3">💯</div>
                <h3 className="font-bold text-gray-900 mb-2">Garansi Puas</h3>
                <p className="text-sm text-gray-600">Jaminan uang kembali 100% jika tidak puas</p>
              </div>
            </div>

            {/* Social Proof */}
            {copyBlocks.social_proof && copyBlocks.social_proof.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-sm text-gray-600 mb-4">Dipercaya oleh ribuan pelanggan:</p>
                <div className="flex justify-center items-center gap-8 flex-wrap">
                  {copyBlocks.social_proof.map((proof, index) => (
                    <div key={index} className="text-center">
                      <p className="font-bold text-gray-900 text-lg">{proof.name}</p>
                      <p className="text-xs text-gray-600 italic">"{proof.quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Urgency Countdown */}
            <div className="mt-12 text-center p-8 bg-gray-900 text-white border-2 border-gray-900">
              <p className="text-sm font-bold uppercase tracking-wider mb-3">Penawaran Berakhir Dalam:</p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className="text-xs mt-1">Jam</div>
                </div>
                <div className="text-3xl font-bold">:</div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className="text-xs mt-1">Menit</div>
                </div>
                <div className="text-3xl font-bold">:</div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className="text-xs mt-1">Detik</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 border-t-4 border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} {page.product_name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TemplateMinimalist;
