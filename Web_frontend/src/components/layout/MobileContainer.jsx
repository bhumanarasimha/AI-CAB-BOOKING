import { Outlet } from 'react-router-dom';

const MobileContainer = () => (
  <div style={styles.outerWrapper}>
    <div style={styles.phoneFrame}>
      <div style={styles.contentArea}>
        <Outlet />
      </div>
    </div>
  </div>
);

const styles = {
  outerWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#040608',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: '16px',
    boxSizing: 'border-box',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: '410px',
    height: '100%',
    maxHeight: '860px',
    backgroundColor: '#080C14',
    borderRadius: '36px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 216, 255, 0.1)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
};

export default MobileContainer;
