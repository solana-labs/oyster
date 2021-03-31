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
      <div className={`app-bar-item ${isActiveClass('faq')}`}>FAQ</div>
      <div className={`app-bar-item ${isActiveClass('poassets')}`}>
        Proof-of-Assets
      </div>
      <div className={`app-bar-item ${isActiveClass('help')}`}>Help</div>
    </div>
  );
};
