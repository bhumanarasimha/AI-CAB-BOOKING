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
    console.error("SmartRide AI ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

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
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '22px',
            backgroundColor: 'rgba(0, 216, 255, 0.12)',
            border: '1px solid rgba(0, 216, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            marginBottom: '18px',
            boxShadow: '0 0 30px rgba(0, 216, 255, 0.2)'
          }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#F1F5F9' }}>
            SmartRide <span style={{ color: '#00D8FF' }}>AI</span>
          </h2>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '20px', maxWidth: '320px', lineHeight: '1.5' }}>
            The application encountered a display issue and prevented a blank screen.
          </p>
          {this.state.error && (
            <div style={{
              background: '#0F1623',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px 16px',
              maxWidth: '340px',
              fontSize: '12px',
              color: '#EF4444',
              marginBottom: '24px',
              wordBreak: 'break-word',
              textAlign: 'left',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {String(this.state.error.message || this.state.error)}
            </div>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '14px 28px',
              backgroundColor: '#00D8FF',
              color: '#080C14',
              border: 'none',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 216, 255, 0.35)'
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
