import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';

const Reviews = () => {
  const navigate = useNavigate();

  const reviews = [
    { driver: 'Amit K.', date: 'May 4, 2026', rating: 5, comment: 'Great ride! Driver was very polite and the car was extremely clean.' },
    { driver: 'Rahul S.', date: 'May 1, 2026', rating: 5, comment: 'Reached my destination exactly on time. Impressive.' },
    { driver: 'Suresh M.', date: 'Apr 28, 2026', rating: 4, comment: 'Good trip overall, slight traffic delay.' },
  ];

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '48px 20px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }}>
          <ArrowLeft size={18} color="var(--text-muted)" />
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Ratings & Reviews</h1>
      </div>
      
      <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto' }}>
        
        {/* Summary Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>4.92</p>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '6px' }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>42 Reviews</p>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[5,4,3,2,1].map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '8px' }}>{r}</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: r === 5 ? '85%' : r === 4 ? '15%' : '0%', height: '100%', background: '#F59E0B', borderRadius: '99px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>Recent Reviews</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((rev, i) => (
            <div key={i} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{rev.driver}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.date}</p>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(star => <Star key={star} size={14} fill={star <= rev.rating ? "#F59E0B" : "transparent"} color={star <= rev.rating ? "#F59E0B" : "var(--bg-elevated)"} />)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <MessageSquare size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>"{rev.comment}"</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Reviews;
