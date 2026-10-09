import { Outlet } from 'react-router-dom';

const MobileContainer = () => (
  <div className="mobile-outer-wrapper no-scrollbar">
    <div className="mobile-phone-frame no-scrollbar">
      <div className="mobile-content-area no-scrollbar">
        <Outlet />
      </div>
    </div>
  </div>
);

export default MobileContainer;
