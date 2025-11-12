import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select option",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`
          w-full flex items-center justify-between px-4 py-2.5 text-left 
          bg-white border border-gray-300 rounded-lg shadow-sm
          hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200 ease-in-out
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="flex items-center">
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon className="w-4 h-4 mr-2" />}
              <span className={`font-medium ${selectedOption.color || 'text-gray-900'}`}>
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 text-left
                  hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                  transition-colors duration-150 ease-in-out
                  ${value === option.value ? 'bg-blue-50' : ''}
                `}
                onClick={() => handleOptionClick(option.value)}
              >
                <span className="flex items-center">
                  {option.icon && <option.icon className="w-4 h-4 mr-2" />}
                  <span className={`font-medium ${option.color || 'text-gray-900'}`}>
                    {option.label}
                  </span>
                </span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;