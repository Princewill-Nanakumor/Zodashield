"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type DateTimeFormat = "24h" | "12h";
type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
type DateTimeSettings = {
  timeFormat: DateTimeFormat;
  dateFormat: DateFormat;
  timezone: string;
  setTimeFormat: (f: DateTimeFormat) => void;
  setDateFormat: (f: DateFormat) => void;
  setTimezone: (tz: string) => void;
};

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const DateTimeSettingsContext = createContext<DateTimeSettings>({
  timeFormat: "12h",
  dateFormat: "DD/MM/YYYY",
  timezone: defaultTimezone,
  setTimeFormat: () => {},
  setDateFormat: () => {},
  setTimezone: () => {},
});

export function useDateTimeSettings() {
  return useContext(DateTimeSettingsContext);
}

export function DateTimeSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [timeFormat, setTimeFormat] = useState<DateTimeFormat>("12h"); // Default to AM/PM
  const [dateFormat, setDateFormat] = useState<DateFormat>("DD/MM/YYYY"); // Default to DD/MM/YYYY
  const [timezone, setTimezone] = useState<string>(defaultTimezone);

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tf = localStorage.getItem("timeFormat");
      const df = localStorage.getItem("dateFormat");
      const tz = localStorage.getItem("timezone");
      if (tf === "12h" || tf === "24h") setTimeFormat(tf);
      if (df === "YYYY-MM-DD" || df === "DD/MM/YYYY" || df === "MM/DD/YYYY")
        setDateFormat(df);
      if (tz) setTimezone(tz);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("timeFormat", timeFormat);
      localStorage.setItem("dateFormat", dateFormat);
      localStorage.setItem("timezone", timezone);
    }
  }, [timeFormat, dateFormat, timezone]);

  return (
    <DateTimeSettingsContext.Provider
      value={{
        timeFormat,
        dateFormat,
        timezone,
        setTimeFormat,
        setDateFormat,
        setTimezone,
      }}
    >
      {children}
    </DateTimeSettingsContext.Provider>
  );
}
