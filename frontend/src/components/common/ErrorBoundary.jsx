import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#080C14',
          color: '#F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(0, 216, 255, 0.1)',
            border: '1px solid rgba(0, 216, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginBottom: '16px'
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#F1F5F9' }}>SmartRide AI</h2>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '24px', maxWidth: '320px', lineHeight: '1.5' }}>
            An unexpected error occurred while rendering.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#00D8FF',
              color: '#080C14',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
