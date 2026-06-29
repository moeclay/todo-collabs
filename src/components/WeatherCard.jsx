import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";

import CenterModal from "./CenterModal.jsx";

const DEFAULT_LOCATION = {
  latitude: -6.595,
  longitude: 106.8167,
  city: "Bogor",
};

async function fetchWeatherData(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m",
  );
  url.searchParams.set("timezone", "Asia/Jakarta");
  url.searchParams.set("wind_speed_unit", "kmh");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather request failed");

  const data = await response.json();
  return {
    temp: Math.round(data.current.temperature_2m),
    humidity: Math.round(data.current.relative_humidity_2m),
    wind: Math.round(data.current.wind_speed_10m),
  };
}

async function fetchCityName(latitude, longitude) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Geocode request failed");

  const data = await response.json();
  return (
    data.address?.city ||
    data.address?.town ||
    data.address?.county ||
    data.address?.state ||
    DEFAULT_LOCATION.city
  );
}

async function searchCities(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "id");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error("City search failed");

  const data = await response.json();
  return (data.results ?? []).map((result) => ({
    id: `${result.latitude}-${result.longitude}`,
    name: result.name,
    region: result.admin1,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 5000,
      maximumAge: 300000,
    });
  });
}

function formatCityLabel(name, region) {
  return region ? `${name}, ${region}` : name;
}

export default function WeatherCard() {
  const [open, setOpen] = useState(false);
  const [weather, setWeather] = useState({
    temp: null,
    humidity: null,
    wind: null,
    city: DEFAULT_LOCATION.city,
    loading: true,
    error: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const loadWeather = useCallback(async (latitude, longitude, city) => {
    setWeather((prev) => ({ ...prev, loading: true, error: false }));

    try {
      const data = await fetchWeatherData(latitude, longitude);
      setWeather({
        temp: data.temp,
        humidity: data.humidity,
        wind: data.wind,
        city,
        loading: false,
        error: false,
      });
    } catch {
      setWeather((prev) => ({
        ...prev,
        loading: false,
        error: true,
      }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initWeather() {
      let latitude = DEFAULT_LOCATION.latitude;
      let longitude = DEFAULT_LOCATION.longitude;
      let city = DEFAULT_LOCATION.city;

      try {
        const position = await getLocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        city = await fetchCityName(latitude, longitude);
      } catch {
        // Pakai lokasi default (Bogor) jika geolocation ditolak atau gagal.
      }

      if (cancelled) return;

      await loadWeather(latitude, longitude, city);
    }

    initWeather();
    return () => {
      cancelled = true;
    };
  }, [loadWeather]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError("Ketik minimal 2 karakter.");
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const results = await searchCities(query);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("Kota tidak ditemukan.");
      }
    } catch {
      setSearchResults([]);
      setSearchError("Gagal mencari kota.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCity = async (result) => {
    const city = formatCityLabel(result.name, result.region);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    await loadWeather(result.latitude, result.longitude, city);
  };

  return (
    <div className="weather-card shrink-0">
      <button
        type="button"
        className="weather-card__trigger flex h-20 w-20 md:h-20 md:w-20 flex-col items-center justify-center rounded-xl border border-white/60 bg-white/70 text-center shadow-xl shadow-indigo-500/15 backdrop-blur-md transition hover:bg-white/90 dark:border-slate-600/60 dark:bg-slate-800/80 dark:shadow-black/30 dark:hover:bg-slate-700/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        aria-label={
          weather.temp !== null
            ? `Cuaca hari ini ${weather.temp} derajat Celcius di ${weather.city}`
            : `Cuaca hari ini di ${weather.city}`
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {weather.loading ? (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-300">...</span>
        ) : (
          <>
            <span className="text-2xl font-bold leading-none text-slate-800 dark:text-slate-100">
              {weather.temp !== null ? `${weather.temp}°` : "--"}
            </span>
            <span className="mt-1 line-clamp-2 px-1 text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-300">
              {weather.city}
            </span>
          </>
        )}
      </button>

      <CenterModal
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={`Informasi cuaca ${weather.city}`}
        className="max-w-sm"
      >
        <div className="weather-card__summary mb-4 text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{weather.city}</p>
            {weather.loading ? (
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-400">Memuat...</p>
            ) : weather.error ? (
              <p className="mt-2 text-sm text-rose-500 dark:text-rose-400">Gagal memuat cuaca.</p>
            ) : (
              <>
                <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {weather.temp}°C
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-left text-sm">
                  <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Kelembaban</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {weather.humidity}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Angin</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {weather.wind} km/j
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <form
            className="weather-card__search flex gap-2"
            onSubmit={handleSearch}
          >
            <input
              type="text"
              className="min-h-9 flex-1 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35"
              placeholder="Cari kota..."
              value={searchQuery}
              aria-label="Cari kota"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-500 px-3 text-white transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={searching}
              aria-label="Cari"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </form>

          {searchError && (
            <p className="mt-2 text-xs text-rose-500">{searchError}</p>
          )}

          {searchResults.length > 0 && (
            <ul className="weather-card__results mt-2 max-h-40 space-y-1 overflow-y-auto scrollbar-hide">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => handleSelectCity(result)}
                  >
                    <span className="font-medium">{result.name}</span>
                    {(result.region || result.country) && (
                      <span className="block text-xs text-slate-500">
                        {[result.region, result.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
      </CenterModal>
    </div>
  );
}
