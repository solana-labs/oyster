import React, { useCallback } from 'react';
import './index.less';
import { Link, useLocation } from 'react-router-dom';
import { SearchBox } from './searchBox';

export const AppBar = () => {
  const location = useLocation();

  return (
    <div className={'app-bar-inner'}>
        <SearchBox />
    </div>
  );
};
