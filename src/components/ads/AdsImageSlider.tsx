"use client";

import { FC, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { motivationalAds } from "./motivationalAds";

interface AdsImageSliderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const AdsImageSlider: FC<AdsImageSliderProps> = ({
  isExpanded,
  onToggle,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!isExpanded) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % motivationalAds.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % motivationalAds.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + motivationalAds.length) % motivationalAds.length
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Ads</h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </div>
      {isExpanded && (
        <div className="relative group">
          {/* Main Slider */}
          <div className="relative h-48 overflow-hidden">
            {motivationalAds.map((ad, index) => (
              <div
                key={ad.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="relative h-full bg-gradient-to-r from-purple-500 to-blue-600">
                  {/* Placeholder for ad image - replace with actual image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20" />

                  {/* Ad Content */}
                  <div className="absolute inset-0 flex flex-col justify-center p-6 text-white">
                    <h4 className="text-lg font-semibold mb-2">{ad.title}</h4>
                    <p className="text-sm opacity-90 mb-4">{ad.description}</p>
                    <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      {ad.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows - Only show on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdsImageSlider;
