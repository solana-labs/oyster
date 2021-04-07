import React, { useCallback } from 'react';
import './index.less';
import { Link, useLocation } from 'react-router-dom';

export const AppBar = () => {
  const location = useLocation();

  const isActiveClass = useCallback(
    (lookupClass: string) => {
      return location.pathname.includes(lookupClass) ? 'active' : '';
    },
    [location],
  );

  return (
    <div className={'app-bar-inner'}>
      <div className={`app-bar-item ${isActiveClass('move')}`}>
        <Link to="/move">Bridge</Link>
      </div>
      <div className={`app-bar-item ${isActiveClass('faq')}`}>
        <Link to="/faq">FAQ</Link>
      </div>
      <div className={`app-bar-item ${isActiveClass('proof-of-assets')}`}>
        <Link to="/proof-of-assets">Proof-of-Assets</Link>
      </div>
      <div className={`app-bar-item ${isActiveClass('help')}`}>
        <Link to="/help">Help</Link>
      </div>
    </div>
  );
};
