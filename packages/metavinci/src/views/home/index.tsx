import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'

import './index.less'
import { Table, Col, Row, Statistic, Button } from 'antd'

export const HomeView = () => {

  return (
    <>
      <div className="flexColumn home-container">
        <div className={'justify-bottom-container'}>
          <div className={'grow-effect'}>
            <Link to="/move">
              <span className={'get-started'}></span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
