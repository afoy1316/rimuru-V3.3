import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option...",
  emptyMessage = "No options available",
  searchPlaceholder = "Search...",
  disabled = false,
  renderOption = null,
  renderValue = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const label = option.label?.toLowerCase() || '';
    const searchText = option.searchText?.toLowerCase() || '';
    
    return label.includes(searchLower) || searchText.includes(searchLower);
  });

  // Get selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Handle selection
  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Default render functions
  const defaultRenderOption = (option) => option.label;
  const defaultRenderValue = (option) => option?.label || placeholder;

  const renderOptionContent = renderOption || defaultRenderOption;
  const renderValueContent = renderValue || defaultRenderValue;

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Selected Value Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 text-left bg-white border rounded-lg
          flex items-center justify-between
          transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 cursor-not-allowed text-gray-400' 
            : 'hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {renderValueContent(selectedOption)}
        </span>
        <ChevronDown 
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 flex flex-col">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {searchQuery ? `No results for "${searchQuery}"` : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-4 py-3 text-left flex items-center justify-between
                      transition-colors duration-150
                      ${isSelected 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'hover:bg-gray-50 text-gray-900'
                      }
                      border-b border-gray-100 last:border-b-0
                    `}
                  >
                    <span className="flex-1">
                      {renderOptionContent(option)}
                    </span>
                    {isSelected && (
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
