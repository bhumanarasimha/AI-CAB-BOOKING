import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Phone, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { updateEmergencyContacts } from '../../lib/firestore';

const EmergencyContacts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contacts, setContacts] = useState(user?.emergencyContacts || []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [sosModeActive, setSosModeActive] = useState(false);

  const isInitialLoadedRef = useRef(false);
  useEffect(() => {
    if (user?.emergencyContacts && !isInitialLoadedRef.current) {
      isInitialLoadedRef.current = true;
      setContacts(user.emergencyContacts);
    }
  }, [user?.emergencyContacts]);

  const syncToBackend = async (newContacts) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await updateEmergencyContacts(user.uid, newContacts);
    } catch (error) {
      console.error("Failed to sync contacts:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addContact = async () => {
    if (!newName || !newPhone) return;
    const newContact = {
      id: Date.now(),
      name: newName,
      phone: newPhone,
      relation: newRelation,
      avatar: newName[0].toUpperCase()
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    await syncToBackend(updated);
    setNewName(''); setNewPhone(''); setNewRelation('');
    setShowAdd(false);
  };

  const removeContact = async (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await syncToBackend(updated);
  };

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(239,68,68,0.08) 0%, transparent 100%)', padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
            <ArrowLeft size={18} color="#9CA3AF" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em' }}>Emergency Contacts</h1>
            <p style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '2px' }}>Shared during SOS alerts</p>
          </div>
        </div>
        {isSyncing && <Loader2 size={18} className="animate-spin" color="#EF4444" />}
      </div>

      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* SOS Toggle */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '20px', border: sosModeActive ? '1px solid rgba(239,68,68,0.4)' : undefined, background: sosModeActive ? 'rgba(239,68,68,0.05)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={22} color="#EF4444" />
              </div>
              <div>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F1F5F9' }}>SOS Auto-Share</p>
                <p style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '2px' }}>Share live location on emergency</p>
              </div>
            </div>
            {/* Toggle */}
            <div
              onClick={() => setSosModeActive(!sosModeActive)}
              style={{ width: '48px', height: '26px', borderRadius: '99px', background: sosModeActive ? '#EF4444' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s', boxShadow: sosModeActive ? '0 0 12px rgba(239,68,68,0.5)' : 'none' }}
            >
              <div style={{ position: 'absolute', top: '3px', left: sosModeActive ? '24px' : '3px', width: '20px', height: '20px', borderRadius: '99px', background: 'white', transition: 'left 0.25s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
        </motion.div>

        {/* Contact List */}
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Trusted Contacts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {contacts.length > 0 ? contacts.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  {c.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F1F5F9' }}>{c.name}</p>
                  <p style={{ fontSize: '0.76rem', color: '#4B5563', marginTop: '1px' }}>{c.relation} · {c.phone}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Phone size={14} color="#10B981" />
                  </button>
                  <button onClick={() => removeContact(c.id)} style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-ui)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No emergency contacts added yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Contact */}
        {showAdd ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '2px' }}>Add New Contact</p>
            <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="field" style={{ padding: '12px 14px', fontSize: '0.88rem' }} />
            <input placeholder="Phone" type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="field" style={{ padding: '12px 14px', fontSize: '0.88rem' }} />
            <input placeholder="Relation (e.g. Mom)" value={newRelation} onChange={e => setNewRelation(e.target.value)} className="field" style={{ padding: '12px 14px', fontSize: '0.88rem' }} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
              <button onClick={addContact} className="btn-primary" style={{ flex: 1, height: '42px' }}>Save</button>
            </div>
          </motion.div>
        ) : (
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', height: '48px', borderRadius: '14px', background: 'rgba(var(--brand-indigo-rgb), 0.06)', border: '1px dashed rgba(var(--brand-indigo-rgb), 0.25)', color: 'var(--brand-indigo)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
            <Plus size={18} /> Add Emergency Contact
          </button>
        )}
      </div>
    </div>
  );
};

export default EmergencyContacts;
