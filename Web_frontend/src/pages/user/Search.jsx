import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Star, X, Search as SearchIcon, Loader2 } from 'lucide-react';

const recentPlaces = [
  { name: 'T. Nagar (Thyagaraya Nagar)', address: 'Chennai, Tamil Nadu', type: 'recent' },
  { name: 'Marina Beach', address: 'Kamarajar Salai, Chennai', type: 'recent' },
  { name: 'Phoenix Marketcity Chennai', address: 'Velachery Rd, Indira Gandhi Nagar', type: 'recent' },
];

// Fallback static suggestions if Google Maps isn't loaded
const staticFallback = [
  { name: 'Chennai Central Railway Station', address: 'Kannappar Thidal, Periamet', rating: 4.5 },
  { name: 'Besant Nagar Beach', address: 'Adyar, Chennai', rating: 4.7 },
  { name: 'Adyar Ananda Bhavan', address: 'MG Road, Adyar, Chennai', rating: 4.4 },
  { name: 'Express Avenue Mall', address: 'Pattullos Rd, Royapettah', rating: 4.6 },
  { name: 'Koyambedu Bus Terminus', address: 'Koyambedu, Chennai', rating: 4.2 },
  { name: 'VGP Universal Kingdom', address: 'East Coast Rd, Injambakkam', rating: 4.3 },
  { name: 'Anna University', address: 'Sardar Patel Rd, Guindy', rating: 4.5 },
  { name: 'Guindy National Park', address: 'Guindy, Chennai', rating: 4.4 },
  { name: 'Semmozhi Poonga', address: 'Cathedral Rd, Teynampet', rating: 4.5 },
  { name: 'Kapaleeshwarar Temple', address: 'Mylapore, Chennai', rating: 4.8 },
  { name: "Elliot's Beach", address: 'Besant Nagar, Chennai', rating: 4.7 },
];

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);
  const autocompleteService = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    // Poll until Google Maps Places API is ready (async script injection)
    let attempts = 0;
    const tryInit = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      } else if (++attempts < 100) {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();
  }, []);

  const fetchLiveSuggestions = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);

    // Use Google Places Autocomplete if available
    if (autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'in' },
          types: ['establishment', 'geocode'],
        },
        (predictions, status) => {
          setIsLoadingSuggestions(false);
          if (status === 'OK' && predictions) {
            setSuggestions(
              predictions.map((p) => ({
                name: p.structured_formatting.main_text,
                address: p.structured_formatting.secondary_text || '',
                placeId: p.place_id,
                rating: null, // Live results don't have pre-fetched ratings
              }))
            );
          } else {
            setSuggestions([]);
          }
        }
      );
    } else {
      // Fallback: filter static list if Google Maps isn't available
      setIsLoadingSuggestions(false);
      setSuggestions(
        staticFallback.filter((s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, []);

  // Debounce query changes to avoid spamming API
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    if (query.length === 0) {
      setTimeout(() => {
        setSuggestions(prev => prev.length > 0 ? [] : prev);
        setIsLoadingSuggestions(prev => prev ? false : prev);
      }, 0);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      fetchLiveSuggestions(query);
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [query, fetchLiveSuggestions]);

  const handleSelect = (placeName) => {
    navigate('/user/ride-comparison', { state: { dropoff: placeName } });
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Search Header */}
      <div style={{ padding: '48px 20px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={18} color="var(--text-muted)" />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              <SearchIcon size={18} color="var(--brand-cyan)" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where do you want to go?"
              className="field"
              style={{ padding: '14px 44px 14px 46px', fontSize: '0.95rem' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-elevated)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} color="var(--text-muted)" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="no-scrollbar">
        {query.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <button
                onClick={() => navigate('/user/map-picker')}
                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ padding: '10px', background: 'rgba(var(--brand-cyan-rgb), 0.1)', borderRadius: '12px' }}>
                  <MapPin size={20} color="var(--brand-cyan)" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Set on Map</span>
              </button>
              <button
                onClick={() => navigate('/user/saved-places')}
                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ padding: '10px', background: 'rgba(var(--brand-indigo-rgb), 0.1)', borderRadius: '12px' }}>
                  <Star size={20} color="var(--brand-indigo)" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Saved</span>
              </button>
            </div>

            {/* Recent Places */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recent Places</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--brand-cyan)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Clear All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentPlaces.map((place, i) => (
                <motion.button
                  key={i}
                  whileHover={{ background: 'var(--bg-elevated)', x: 4 }}
                  onClick={() => handleSelect(place.name)}
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={18} color="var(--text-muted)" />
                  </div>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--border-ui)', paddingBottom: '12px' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>{place.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{place.address}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Loading State */}
            {isLoadingSuggestions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Loader2 size={18} color="var(--brand-cyan)" className="animate-spin" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '14px', width: `${60 + i * 10}%`, background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '8px' }} />
                      <div style={{ height: '10px', width: '40%', background: 'var(--bg-card)', borderRadius: '6px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {suggestions.map((place, i) => (
                  <motion.button
                    key={place.placeId || i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleSelect(place.name)}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--brand-cyan-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} color="var(--brand-cyan)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{place.name}</p>
                        {place.rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{place.rating}</span>
                          </div>
                        )}
                      </div>
                      {place.address && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{place.address}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <SearchIcon size={32} color="var(--text-muted)" />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No places found for "{query}"</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '6px', opacity: 0.6 }}>Try a different search term or use the map picker</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Search;
