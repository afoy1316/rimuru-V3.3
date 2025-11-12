import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import TemplateMinimalist from "./templates/TemplateMinimalist";
import TemplateBold from "./templates/TemplateBold";
import TemplateEcommerce from "./templates/TemplateEcommerce";
import CheckoutModal from "./CheckoutModal";
import { ShoppingCart, MessageCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LandingPageViewer = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 0,
    seconds: 0
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  useEffect(() => {
    fetchLandingPage();
  }, [slug]);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset to 2 hours when reaches 0
          hours = 2;
          minutes = 0;
          seconds = 0;
        }
        
        return { hours, minutes, seconds };
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
    }, 3000); // Slide every 3 seconds

    return () => clearInterval(autoSlide);
  }, [page, isAutoSliding]);

  const nextSlide = () => {
    if (page && page.gallery_images) {
      setCurrentSlide((prev) => (prev + 1) % page.gallery_images.length);
      setIsAutoSliding(false); // Pause autoslide when manual control
      setTimeout(() => setIsAutoSliding(true), 10000); // Resume after 10s
    }
  };

  const prevSlide = () => {
    if (page && page.gallery_images) {
      setCurrentSlide((prev) => (prev - 1 + page.gallery_images.length) % page.gallery_images.length);
      setIsAutoSliding(false);
      setTimeout(() => setIsAutoSliding(true), 10000);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoSliding(false);
    setTimeout(() => setIsAutoSliding(true), 10000);
  };

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/landing-pages/public/${slug}`);
      setPage(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setError("Landing page not found");
      } else {
        setError("Failed to load landing page");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!page) return;

    // Set page title and meta tags
    document.title = page.seo_title || page.product_name;
    
    // Add meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = page.seo_description || page.product_description;

    // Add meta keywords
    if (page.seo_keywords && page.seo_keywords.length > 0) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = "keywords";
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = page.seo_keywords.join(", ");
    }

    // Add Open Graph tags
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    if (page.images && page.images[0]) {
      ogImage.content = page.images[0];
    }

    // Inject tracking pixels
    if (page.facebook_pixel_id) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${page.facebook_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

    if (page.tiktok_pixel_id) {
      const script = document.createElement('script');
      script.innerHTML = `
        (function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
        ttq.methods=['page','track','identify','instances','debug','on','off','upload'];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
        for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.load=function(e){var i='https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i=ttq._i||{};ttq._i[e]=[];ttq.init=function(e){ttq._i[e]=[]};
        var n=d.createElement('script');n.async=!0;n.src=i;
        var s=d.getElementsByTagName('script')[0];s.parentNode.insertBefore(n,s)};
        ttq.load('${page.tiktok_pixel_id}');ttq.page();})(window,document,'ttq');
      `;
      document.head.appendChild(script);
    }

    if (page.ga_measurement_id) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${page.ga_measurement_id}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${page.ga_measurement_id}');
      `;
      document.head.appendChild(script2);
    }
  }, [page]);

  // WhatsApp CS Auto-Rotation Logic
  const getRotatedWhatsAppNumber = () => {
    // If using new multiple WhatsApp numbers with rotation
    if (page.whatsapp_numbers && page.whatsapp_numbers.length > 0) {
      // Validate total percentage
      const totalPercentage = page.whatsapp_numbers.reduce((sum, cs) => sum + (cs.percentage || 0), 0);
      if (totalPercentage !== 100) {
        console.warn('WhatsApp CS percentages do not add up to 100%');
        return page.whatsapp_numbers[0].number; // Fallback to first number
      }

      // Weighted random selection based on percentage
      const random = Math.random() * 100; // 0-100
      let cumulativePercentage = 0;
      
      for (const cs of page.whatsapp_numbers) {
        cumulativePercentage += cs.percentage;
        if (random <= cumulativePercentage) {
          console.log(`WhatsApp CS Selected: ${cs.name} (${cs.percentage}%)`);
          return cs.number;
        }
      }
      
      // Fallback (should not reach here if percentages are correct)
      return page.whatsapp_numbers[0].number;
    }
    
    // Fallback to old single whatsapp_number for backward compatibility
    return page.whatsapp_number;
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = getRotatedWhatsAppNumber();
    
    if (whatsappNumber) {
      // Track CTA click with custom event name
      const eventName = page.cta_event_name || 'Contact';
      if (window.fbq) window.fbq('track', eventName);
      if (window.ttq) window.ttq.track(eventName);
      if (window.gtag) window.gtag('event', eventName, {
        'event_category': 'engagement',
        'event_label': 'whatsapp_cta'
      });
      
      const message = encodeURIComponent(`Halo, saya tertarik dengan ${page.product_name}`);
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    }
  };

  // Order checkout handlers
  const handleCheckoutClick = () => {
    // Track checkout initiation
    if (window.fbq) window.fbq('track', 'InitiateCheckout');
    if (window.ttq) window.ttq.track('InitiateCheckout');
    if (window.gtag) window.gtag('event', 'begin_checkout', {
      'event_category': 'ecommerce',
      'event_label': 'checkout_modal'
    });
    
    setShowCheckoutModal(true);
  };

  const handleWhatsAppOrderClick = () => {
    const whatsappNumber = getRotatedWhatsAppNumber();
    const productDetails = page.product_details || {};
    
    if (whatsappNumber) {
      // Track WhatsApp order
      if (window.fbq) window.fbq('track', 'InitiateCheckout');
      if (window.ttq) window.ttq.track('InitiateCheckout');
      if (window.gtag) window.gtag('event', 'begin_checkout', {
        'event_category': 'ecommerce',
        'event_label': 'whatsapp_order'
      });
      
      const price = page.product_price ? formatPrice(page.product_price, page.currency) : 'Hubungi kami';
      const message = encodeURIComponent(
        `Halo, saya mau order:\n📦 *${page.product_name}*\n💰 Harga: ${price}\n📦 Jumlah: \n📍 Alamat: `
      );
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    }
  };

  const formatPrice = (price, currency) => {
    if (!price) return "";
    if (currency === "IDR") {
      return `Rp ${price.toLocaleString('id-ID')}`;
    }
    return `$${price.toLocaleString('en-US')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600">{error || "Landing page not found"}</p>
        </div>
      </div>
    );
  }

  const copyBlocks = page.copy_blocks || {};
  
  // Get GCS image URL or use placeholder
  const getImageUrl = (gcsUrl) => {
    if (!gcsUrl) return null;
    
    // If it's already a full URL, return as is
    if (gcsUrl.startsWith('http://') || gcsUrl.startsWith('https://')) {
      return gcsUrl;
    }
    
    // Convert GCS URL to public URL
    if (gcsUrl.startsWith('gs://')) {
      // Extract bucket and path
      const urlParts = gcsUrl.replace('gs://', '').split('/');
      const bucket = urlParts[0];
      const path = urlParts.slice(1).join('/');
      return `https://storage.googleapis.com/${bucket}/${path}`;
    }
    
    // If it's just a path, assume default bucket
    return `https://storage.googleapis.com/rimuru-file-uploads/${gcsUrl}`;
  };
  
  // Template Switching Logic
  const renderTemplate = () => {
    const templateId = page.template_id || 'modern_gradient';
    const templateProps = {
      page,
      handleWhatsAppClick,
      handleCheckoutClick,
      handleWhatsAppOrderClick,
      formatPrice,
      copyBlocks,
      getImageUrl,
      currentSlide,
      setCurrentSlide,
      timeLeft
    };

    switch(templateId) {
      case 'minimalist_clean':
        return <TemplateMinimalist {...templateProps} />;
      case 'bold_impact':
        return <TemplateBold {...templateProps} />;
      case 'ecommerce_pro':
        return <TemplateEcommerce {...templateProps} />;
      case 'modern_gradient':
      default:
        // Return original modern gradient template (keep existing code)
        return renderModernGradient();
    }
  };

  const renderModernGradient = () => (
    <div 
      className="min-h-screen bg-white"
      style={{ fontFamily: page.font_body }}
    >
      {/* Floating Urgency Badge */}
      <div className="fixed top-4 right-4 z-50 animate-bounce hidden md:block">
        <div className="bg-red-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-2xl font-bold text-sm md:text-base">
          🔥 PROMO HARI INI!
        </div>
      </div>

      {/* Mobile Urgency Badge */}
      <div className="md:hidden sticky top-0 z-40 bg-red-600 text-white text-center py-2 text-sm font-bold animate-pulse">
        🔥 PROMO HARI INI! 🔥
      </div>

      {/* Hero Section */}
      <section 
        className="py-20 px-4 relative overflow-hidden"
        style={{ backgroundColor: `${page.primary_color}10` }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="animate-fade-in-up">
              {/* Limited Offer Badge */}
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold mb-4 animate-pulse">
                <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-red-500"></span>
                </span>
                <span className="hidden md:inline">Penawaran Terbatas - Pesan Hari Ini!</span>
                <span className="md:hidden">Promo Terbatas!</span>
              </div>

              <p 
                className="text-base md:text-lg font-semibold mb-3 md:mb-4 animate-fade-in"
                style={{ color: page.accent_color, fontFamily: page.font_heading, animationDelay: '0.1s' }}
              >
                ⭐ {copyBlocks.subheadline || page.product_name}
              </p>
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight animate-fade-in-up"
                style={{ color: page.primary_color, fontFamily: page.font_heading, animationDelay: '0.2s' }}
              >
                {copyBlocks.hero_headline || page.product_name}
              </h1>
              <p className="text-base md:text-xl text-gray-700 mb-4 md:mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {copyBlocks.hero_description || page.product_description}
              </p>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 md:mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 border-2 border-white"></div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 border-2 border-white"></div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 border-2 border-white"></div>
                  </div>
                  <span className="ml-2 md:ml-3 text-xs md:text-sm text-gray-600 font-semibold">500+ Pelanggan Puas</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg md:text-2xl">⭐⭐⭐⭐⭐</span>
                  <span className="text-xs md:text-sm text-gray-600 font-semibold">4.9/5</span>
                </div>
              </div>

              {page.product_price && page.pricing_mode === "single" && (
                <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-baseline gap-3">
                    <span className="text-gray-400 line-through text-xl">
                      {formatPrice(page.product_price * 1.3, page.currency)}
                    </span>
                    <span className="text-4xl font-bold" style={{ color: page.accent_color }}>
                      {formatPrice(page.product_price, page.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 font-semibold mt-2">💰 Hemat 30% - Hanya Hari Ini!</p>
                </div>
              )}

              {/* Product Checkout Buttons (HIDDEN FOR NOW) */}
              {/* Uncomment this section to enable Product checkout functionality
              {page.product_details?.is_enabled ? (
                <div className="space-y-3 md:space-y-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  {page.product_details.stock_quantity !== undefined && (
                    <div className="text-sm font-semibold">
                      {page.product_details.stock_quantity > 0 ? (
                        <span className="text-green-600">
                          ✅ Stok Tersedia: {page.product_details.stock_quantity} unit
                        </span>
                      ) : (
                        <span className="text-red-600">
                          ❌ Stok Habis
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-3 w-full">
                    {page.product_details.enable_full_form && page.product_details.stock_quantity > 0 && (
                      <Button
                        onClick={handleCheckoutClick}
                        className="text-white px-6 py-4 md:px-8 md:py-6 text-base md:text-lg font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-2xl flex-1"
                        style={{ backgroundColor: page.accent_color }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                          <span>Pesan Sekarang</span>
                        </span>
                      </Button>
                    )}

                    {page.product_details.enable_whatsapp && (page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
                      <Button
                        onClick={handleWhatsAppOrderClick}
                        className="text-white px-6 py-4 md:px-8 md:py-6 text-base md:text-lg font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-2xl flex-1"
                        style={{ backgroundColor: page.primary_color }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                          <span>Order via WhatsApp</span>
                        </span>
                      </Button>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-gray-500 text-center">
                    ✅ Pengiriman ke Seluruh Indonesia • ✅ Gratis Konsultasi • ✅ Proses Mudah
                  </p>
                </div>
              ) : ( */}
              {/* Regular WhatsApp CTA (if product not enabled) */}
              {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
                  <div className="space-y-3 md:space-y-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <Button
                      onClick={handleWhatsAppClick}
                      className="text-white px-6 py-4 md:px-10 md:py-7 text-base md:text-xl font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-2xl w-full md:w-auto"
                      style={{ backgroundColor: page.accent_color }}
                    >
                      <span className="flex items-center justify-center gap-2 md:gap-3">
                        <svg className="w-5 h-5 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="hidden sm:inline">{copyBlocks.cta_primary || "Pesan Sekarang via WhatsApp"}</span>
                        <span className="sm:hidden">Pesan via WhatsApp</span>
                      </span>
                    </Button>
                    <p className="text-xs md:text-sm text-gray-500 text-center md:text-left">✅ Fast Response • ✅ Gratis Konsultasi • ✅ Proses Mudah</p>
                  </div>
                )
              }
              {/* )} */}
            </div>
            
            {page.hero_image && (
              <div className="animate-fade-in-right" style={{ animationDelay: '0.3s' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl transform rotate-3 scale-105 opacity-20"></div>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                    <img
                      src={getImageUrl(page.hero_image)}
                      alt={page.product_name}
                      className="w-full h-auto"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EHero Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  {/* Trust Badge */}
                  <div className="absolute -bottom-4 -right-4 bg-white rounded-full p-3 md:p-4 shadow-xl animate-pulse">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-green-600">✓</div>
                      <div className="text-xs font-semibold text-gray-600">100%<br/>Terpercaya</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        .animate-fade-in-right {
          animation: fade-in-right 1s ease-out forwards;
        }
      `}</style>

      {/* Product Gallery Section - Auto & Manual Carousel */}
      {page.gallery_images && page.gallery_images.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 md:mb-12">
              <h2 
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2"
                style={{ color: page.primary_color, fontFamily: page.font_heading }}
              >
                Galeri Produk
              </h2>
              <p className="text-sm md:text-base text-gray-600">Lihat lebih detail produk kami</p>
            </div>
            
            {/* Carousel Container */}
            <div 
              className="relative max-w-4xl mx-auto"
              onMouseEnter={() => setIsAutoSliding(false)}
              onMouseLeave={() => setIsAutoSliding(true)}
            >
              {/* Main Image */}
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <img
                  src={getImageUrl(page.gallery_images[currentSlide])}
                  alt={`${page.product_name} - ${currentSlide + 1}`}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '600px' }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23f0f0f0" width="800" height="600"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24"%3EGallery Image ' + (currentSlide + 1) + '%3C/text%3E%3C/svg%3E';
                  }}
                />
                
                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {currentSlide + 1} / {page.gallery_images.length}
                </div>

                {/* Navigation Buttons */}
                {page.gallery_images.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                      aria-label="Previous"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                      aria-label="Next"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {page.gallery_images.length > 1 && (
                <div className="mt-6">
                  <div className="flex gap-2 md:gap-3 justify-center overflow-x-auto pb-2 hide-scrollbar">
                    {page.gallery_images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          currentSlide === index 
                            ? 'border-teal-500 scale-110 shadow-lg' 
                            : 'border-gray-300 hover:border-teal-300 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3E' + (index + 1) + '%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicator Dots */}
              {page.gallery_images.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {page.gallery_images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        currentSlide === index 
                          ? 'w-8 bg-teal-500' 
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Auto-slide Indicator */}
              {isAutoSliding && page.gallery_images.length > 1 && (
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    🔄 Auto-slide aktif • Hover atau klik untuk pause
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Benefits Section */}
      {(page.benefits || copyBlocks.benefit_bullets || []).length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-bold mb-4">
                🎯 KEUNTUNGAN UNTUK ANDA
              </span>
              <h2 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ color: page.primary_color, fontFamily: page.font_heading }}
              >
                Mengapa Memilih Kami?
              </h2>
              <p className="text-xl text-gray-600">Lebih dari 500+ pelanggan telah merasakan manfaatnya</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {(page.benefits || copyBlocks.benefit_bullets || []).map((benefit, index) => (
                <div 
                  key={index} 
                  className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 border-2 border-transparent hover:border-teal-400"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                      style={{ backgroundColor: `${page.primary_color}20`, color: page.primary_color }}
                    >
                      <span className="text-3xl font-bold">✓</span>
                    </div>
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                      #{index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-teal-600 transition-colors" style={{ fontFamily: page.font_heading }}>
                    {benefit}
                  </h3>
                  <div className="h-1 w-12 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full group-hover:w-full transition-all duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Packages Section */}
      {page.pricing_mode === "multiple" && page.pricing_packages && page.pricing_packages.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-bold mb-4">
                💰 PILIHAN PAKET
              </span>
              <h2 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ color: page.primary_color, fontFamily: page.font_heading }}
              >
                Pilih Paket Terbaik Anda
              </h2>
              <p className="text-xl text-gray-600">Semakin banyak beli, semakin hemat!</p>
            </div>
            
            <div className={`grid gap-8 ${
              page.pricing_packages.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 
              page.pricing_packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 
              'md:grid-cols-3'
            }`}>
              {page.pricing_packages.map((pkg, index) => (
                <div 
                  key={index}
                  className={`relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-500 overflow-hidden ${
                    pkg.is_highlighted ? 'ring-4 ring-teal-400 scale-105' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                      {pkg.badge}
                    </div>
                  )}
                  
                  {/* Recommended Tag */}
                  {pkg.is_highlighted && (
                    <div className="bg-gradient-to-r from-teal-400 to-blue-500 text-white text-center py-2 text-sm font-bold">
                      🌟 PALING POPULER
                    </div>
                  )}
                  
                  <div className="p-8">
                    {/* Package Name */}
                    <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: page.font_heading }}>
                      {pkg.name}
                    </h3>
                    
                    {/* Description */}
                    {pkg.description && (
                      <p className="text-sm text-gray-600 mb-6">{pkg.description}</p>
                    )}
                    
                    {/* Pricing */}
                    <div className="mb-6">
                      {pkg.original_price > pkg.price && (
                        <div className="text-gray-400 line-through text-lg mb-1">
                          {formatPrice(pkg.original_price, page.currency)}
                        </div>
                      )}
                      <div className="text-4xl font-bold" style={{ color: pkg.is_highlighted ? page.accent_color : page.primary_color }}>
                        {formatPrice(pkg.price, page.currency)}
                      </div>
                      {pkg.original_price > pkg.price && (
                        <div className="text-sm text-green-600 font-semibold mt-1">
                          💰 Hemat {formatPrice(pkg.original_price - pkg.price, page.currency)}!
                        </div>
                      )}
                    </div>
                    
                    {/* Features */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="mb-8 space-y-3">
                        {pkg.features.map((feature, featIndex) => (
                          <div key={featIndex} className="flex items-start gap-3">
                            <div 
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: page.primary_color }}
                            >
                              ✓
                            </div>
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* CTA Button */}
                    {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
                      <button
                        onClick={handleWhatsAppClick}
                        className="w-full text-white px-6 py-4 text-lg font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg"
                        style={{ backgroundColor: pkg.is_highlighted ? page.accent_color : page.primary_color }}
                      >
                        {pkg.cta_text || "Beli Sekarang"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {(page.testimonials || copyBlocks.social_proof || []).length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold mb-4">
                ⭐ TESTIMONI PELANGGAN
              </span>
              <h2 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ color: page.primary_color, fontFamily: page.font_heading }}
              >
                Apa Kata Mereka?
              </h2>
              <p className="text-xl text-gray-600">Ribuan pelanggan telah membuktikannya</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {(page.testimonials || copyBlocks.social_proof || []).map((testimonial, index) => (
                <div 
                  key={index} 
                  className="relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 border-l-4"
                  style={{ borderLeftColor: page.accent_color }}
                >
                  <div className="absolute -top-4 -left-4 text-6xl opacity-20" style={{ color: page.primary_color }}>
                    "
                  </div>
                  <div className="flex items-center gap-1 mb-4">
                    <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                    <span className="text-sm text-gray-500 ml-2">5.0</span>
                  </div>
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed relative z-10">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p 
                        className="font-bold text-lg"
                        style={{ color: page.primary_color }}
                      >
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-500">Pelanggan Terverifikasi ✓</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold mb-2" style={{ color: page.primary_color }}>500+</div>
                <div className="text-sm text-gray-600">Pelanggan Puas</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold mb-2" style={{ color: page.primary_color }}>4.9⭐</div>
                <div className="text-sm text-gray-600">Rating Rata-rata</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold mb-2" style={{ color: page.primary_color }}>24/7</div>
                <div className="text-sm text-gray-600">Customer Support</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold mb-2" style={{ color: page.primary_color }}>100%</div>
                <div className="text-sm text-gray-600">Garansi Puas</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {copyBlocks.faq && copyBlocks.faq.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <h2 
              className="text-4xl font-bold text-center mb-12"
              style={{ color: page.primary_color, fontFamily: page.font_heading }}
            >
              Pertanyaan Umum
            </h2>
            <div className="space-y-4">
              {copyBlocks.faq.map((faq, index) => (
                <details key={index} className="bg-white p-6 rounded-xl shadow-lg">
                  <summary 
                    className="font-semibold text-lg cursor-pointer"
                    style={{ color: page.primary_color }}
                  >
                    {faq.q}
                  </summary>
                  <p className="mt-4 text-gray-700">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Urgency Bar */}
      <section className="py-4 md:py-6 px-4 bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 text-center md:text-left">
              <div className="animate-pulse text-xl md:text-2xl">🔥</div>
              <div>
                <div className="font-bold text-base md:text-lg">PROMO TERBATAS!</div>
                <div className="text-xs md:text-sm opacity-90">Hanya 20 pelanggan pertama hari ini</div>
              </div>
            </div>
            <div className="bg-white text-red-600 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold flex items-center gap-2">
              <span className="text-lg md:text-2xl animate-pulse">⏰</span>
              <span className="tabular-nums text-sm md:text-base">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-24 px-4 text-center text-white relative overflow-hidden"
        style={{ backgroundColor: page.primary_color }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="inline-block mb-6">
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-full text-sm font-bold px-6 py-2 mb-4 animate-bounce">
              ⚡ DISKON 30% HARI INI SAJA!
            </div>
            <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl">
              <div className="text-sm font-semibold mb-2">⏰ PENAWARAN BERAKHIR DALAM:</div>
              <div className="flex items-center justify-center gap-4 text-3xl font-bold tabular-nums">
                <div className="flex flex-col items-center">
                  <span className="bg-white text-red-600 px-4 py-2 rounded-lg min-w-[70px]">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-xs mt-1">JAM</span>
                </div>
                <span className="animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span className="bg-white text-red-600 px-4 py-2 rounded-lg min-w-[70px]">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-xs mt-1">MENIT</span>
                </div>
                <span className="animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span className="bg-white text-red-600 px-4 py-2 rounded-lg min-w-[70px]">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-xs mt-1">DETIK</span>
                </div>
              </div>
            </div>
          </div>
          
          <h2 
            className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight"
            style={{ fontFamily: page.font_heading }}
          >
            {copyBlocks.cta_primary || "Jangan Lewatkan Kesempatan Ini!"}
          </h2>
          <p className="text-2xl mb-4 opacity-95 font-semibold">
            Hubungi Kami Sekarang dan Dapatkan Penawaran Terbaik!
          </p>
          <p className="text-lg mb-10 opacity-80">
            ✅ Gratis Konsultasi • ✅ Fast Response • ✅ Proses Mudah & Cepat
          </p>

          {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
            <div className="space-y-4 md:space-y-6">
              <Button
                onClick={handleWhatsAppClick}
                className="w-full md:w-auto px-8 py-6 md:px-12 md:py-8 text-lg md:text-2xl font-bold rounded-xl md:rounded-2xl hover:scale-105 md:hover:scale-110 transition-all duration-300 shadow-2xl animate-pulse"
                style={{ 
                  backgroundColor: page.accent_color,
                  color: 'white'
                }}
              >
                <span className="flex items-center justify-center gap-2 md:gap-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="hidden sm:inline">PESAN SEKARANG VIA WHATSAPP</span>
                  <span className="sm:hidden">PESAN VIA WHATSAPP</span>
                </span>
              </Button>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs md:text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">📱</span>
                  <span>Chat Langsung</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">⚡</span>
                  <span>Respon Cepat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">🔒</span>
                  <span>100% Aman</span>
                </div>
              </div>

              <p className="text-xs md:text-sm opacity-75 mt-4 md:mt-6">
                💥 Buruan! Promo ini tidak akan bertahan lama!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white text-center">
        <p>© {new Date().getFullYear()} {page.product_name}. All rights reserved.</p>
      </footer>
    </div>
  );

  // Main return - render selected template
  return (
    <>
      {renderTemplate()}
      
      {/* Checkout Modal for Product Orders - HIDDEN FOR NOW */}
      {/* Uncomment this section to enable checkout functionality
      {page?.product_details?.is_enabled && page?.product_details?.enable_full_form && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          product={{
            name: page.product_name,
            price: page.product_price || 0,
            stock: page.product_details.stock_quantity || 0,
            weight: page.product_details.weight || 500,
            length: page.product_details.length || 10,
            width: page.product_details.width || 10,
            height: page.product_details.height || 10,
            shipping_origin: page.product_details.shipping_origin || {},
            available_couriers: page.product_details.available_couriers || [],
            payment_methods: page.product_details.payment_methods || []
          }}
          landingPageId={page.id}
        />
      )}
      */}
    </>
  );
};

export default LandingPageViewer;
