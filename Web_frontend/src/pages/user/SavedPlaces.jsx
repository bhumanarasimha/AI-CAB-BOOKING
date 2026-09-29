import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Briefcase, MapPin, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { updateSavedPlaces } from '../../lib/firestore';

const initialPlaces = [
  { id: 'home', type: 'Home', address: 'Block C, Silver Oak Apartments, Sector 4', icon: 'Home', color: 'var(--brand-cyan)' },
  { id: 'work', type: 'Work', address: 'Tech Park, Building 9, Cyber City', icon: 'Briefcase', color: 'var(--brand-indigo)' },
];

const iconMap = {
  Home,
  Briefcase,
  MapPin
};

const addressSuggestions = [
  "Block C, Silver Oak Apartments, Sector 4",
  "Tech Park, Building 9, Cyber City",
  "FitPro Arena, Downtown",
  "Airport Terminal 2, International",
  "Central Mall, Main Street",
  "Blue Ridge Towers, Phase 1",
  "Sunshine Cafe, 5th Avenue",
  "Metro Station, Sector 18",
  "Green Valley Residency, Block A",
  "Global Tech Hub, Ring Road",
  "City Hospital, Main Blvd",
  "Grand Hotel, Downtown"
];

const AddressAutocomplete = ({ value, onChange, placeholder }) => {
  const [focused, setFocused] = useState(false);
  
  const suggestions = value.length >= 2 
    ? addressSuggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value)
    : [];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        className="field" 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
      />
      {focused && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', borderRadius: '12px', zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {suggestions.map((s, i) => (
            <div 
              key={s} 
              onClick={() => { onChange(s); setFocused(false); }}
              style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-main)', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-ui)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MapPin size={14} color="var(--text-muted)" /> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SavedPlaces = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [places, setPlaces] = useState(user?.savedPlaces || initialPlaces);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const isInitialLoadedRef = useRef(false);
  useEffect(() => {
    if (user?.savedPlaces && user.savedPlaces.length > 0 && !isInitialLoadedRef.current) {
      isInitialLoadedRef.current = true;
      setPlaces(user.savedPlaces);
    }
  }, [user?.savedPlaces]);

  const syncToBackend = async (newPlaces) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await updateSavedPlaces(user.uid, newPlaces);
    } catch (error) {
      console.error("Failed to sync places:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newAddress.trim()) return;
    const newPlace = {
      id: `custom_${Date.now()}`,
      type: newTitle,
      address: newAddress,
      icon: 'MapPin',
      color: '#F59E0B'
    };
    const updated = [...places, newPlace];
    setPlaces(updated);
    await syncToBackend(updated);
    setNewTitle('');
    setNewAddress('');
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    const updated = places.filter(p => p.id !== id);
    setPlaces(updated);
    await syncToBackend(updated);
  };

  const handleEditStart = (place) => {
    setEditingId(place.id);
    setEditTitle(place.type);
    setEditAddress(place.address);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim() || !editAddress.trim()) return;
    const updated = places.map(p => p.id === editingId ? { ...p, type: editTitle, address: editAddress } : p);
    setPlaces(updated);
    await syncToBackend(updated);
    setEditingId(null);
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
            <ArrowLeft size={18} color="var(--text-muted)" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Saved Places</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Manage your default addresses</p>
          </div>
        </div>
        {isSyncing && <Loader2 size={18} className="animate-spin" color="var(--brand-cyan)" />}
      </div>

      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Places List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {places.map((place, i) => {
            const Icon = iconMap[place.icon] || MapPin;
            return (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                className="card"
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                {editingId === place.id ? (
                  <>
                    <input 
                      className="field" 
                      placeholder="Title" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
                    />
                    <AddressAutocomplete 
                      placeholder="Address" 
                      value={editAddress} 
                      onChange={setEditAddress} 
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg-elevated)', color: 'var(--text-main)', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <X size={14} /> Cancel
                      </button>
                      <button onClick={handleEditSave} className="btn-cyan" style={{ flex: 1, padding: '8px', borderRadius: '8px', color: 'var(--text-inverse)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Check size={14} /> Save
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color={place.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{place.type}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{place.address}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleEditStart(place)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                        <Edit2 size={14} color="var(--text-muted)" />
                      </button>
                      <button onClick={() => handleDelete(place.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={14} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Add New Form / Button */}
        {showAddForm ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>New Address</h3>
            <input 
              className="field" 
              placeholder="Title (e.g. Gym, Cafe)" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
            />
            <AddressAutocomplete 
              placeholder="Full Address" 
              value={newAddress} 
              onChange={setNewAddress} 
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--bg-elevated)', color: 'var(--text-main)', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <X size={16} /> Cancel
              </button>
              <button onClick={handleAdd} className="btn-cyan" style={{ flex: 1, padding: '12px', borderRadius: '10px', color: 'var(--text-inverse)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Check size={16} /> Save Place
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            onClick={() => setShowAddForm(true)}
            className="card"
            style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: '1px dashed var(--brand-cyan)', background: 'rgba(var(--brand-cyan-rgb), 0.05)' }}
          >
            <Plus size={18} color="var(--brand-cyan)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--brand-cyan)' }}>Add New Address</span>
          </motion.button>
        )}
        
        {/* Info Box */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '12px', marginTop: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Saving your Home and Work addresses speeds up ride booking and improves AI route recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SavedPlaces;
