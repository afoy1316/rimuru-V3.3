import React from 'react';
import { Check } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'modern_gradient',
    name: 'Modern Gradient',
    description: 'Dynamic gradient colors with modern layout',
    preview: '🎨',
    features: ['Gradient backgrounds', 'Smooth animations', 'Bold CTAs'],
    recommended: true
  },
  {
    id: 'minimalist_clean',
    name: 'Minimalist Clean',
    description: 'Simple, elegant design with white space',
    preview: '✨',
    features: ['Clean layout', 'Subtle borders', 'Professional look']
  },
  {
    id: 'bold_impact',
    name: 'Bold Impact',
    description: 'Large typography with strong visual impact',
    preview: '💥',
    features: ['Large text', 'High contrast', 'Powerful presence'],
    comingSoon: true
  },
  {
    id: 'ecommerce_pro',
    name: 'E-Commerce Pro',
    description: 'Product-focused with clear pricing display',
    preview: '🛍️',
    features: ['Product grid', 'Trust badges', 'Clear pricing'],
    comingSoon: true
  }
];

const TemplateSelector = ({ selectedTemplate, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Template Design
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Pilih template yang sesuai dengan style brand Anda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => !template.comingSoon && onChange(template.id)}
            disabled={template.comingSoon}
            className={`
              relative p-4 border-2 rounded-lg text-left transition-all
              ${selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
              ${template.comingSoon
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:shadow-md'
              }
            `}
          >
            {/* Selected Check */}
            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* Recommended Badge */}
            {template.recommended && (
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 text-xs font-bold bg-green-500 text-white rounded-full">
                  Recommended
                </span>
              </div>
            )}

            {/* Coming Soon Badge */}
            {template.comingSoon && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 text-xs font-bold bg-gray-400 text-white rounded-full">
                  Coming Soon
                </span>
              </div>
            )}

            {/* Template Preview Icon */}
            <div className="text-4xl mb-3 mt-6">
              {template.preview}
            </div>

            {/* Template Info */}
            <h3 className="font-bold text-gray-900 mb-1">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {template.description}
            </p>

            {/* Features */}
            <div className="space-y-1">
              {template.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Semua template sudah aktif! Pilih design yang sesuai dengan brand Anda. Preview template sebelum publish.
        </p>
      </div>
    </div>
  );
};

export default TemplateSelector;
