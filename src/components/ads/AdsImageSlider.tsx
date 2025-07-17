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

  // Auto-advance slides
  useEffect(() => {
    if (!isExpanded) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % motivationalAds.length);
    }, 5000); // Change slide every 5 seconds

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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      {/* Floating Ads Pill - Left side */}
      <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-purple-500 text-white text-[10px] font-medium rounded-full shadow-lg border">
        Ads
      </div>

      {/* Toggle Button - Right side (identical styling) */}
      <button
        onClick={onToggle}
        className="absolute top-2 right-2 z-10 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full shadow-lg border hover:bg-purple-600 transition-colors"
      >
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Ads Slider - Shows/hides based on isExpanded */}
      <div
        className={`relative group transition-all duration-300 ${
          isExpanded ? "h-64 opacity-100" : "h-12 opacity-100"
        }`}
      >
        {/* Collapsed State - Clickable area */}
        {!isExpanded && (
          <div
            className="h-full flex items-center justify-center cursor-pointer"
            onClick={onToggle}
          >
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Click to view ads
            </div>
          </div>
        )}

        {/* Expanded State - Full ads content */}
        {isExpanded && (
          <>
            {/* Main Slider */}
            <div className="relative h-full overflow-hidden">
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
                      <p className="text-sm opacity-90 mb-4">
                        {ad.description}
                      </p>
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdsImageSlider;
