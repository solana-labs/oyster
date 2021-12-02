import React from 'react';
import './../../App.less';
import { Layout } from 'antd';
import { Link } from 'react-router-dom';

import { components } from '@oyster/common';
import { Content, Header } from 'antd/lib/layout/layout';
// import Logo from './dark-horizontal-combined-rainbow.inline.svg';
import Logo from './ducksidedao.png';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getHomeUrl } from '../../tools/routeTools';

const { AppBar } = components;

export const AppLayout = React.memo((props: any) => {
  //  const location = useLocation();

  // const breadcrumbNameMap: any = {
  //   '/governance': 'Governance',
  //   '/apps/1': 'Application1',
  //   '/apps/2': 'Application2',
  //   '/apps/1/detail': 'Detail',
  //   '/apps/2/detail': 'Detail',
  // };

  //const pathSnippets = location.pathname.split('/').filter(i => i);
  // const extraBreadcrumbItems = pathSnippets.map((_, index) => {
  //   const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
  //   return (
  //     <Breadcrumb.Item key={url}>
  //       <Link to={url}>{breadcrumbNameMap[url]}</Link>
  //     </Breadcrumb.Item>
  //   );
  // });

  // const breadcrumbItems = [
  //   <Breadcrumb.Item key="home">
  //     <Link to="/">Home</Link>
  //   </Breadcrumb.Item>,
  // ].concat(extraBreadcrumbItems);

  // TODO: add breadcrumb

  return (
    <div className="App">
      <Layout>
        <Header className="App-Bar">
          <div className="app-title" style={{display:"flex",flexDirection:"row"}}>
            <HomeLink></HomeLink>
            <div style={{marginLeft:10}}>
                DucksideDAO Governance (Alpha)
            </div>
            {/*
            <a href="https://ducksidedao.com" style={{marginLeft:10}}>
              DucksideDAO Alpha
            </a>
            */}
          </div>
          <AppBar useWalletBadge={true} />
        </Header>
        <Content>
          {/* <Breadcrumb>{breadcrumbItems}</Breadcrumb> */}
          {props.children}
        </Content>
      </Layout>
    </div>
  );
});

const HomeLink = () => {
  const { programId } = useRpcContext();

  return (
    <Link to={getHomeUrl(programId)}>
      <img alt={`DucksideDAO Logo`} src={Logo} style={{ height: 40 }} />
    </Link>
  );
};
