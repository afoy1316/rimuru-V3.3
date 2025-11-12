import React from 'react';
import { Button } from '../ui/button';

const TemplateEcommerce = ({ page, handleWhatsAppClick, formatPrice }) => {
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: page.font_body }}>
      {/* Top Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="font-bold text-xl" style={{ fontFamily: page.font_heading }}>
            {page.product_name}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>✓ Free Shipping</span>
            <span>✓ 30-Day Returns</span>
            <span>✓ Secure Payment</span>
          </div>
        </div>
      </div>

      {/* Product Hero */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              {page.hero_image && (
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={page.hero_image}
                    alt={page.product_name}
                    className="w-full aspect-square object-cover"
                  />
                </div>
              )}
              {page.gallery_images?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {page.gallery_images.map((img, idx) => (
                    <div key={idx} className="bg-gray-100 rounded overflow-hidden aspect-square">
                      <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded mb-3">
                  In Stock
                </div>
                <h1 
                  className="text-4xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: page.font_heading }}
                >
                  {page.product_name}
                </h1>
                <p className="text-gray-600 leading-relaxed">{page.product_description}</p>
              </div>

              {page.product_price && page.pricing_mode === "single" && (
                <div className="py-6 border-t border-b">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold" style={{ color: page.primary_color }}>
                      {formatPrice(page.product_price, page.currency)}
                    </span>
                    <span className="text-gray-400 text-sm">Inclusive of all taxes</span>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-xs font-semibold text-gray-700">Money Back Guarantee</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🚚</div>
                  <div className="text-xs font-semibold text-gray-700">Fast Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">✓</div>
                  <div className="text-xs font-semibold text-gray-700">Verified Product</div>
                </div>
              </div>

              {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
                <div className="space-y-3">
                  <Button
                    onClick={handleWhatsAppClick}
                    className="w-full py-6 text-lg font-bold"
                    style={{ backgroundColor: page.primary_color }}
                  >
                    Buy Now via WhatsApp
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    ✓ Secure checkout • ✓ Instant confirmation • ✓ 24/7 support
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits/Features */}
      {page.benefits?.length > 0 && page.benefits[0] !== "" && (
        <section className="py-16 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: page.font_heading }}>
              Product Features
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {page.benefits.map((benefit, index) => (
                <div key={index} className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: page.primary_color }}>
                    ✓
                  </div>
                  <p className="text-sm text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Options */}
      {page.pricing_mode === "multiple" && page.pricing_packages?.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: page.font_heading }}>
              Choose Your Package
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {page.pricing_packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-lg p-6 ${pkg.is_highlighted ? 'ring-2 ring-offset-2' : ''}`}
                  style={{ ringColor: pkg.is_highlighted ? page.accent_color : 'transparent' }}
                >
                  {pkg.badge && (
                    <div className="inline-block px-3 py-1 mb-3 text-xs font-bold rounded" style={{ backgroundColor: page.accent_color, color: '#fff' }}>
                      {pkg.badge}
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: page.primary_color }}>
                      {formatPrice(pkg.price, page.currency)}
                    </span>
                    {pkg.original_price > pkg.price && (
                      <span className="ml-2 text-gray-400 line-through">
                        {formatPrice(pkg.original_price, page.currency)}
                      </span>
                    )}
                  </div>
                  {pkg.features?.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
                    <button
                      onClick={handleWhatsAppClick}
                      className="w-full py-3 font-semibold rounded"
                      style={{
                        backgroundColor: pkg.is_highlighted ? page.primary_color : '#fff',
                        color: pkg.is_highlighted ? '#fff' : page.primary_color,
                        border: `2px solid ${page.primary_color}`
                      }}
                    >
                      {pkg.cta_text || "Select"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {page.testimonials?.length > 0 && page.testimonials[0]?.name && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: page.font_heading }}>
              Customer Reviews
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {page.testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">Verified Purchase</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      {(page.whatsapp_numbers?.length > 0 || page.whatsapp_number) && (
        <section className="py-16 text-center" style={{ backgroundColor: page.primary_color }}>
          <div className="max-w-3xl mx-auto px-4 space-y-4">
            <h2 className="text-4xl font-bold text-white" style={{ fontFamily: page.font_heading }}>
              Ready to Order?
            </h2>
            <p className="text-white text-lg">Get yours today with free shipping!</p>
            <Button
              onClick={handleWhatsAppClick}
              className="px-12 py-6 text-lg font-bold bg-white hover:bg-gray-100"
              style={{ color: page.primary_color }}
            >
              Order Now on WhatsApp
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          © 2025 {page.product_name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default TemplateEcommerce;
