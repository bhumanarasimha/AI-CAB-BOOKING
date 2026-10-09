import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronRight, Search, Star, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_FAMOUS_PLACES = [
  {
    name: 'Lalbagh Botanical Garden',
    category: 'Nature & Heritage',
    distance: '3.2 km',
    rating: 4.7,
    reviews: '12.4k',
    eta: '9 min',
    emoji: '🌿',
    accent: '#10B981',
    tag: 'Trending',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80',
  },
  {
    name: 'Cubbon Park',
    category: 'Landmark · Park',
    distance: '5.8 km',
    rating: 4.5,
    reviews: '9.1k',
    eta: '14 min',
    emoji: '🌳',
    accent: '#22C55E',
    tag: null,
    image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&q=80',
  },
  {
    name: 'UB City Mall',
    category: 'Luxury Shopping',
    distance: '6.1 km',
    rating: 4.6,
    reviews: '18.2k',
    eta: '16 min',
    emoji: '🛍️',
    accent: '#F59E0B',
    tag: 'Popular',
    image: 'https://images.unsplash.com/photo-1567449303078-57ad995bd17f?w=400&q=80',
  },
  {
    name: 'ISKCON Temple',
    category: 'Spiritual · Temple',
    distance: '8.4 km',
    rating: 4.8,
    reviews: '21.7k',
    eta: '20 min',
    emoji: '🛕',
    accent: '#F97316',
    tag: null,
    image: 'https://images.unsplash.com/photo-1609942072359-e5c6f9aeaed3?w=400&q=80',
  },
  {
    name: 'Forum Mall',
    category: 'Shopping · Food',
    distance: '9.2 km',
    rating: 4.3,
    reviews: '7.8k',
    eta: '22 min',
    emoji: '🏬',
    accent: '#8B5CF6',
    tag: null,
    image: 'https://images.unsplash.com/photo-1519566335946-e6f65f0f4fdf?w=400&q=80',
  },
  {
    name: 'Bangalore Palace',
    category: 'Royal Heritage',
    distance: '10.5 km',
    rating: 4.4,
    reviews: '15.3k',
    eta: '26 min',
    emoji: '🏰',
    accent: '#F59E0B',
    tag: 'Must Visit',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  },
  {
    name: 'Commercial Street',
    category: 'Street Shopping',
    distance: '12.1 km',
    rating: 4.2,
    reviews: '6.5k',
    eta: '28 min',
    emoji: '🧵',
    accent: '#EC4899',
    tag: null,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&q=80',
  },
  {
    name: 'Wonderla Amusement Park',
    category: 'Entertainment',
    distance: '18.7 km',
    rating: 4.6,
    reviews: '31.2k',
    eta: '42 min',
    emoji: '🎢',
    accent: '#06B6D4',
    tag: 'Weekend Fun',
    image: 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=400&q=80',
  },
  {
    name: 'Art of Living Center',
    category: 'Spiritual Retreat',
    distance: '21.3 km',
    rating: 4.7,
    reviews: '14.5k',
    eta: '45 min',
    emoji: '🧘',
    accent: '#8B5CF6',
    tag: 'Peaceful',
    image: 'https://images.unsplash.com/photo-1593693397690-362bb9a1596b?w=400&q=80',
  },
  {
    name: 'Bannerghatta National Park',
    category: 'Wildlife & Nature',
    distance: '22.5 km',
    rating: 4.4,
    reviews: '28.9k',
    eta: '50 min',
    emoji: '🦁',
    accent: '#22C55E',
    tag: 'Adventure',
    image: 'https://images.unsplash.com/photo-1564500645607-06bdcb9cf413?w=400&q=80',
  },
  {
    name: 'Innovative Film City',
    category: 'Theme Park',
    distance: '25.1 km',
    rating: 4.1,
    reviews: '11.2k',
    eta: '55 min',
    emoji: '🎬',
    accent: '#EC4899',
    tag: null,
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
  },
  {
    name: 'Nandi Hills',
    category: 'Hill Station',
    distance: '28.4 km',
    rating: 4.8,
    reviews: '45.1k',
    eta: '1h 10m',
    emoji: '⛰️',
    accent: '#3B82F6',
    tag: 'Sunrise View',
    image: 'https://images.unsplash.com/photo-1563228394-4d872138b32d?w=400&q=80',
  }
];

const FamousPlaces = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredPlaces = ALL_FAMOUS_PLACES.filter(place => 
    place.name.toLowerCase().includes(search.toLowerCase()) ||
    place.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', position: 'relative' }}>
      
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-ui)',
        padding: '48px 20px 16px', display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
            <ArrowLeft size={18} color="var(--text-muted)" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Famous Places
              <span style={{ background: 'var(--brand-cyan)', color: 'var(--bg-base)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '99px' }}>
                30 KM RADIUS
              </span>
            </h1>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#6B7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search places or categories..." 
            className="field"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '0.9rem', borderRadius: '14px' }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="no-scrollbar">
        <AnimatePresence>
          {filteredPlaces.map((place, idx) => (
            <motion.div 
              key={place.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate('/user/ride-comparison', { state: { dropoff: place.name } })}
              className="card"
              style={{
                display: 'flex', overflow: 'hidden', padding: '12px', gap: '14px', alignItems: 'center', cursor: 'pointer', flexShrink: 0
              }}
            >
              <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={place.image} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8))' }} />
                <div style={{ position: 'absolute', bottom: '6px', left: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white' }}>{place.rating}</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.9rem' }}>{place.emoji}</span>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: place.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {place.category}
                  </p>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>{place.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {place.distance}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass size={12} /> Est. {place.eta}
                  </span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', width: '32px', height: '32px', borderRadius: '99px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPlaces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>No places found</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Try a different search term.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FamousPlaces;
