import React from 'react';
import { Input } from 'antd';
import './searchBox.less';

const { Search } = Input;

export const SearchBox = ({}) => {
  const onSearch = (value: string) => console.log(value);

  return <Search placeholder={"Search for artists & NFTs"}
                 onSearch={onSearch}
                 className="search-box" />;
}
