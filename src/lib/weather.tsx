import React, { useState, useEffect, createContext, useContext } from "react";

export interface WeatherData {
  tempMin?: number;
  tempMax?: number;
  probPrec?: number;
  windSpeed?: number;
  weathercode?: number;
}

export interface HourlyWeatherData {
  temp?: number;
  weathercode?: number;
}

export interface GlobalWeather {
  daily: Record<string, WeatherData>; // YYYY-MM-DD -> data
  hourly: Record<string, HourlyWeatherData>; // YYYY-MM-DDTHH:00 -> data
  loading: boolean;
  error?: string;
}

const geocodeCachêêe: Record<string, { lat: number; lon: number }> = {};

export async function geocodeCity(city: string) {
  if (!city) return null;
  const cleaned = city.split(",")[0].trim();
  if (geocodeCachêêe[cleaned]) return geocodeCachêêe[cleaned];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleaned)}&count=1&language=pt&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const loc = { lat: data.results[0].latitude, lon: data.results[0].longitude };
      geocodeCachêêe[cleaned] = loc;
      return loc;
    }
  } catch (e) {
    console.error("Geocode error", e);
  }
  return null;
}

export const WeatherContext = createContext<GlobalWeather>({ daily: {}, hourly: {}, loading: false });

export function useGlobalWeatherContext() {
  return useContext(WeatherContext);
}

export function WeatherProvider({ city, programacao, children }: { city: string | undefined | null; programacao: any; children: React.ReactNode }) {
  const [weather, setWeather] = useState<GlobalWeather>({ daily: {}, hourly: {}, loading: false });

  useEffect(() => {
    if (!city || !programacao) return;
    const dates = Object.keys(programacao).sort();
    if (dates.length === 0) return;

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    let isMounted = true;

    async function fetchWeather() {
      setWeather(prev => ({ ...prev, loading: true }));
      const coords = await geocodeCity(city!);
      if (!coords) {
        if (isMounted) setWeather(prev => ({ ...prev, loading: false, error: "City not found" }));
        return;
      }

      try {
        const today = new Date().toISOString().split("T")[0];
        let dailyForecast: any = null;
        let hourlyForecast: any = null;
        let dailyArchive: any = null;
        let hourlyArchive: any = null;

        if (endDate >= today) {
          const start = startDate >= today ? startDate : today;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weathercode&hourly=temperature_2m,weathercode&timezone=auto&start_date=${start}&end_date=${endDate}`;
          const res = await fetch(url);
          const data = await res.json();
          dailyForecast = data.daily;
          hourlyForecast = data.hourly;
        }

        if (startDate < today) {
          const end = endDate < today ? endDate : new Date(Date.now() - 86400000).toISOString().split("T")[0]; // yesterday
          const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&hourly=temperature_2m,weathercode&timezone=auto&start_date=${startDate}&end_date=${end}`;
          const res = await fetch(url);
          const data = await res.json();
          dailyArchive = data.daily;
          hourlyArchive = data.hourly;
        }

        const newDaily: Record<string, WeatherData> = {};
        const newHourly: Record<string, HourlyWeatherData> = {};

        if (dailyArchive && dailyArchive.time) {
          for (let i = 0; i < dailyArchive.time.length; i++) {
            newDaily[dailyArchive.time[i]] = {
              tempMax: dailyArchive.temperature_2m_max?.[i],
              tempMin: dailyArchive.temperature_2m_min?.[i],
              weathercode: dailyArchive.weathercode?.[i],
              probPrec: dailyArchive.precipitation_sum?.[i] ? 100 : 0
            };
          }
        }

        if (dailyForecast && dailyForecast.time) {
          for (let i = 0; i < dailyForecast.time.length; i++) {
            newDaily[dailyForecast.time[i]] = {
              tempMax: dailyForecast.temperature_2m_max?.[i],
              tempMin: dailyForecast.temperature_2m_min?.[i],
              weathercode: dailyForecast.weathercode?.[i],
              probPrec: dailyForecast.precipitation_probability_max?.[i],
              windSpeed: dailyForecast.wind_speed_10m_max?.[i]
            };
          }
        }

        if (hourlyArchive && hourlyArchive.time) {
          for (let i = 0; i < hourlyArchive.time.length; i++) {
            newHourly[hourlyArchive.time[i]] = {
              temp: hourlyArchive.temperature_2m?.[i],
              weathercode: hourlyArchive.weathercode?.[i]
            };
          }
        }

        if (hourlyForecast && hourlyForecast.time) {
          for (let i = 0; i < hourlyForecast.time.length; i++) {
            newHourly[hourlyForecast.time[i]] = {
              temp: hourlyForecast.temperature_2m?.[i],
              weathercode: hourlyForecast.weathercode?.[i]
            };
          }
        }

        if (isMounted) {
          setWeather({ daily: newDaily, hourly: newHourly, loading: false });
        }
      } catch (e) {
        console.error("Weather fetch error", e);
        if (isMounted) {
          setWeather(prev => ({ ...prev, loading: false, error: String(e) }));
        }
      }
    }

    fetchWeather();

    return () => { isMounted = false; };
  }, [city, programacao]);

  return <WeatherContext.Provider value={weather}>{children}</WeatherContext.Provider>;
}

export function getWeatherIcon(code?: number, timeOfDay: "day" | "night" = "day") {
  if (code === undefined) return "☁️";
  if (code === 0) return timeOfDay === "day" ? "☀️" : "🌙";
  if (code === 1) return timeOfDay === "day" ? "🌤️" : "☁️";
  if (code === 2) return timeOfDay === "day" ? "⛅" : "☁️";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌧️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "☁️";
}
