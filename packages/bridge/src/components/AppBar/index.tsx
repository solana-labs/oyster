import React, { useCallback, useEffect, useState } from 'react';
import './index.less';
import { Link, useLocation } from 'react-router-dom';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

export const AppBar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const location = useLocation();

  const isActiveClass = useCallback(
    (lookupClass: string) => {
      return location.pathname.includes(lookupClass) ? 'active' : '';
    },
    [location],
  );

  useEffect(() => {
    const header = document.getElementById('app-header');
    if (header) {
        header.style.width = showMobileMenu ?  "100%" : '0';
    }
  }, [showMobileMenu, document.body.offsetWidth]);

  return (
    <>
      <span
        className={`nav-burger ${showMobileMenu ? 'mobile-active' : ''}`}
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? (
          <MenuFoldOutlined style={{ fontSize: '25px' }} />
        ) : (
          <MenuUnfoldOutlined style={{ fontSize: '25px' }} />
        )}
      </span>
      <div className={`app-bar-inner ${showMobileMenu ? 'mobile-active' : ''}`}>
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
    </>
  );
};
