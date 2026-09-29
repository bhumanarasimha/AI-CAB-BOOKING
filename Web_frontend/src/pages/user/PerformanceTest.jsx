import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Play, Square, Activity, CheckCircle2, 
  XCircle, Clock, Settings, Gauge, AlertCircle, BarChart2
} from 'lucide-react';
import { api } from '../../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceTest = () => {
  const navigate = useNavigate();
  
  // Test parameters
  const [concurrency, setConcurrency] = useState(100);
  const [duration, setDuration] = useState(60); // in seconds
  const [testType, setTestType] = useState('simulated'); // 'simulated' | 'firestore' | 'custom'
  const [customUrl, setCustomUrl] = useState('http://localhost:3000/api/ride-estimate');
  
  // Test execution state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [vuStates, setVuStates] = useState(() => Array(100).fill('idle'));
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalSent: 0,
    successCount: 0,
    errorCount: 0,
    minLatency: 0,
    maxLatency: 0,
    avgLatency: 0,
    currentRps: 0,
    p50: 0,
    p90: 0,
    p99: 0
  });

  // Chart data
  const [chartData, setChartData] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('perf_test_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Refs for tracking mutable values across threads
  const isRunningRef = useRef(false);
  const latenciesRef = useRef([]);
  const totalSentRef = useRef(0);
  const successCountRef = useRef(0);
  const errorCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const requestHistoryRef = useRef([]); // tracks timestamp of each request for sliding RPS

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTest = () => {
    if (isRunning) return;

    setIsRunning(true);
    isRunningRef.current = true;
    setElapsedTime(0);
    
    // Reset counters
    latenciesRef.current = [];
    totalSentRef.current = 0;
    successCountRef.current = 0;
    errorCountRef.current = 0;
    requestHistoryRef.current = [];
    // eslint-disable-next-line react-hooks/purity
    startTimeRef.current = Date.now();
    
    setMetrics({
      totalSent: 0,
      successCount: 0,
      errorCount: 0,
      minLatency: 0,
      maxLatency: 0,
      avgLatency: 0,
      currentRps: 0,
      p50: 0,
      p90: 0,
      p99: 0
    });
    setChartData([]);
    
    // Initialize VU states grid
    const initialVus = Array(concurrency).fill('idle');
    setVuStates(initialVus);

    // Start virtual users
    for (let i = 0; i < concurrency; i++) {
      runVirtualUser(i);
    }

    // Start timer and metrics consolidator
    let seconds = 0;
    intervalRef.current = setInterval(() => {
      seconds += 1;
      setElapsedTime(seconds);

      // Consolidate metrics
      const now = Date.now();
      
      // Calculate sliding window RPS (requests in the last 2 seconds)
      const recentRequests = requestHistoryRef.current.filter(t => now - t < 2000);
      const currentRps = Math.round(recentRequests.length / 2);
      
      // Calculate overall latency stats
      const latencies = [...latenciesRef.current].sort((a, b) => a - b);
      const count = latencies.length;
      
      let avg = 0;
      let min = 0;
      let max = 0;
      let p50 = 0;
      let p90 = 0;
      let p99 = 0;

      if (count > 0) {
        const sum = latencies.reduce((a, b) => a + b, 0);
        avg = Math.round(sum / count);
        min = Math.round(latencies[0]);
        max = Math.round(latencies[count - 1]);
        p50 = Math.round(latencies[Math.floor(count * 0.5)]);
        p90 = Math.round(latencies[Math.floor(count * 0.9)] || latencies[count - 1]);
        p99 = Math.round(latencies[Math.floor(count * 0.99)] || latencies[count - 1]);
      }

      setMetrics({
        totalSent: totalSentRef.current,
        successCount: successCountRef.current,
        errorCount: errorCountRef.current,
        minLatency: min,
        maxLatency: max,
        avgLatency: avg,
        currentRps,
        p50,
        p90,
        p99
      });

      // Add to chart data
      setChartData(prev => [
        ...prev,
        {
          second: `${seconds}s`,
          RPS: currentRps,
          Latency: avg
        }
      ]);

      // Clean request history to avoid memory bloat
      requestHistoryRef.current = requestHistoryRef.current.filter(t => now - t < 10000);

      // Check if duration met
      if (seconds >= duration) {
        stopTest(true);
      }
    }, 1000);
  };

  const stopTest = (completed = false) => {
    if (!isRunningRef.current) return;
    
    isRunningRef.current = false;
    setIsRunning(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setVuStates(prev => prev.map(() => 'idle'));

    // Save report to history
    if (completed && latenciesRef.current.length > 0) {
      const latencies = [...latenciesRef.current].sort((a, b) => a - b);
      const count = latencies.length;
      const sum = latencies.reduce((a, b) => a + b, 0);
      
      const finalReport = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        type: testType,
        vus: concurrency,
        duration: duration,
        totalRequests: totalSentRef.current,
        successRate: totalSentRef.current > 0 ? ((successCountRef.current / totalSentRef.current) * 100).toFixed(1) : '0.0',
        rps: (totalSentRef.current / duration).toFixed(1),
        avgLatency: Math.round(sum / count),
        minLatency: Math.round(latencies[0]),
        maxLatency: Math.round(latencies[count - 1]),
        p95: Math.round(latencies[Math.floor(count * 0.95)] || latencies[count - 1])
      };

      setHistory(prev => {
        const updated = [finalReport, ...prev].slice(0, 10);
        localStorage.setItem('perf_test_history', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const runVirtualUser = async (vuIndex) => {
    while (isRunningRef.current) {
      // 1. Mark VU active
      setVuStates(prev => {
        const copy = [...prev];
        copy[vuIndex] = 'loading';
        return copy;
      });

      totalSentRef.current += 1;
      const reqStart = performance.now();
      requestHistoryRef.current.push(Date.now());

      let isSuccess = false;

      try {
        if (testType === 'simulated') {
          // Weighted latency simulation
          // ~70% 50-250ms, ~25% 250-600ms, ~5% 600-1500ms
          const rand = Math.random();
          let latency = 0;
          if (rand < 0.70) {
            latency = Math.floor(50 + Math.random() * 200); // 50 - 250ms
          } else if (rand < 0.95) {
            latency = Math.floor(250 + Math.random() * 350); // 250 - 600ms
          } else {
            latency = Math.floor(600 + Math.random() * 900); // 600 - 1500ms
          }
          
          await new Promise(resolve => setTimeout(resolve, latency));
          
          // 1.5% chance of error
          isSuccess = Math.random() > 0.015;
        } 
        else if (testType === 'firestore') {
          // Real MongoDB write performance test
          await api.telemetry.logPerformance({
            vuIndex,
            timestamp: Date.now(),
            value: Math.random()
          });
          isSuccess = true;
        } 
        else if (testType === 'custom') {
          // Custom HTTP endpoint test
          const response = await fetch(customUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors'
          });
          isSuccess = response.ok;
        }
      } catch (err) {
        console.error(`VU ${vuIndex} Request Failed:`, err);
        isSuccess = false;
      }

      const reqDuration = performance.now() - reqStart;
      latenciesRef.current.push(reqDuration);

      if (isSuccess) {
        successCountRef.current += 1;
        setVuStates(prev => {
          const copy = [...prev];
          copy[vuIndex] = 'success';
          return copy;
        });
      } else {
        errorCountRef.current += 1;
        setVuStates(prev => {
          const copy = [...prev];
          copy[vuIndex] = 'error';
          return copy;
        });
      }

      // Small delay between requests to yield UI thread and simulate pacing
      const paceDelay = Math.floor(30 + Math.random() * 50); // 30 - 80ms
      await new Promise(resolve => setTimeout(resolve, paceDelay));
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('perf_test_history');
    setHistory([]);
  };

  const progressPercentage = (elapsedTime / duration) * 100;

  return (
    <div style={{ height: '100%', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon" style={{ width: '38px', height: '38px' }} disabled={isRunning}>
          <ArrowLeft size={18} color="var(--text-muted)" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Performance Benchmarking</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Test API latency and throughput under concurrent loads</p>
        </div>
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Controls Card */}
        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Settings size={18} color="var(--brand-indigo)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Test Parameters</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Test Type Selection */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Test Target</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <button 
                  onClick={() => setTestType('simulated')} 
                  disabled={isRunning}
                  style={{
                    padding: '10px', borderRadius: '8px', border: `1px solid ${testType === 'simulated' ? 'var(--brand-cyan)' : 'var(--border-ui)'}`,
                    background: testType === 'simulated' ? 'rgba(0, 216, 255, 0.08)' : 'var(--bg-card)',
                    color: testType === 'simulated' ? 'var(--brand-cyan)' : 'var(--text-main)',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Simulated API
                </button>
                <button 
                  onClick={() => setTestType('firestore')} 
                  disabled={isRunning}
                  style={{
                    padding: '10px', borderRadius: '8px', border: `1px solid ${testType === 'firestore' ? 'var(--brand-cyan)' : 'var(--border-ui)'}`,
                    background: testType === 'firestore' ? 'rgba(0, 216, 255, 0.08)' : 'var(--bg-card)',
                    color: testType === 'firestore' ? 'var(--brand-cyan)' : 'var(--text-main)',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  MongoDB
                </button>
                <button 
                  onClick={() => setTestType('custom')} 
                  disabled={isRunning}
                  style={{
                    padding: '10px', borderRadius: '8px', border: `1px solid ${testType === 'custom' ? 'var(--brand-cyan)' : 'var(--border-ui)'}`,
                    background: testType === 'custom' ? 'rgba(0, 216, 255, 0.08)' : 'var(--bg-card)',
                    color: testType === 'custom' ? 'var(--brand-cyan)' : 'var(--text-main)',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Custom Endpoint
                </button>
              </div>
            </div>

            {testType === 'custom' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Target URL</label>
                <input 
                  type="text" 
                  value={customUrl} 
                  onChange={(e) => setCustomUrl(e.target.value)}
                  disabled={isRunning}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-ui)',
                    background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.85rem'
                  }}
                />
              </motion.div>
            )}

            {/* Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Virtual Users (VUs)</label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>{concurrency}</span>
                </div>
                <input 
                  type="range" min="1" max="150" step="5" value={concurrency}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setConcurrency(val);
                    setVuStates(Array(val).fill('idle'));
                  }}
                  disabled={isRunning}
                  style={{ width: '100%', accentColor: 'var(--brand-cyan)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Duration</label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>{duration}s</span>
                </div>
                <input 
                  type="range" min="10" max="180" step="10" value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={isRunning}
                  style={{ width: '100%', accentColor: 'var(--brand-cyan)' }}
                />
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={isRunning ? () => stopTest(false) : startTest}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: isRunning ? '#EF4444' : 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))',
                color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: isRunning ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 4px 15px rgba(99, 102, 241, 0.3)'
              }}
            >
              {isRunning ? (
                <>
                  <Square size={16} fill="white" /> Stop Load Test
                </>
              ) : (
                <>
                  <Play size={16} fill="white" /> Start Benchmark
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* RPS Meter */}
          <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 216, 255, 0.1)', color: 'var(--brand-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Throughput</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                {metrics.currentRps} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>RPS</span>
              </h3>
            </div>
          </div>

          {/* Average Latency Meter */}
          <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Avg Latency</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                {metrics.avgLatency} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>ms</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Live Progress Bar */}
        {isRunning && (
          <div className="card" style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} className="spin-slow" /> Running test...
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                {elapsedTime}s / {duration}s
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-card)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div 
                style={{ height: '100%', background: 'linear-gradient(90deg, var(--brand-indigo), var(--brand-cyan))' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Detailed Stats Panel */}
        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart2 size={18} color="var(--brand-cyan)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Telemetry Stats</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Requests:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{metrics.totalSent}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Successful:</span>
                <span style={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> {metrics.successCount}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Errors:</span>
                <span style={{ fontWeight: 700, color: metrics.errorCount > 0 ? '#EF4444' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={12} /> {metrics.errorCount}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Min Latency:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{metrics.minLatency} ms</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>p50 (Median):</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{metrics.p50} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>p90 Latency:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{metrics.p90} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>p99 Latency:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-indigo)' }}>{metrics.p99} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed var(--border-ui)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Latency:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{metrics.maxLatency} ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chart */}
        {chartData.length > 0 && (
          <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>RPS & Latency Timeline</h2>
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-cyan)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--brand-cyan)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-indigo)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--brand-indigo)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-ui)" />
                  <XAxis dataKey="second" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                  <Area type="monotone" dataKey="RPS" stroke="var(--brand-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorRps)" name="RPS" />
                  <Area type="monotone" dataKey="Latency" stroke="var(--brand-indigo)" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" name="Latency (ms)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Live Virtual Users (VU) Visual Grid */}
        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--brand-indigo)" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Concurrency Monitor ({concurrency} VUs)</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4B5563' }} /> Idle
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-cyan)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-cyan)' }} /> Active
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} /> OK
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} /> ERR
              </span>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(auto-fill, minmax(14px, 1fr))`, 
            gap: '6px',
            maxHeight: '120px',
            overflowY: 'auto',
            padding: '4px'
          }} className="no-scrollbar">
            {vuStates.map((state, idx) => {
              let bg = '#4B5563';
              let scale = 1;
              let glow = 'none';

              if (state === 'loading') {
                bg = 'var(--brand-cyan)';
                scale = 1.25;
                glow = '0 0 8px var(--brand-cyan)';
              } else if (state === 'success') {
                bg = '#10B981';
              } else if (state === 'error') {
                bg = '#EF4444';
                glow = '0 0 8px #EF4444';
              }

              return (
                <motion.div 
                  key={idx}
                  animate={{ scale }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '4px',
                    background: bg,
                    boxShadow: glow,
                    cursor: 'pointer'
                  }}
                  title={`VU #${idx + 1}: ${state}`}
                />
              );
            })}
          </div>
        </div>

        {/* History Reports Panel */}
        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="var(--brand-indigo)" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Benchmark History</h2>
            </div>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No tests run yet. Hit "Start Benchmark" above!
              </div>
            ) : (
              history.map((h) => (
                <div key={h.id} style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-ui)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{h.type} Benchmark</span>
                    <span style={{ color: 'var(--brand-cyan)' }}>{h.rps} RPS</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', color: 'var(--text-muted)' }}>
                    <div>VUs: <strong style={{ color: 'var(--text-main)' }}>{h.vus}</strong></div>
                    <div>Reqs: <strong style={{ color: 'var(--text-main)' }}>{h.totalRequests}</strong></div>
                    <div>Rate: <strong style={{ color: '#10B981' }}>{h.successRate}%</strong></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <div>Avg: <strong style={{ color: 'var(--text-main)' }}>{h.avgLatency}ms</strong></div>
                    <div>Min: <strong style={{ color: 'var(--text-main)' }}>{h.minLatency}ms</strong></div>
                    <div>p95: <strong style={{ color: 'var(--brand-indigo)' }}>{h.p95}ms</strong></div>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                    {h.date}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTest;
