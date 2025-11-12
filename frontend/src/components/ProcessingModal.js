import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Upload, Send, Mail } from 'lucide-react';

const ProcessingModal = ({ isOpen, onComplete, estimatedTime = 60000 }) => {
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Mengunggah data', icon: Upload },
    { label: 'Memproses transaksi', icon: Send },
    { label: 'Mengirim notifikasi', icon: Mail }
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setShowConfetti(false);
      setIsComplete(false);
      setCurrentStep(0);
      return;
    }

    // Simulate progress over estimated time
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev; // Stop at 95% until actual completion
        const newProgress = prev + (95 / (estimatedTime / 100));
        
        // Update current step based on progress
        if (newProgress < 33) setCurrentStep(0);
        else if (newProgress < 66) setCurrentStep(1);
        else setCurrentStep(2);
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, estimatedTime]);

  useEffect(() => {
    if (isComplete && progress === 100) {
      setShowConfetti(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    }
  }, [isComplete, progress, onComplete]);

  const completeProgress = () => {
    setProgress(100);
    setCurrentStep(2);
    setIsComplete(true);
  };

  // Expose method to parent component
  useEffect(() => {
    if (isOpen) {
      window.completeProcessingModal = completeProgress;
    }
    return () => {
      delete window.completeProcessingModal;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full mx-4 relative overflow-hidden">
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-50">
              {[...Array(80)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animation: `confetti ${1.5 + Math.random() * 1}s ease-out forwards`,
                    animationDelay: `${Math.random() * 0.3}s`
                  }}
                >
                  <div
                    className="w-2 h-2"
                    style={{
                      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][
                        Math.floor(Math.random() * 7)
                      ],
                      borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="text-center relative z-10">
            {!isComplete ? (
              <>
                {/* Circular Progress with Animated Ring */}
                <div className="mb-8 relative inline-block">
                  {/* Outer animated ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping opacity-75"></div>
                  
                  {/* Progress Circle */}
                  <svg className="transform -rotate-90 w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="url(#gradient)"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14B8A6" />
                        <stop offset="100%" stopColor="#0D9488" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center percentage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                      {Math.round(progress)}%
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Loading</span>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Memproses Permintaan
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Mohon tunggu sekitar 1 menit...
                  </p>
                  
                  {/* Step Indicators */}
                  <div className="space-y-3 max-w-xs mx-auto mb-6">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = index === currentStep;
                      const isCompleted = index < currentStep;
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                            isActive ? 'bg-teal-50 border-2 border-teal-300' : 
                            isCompleted ? 'bg-green-50 border-2 border-green-300' : 
                            'bg-gray-50 border-2 border-gray-200'
                          }`}
                        >
                          <div className={`p-2 rounded-full ${
                            isActive ? 'bg-teal-500 animate-pulse' : 
                            isCompleted ? 'bg-green-500' : 
                            'bg-gray-400'
                          }`}>
                            <StepIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className={`text-sm font-medium ${
                            isActive ? 'text-teal-700' : 
                            isCompleted ? 'text-green-700' : 
                            'text-gray-500'
                          }`}>
                            {step.label}
                          </span>
                          {isActive && (
                            <div className="flex-1 flex justify-end">
                              <div className="flex space-x-1">
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"
                                    style={{
                                      animationDelay: `${i * 0.15}s`,
                                      animationDuration: '0.6s'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Warning Message - Cleaned up */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-amber-900 mb-1">
                        Jangan refresh atau tutup halaman ini
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Sistem sedang mengirim notifikasi ke admin dan memproses data Anda
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="py-4">
                  <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 animate-scale-in shadow-lg">
                    <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-3">
                    Berhasil!
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Permintaan Anda telah berhasil diproses
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(600px) rotate(${Math.random() * 720}deg) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.15) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default ProcessingModal;
