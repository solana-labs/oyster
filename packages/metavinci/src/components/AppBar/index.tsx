import React from 'react'
import './index.less'
import { SearchBox } from './searchBox'

export const AppBar = () => {
  return (
    <div className={'app-bar-inner'}>
        <SearchBox />
    </div>
  );
};
