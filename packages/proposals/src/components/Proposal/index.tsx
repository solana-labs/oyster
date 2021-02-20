import React, { useEffect, useState } from 'react';
import { contexts } from '@oyster/common';
import { Card } from 'antd';
import { useProposals } from '../../contexts/proposals';

export function Proposal() {
  const context = useProposals();
  const proposal =
    context.proposals['svXV4BxjpqQHVSNPoM15XecVj2RJ431xHrpxXDFfmGX'];
  console.log('please', proposal);
  return <Card>{proposal?.info.state.name}</Card>;
}
