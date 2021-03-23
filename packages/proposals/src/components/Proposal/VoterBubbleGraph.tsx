import BN from 'bn.js';
import * as d3 from 'd3';
import React, { useLayoutEffect, useState } from 'react';
//https://observablehq.com/d/86d91b23534992ff
interface IVoterBubbleGraph {
  votingAccounts: Record<string, { amount: BN }>;
  yesVotingAccounts: Record<string, { amount: BN }>;
  noVotingAccounts: Record<string, { amount: BN }>;
  width: number;
  height: number;
}

export function VoterBubbleGraph(props: IVoterBubbleGraph) {
  const {
    votingAccounts,
    yesVotingAccounts,
    noVotingAccounts,
    width,
    height,
  } = props;
  const mapper = (key: string, account: { amount: BN }, label: string) => ({
    name: key,
    title: key,
    group: label,
    value: account.amount.toNumber(),
  });
  const data = [
    ...Object.keys(votingAccounts).map(key =>
      mapper(key, votingAccounts[key], 'undecided'),
    ),
    ...Object.keys(yesVotingAccounts).map(key =>
      mapper(key, yesVotingAccounts[key], 'yes'),
    ),
    ...Object.keys(noVotingAccounts).map(key =>
      mapper(key, noVotingAccounts[key], 'no'),
    ),
  ];

  const format = d3.format(',d');
  const color = d3.scaleOrdinal(
    data.map(d => d.group),
    d3.schemeCategory10,
  );
  const pack = (
    data: Array<{ name: string; title: string; group: string; value: number }>,
  ) => {
    return d3
      .pack()
      .size([width - 2, height - 2])
      .padding(3)(
      //@ts-ignore
      d3.hierarchy({ children: data }).sum(d => (d.value ? d.value : 0)),
    );
  };

  const [svg, setSvg] = useState<any>(null);

  useLayoutEffect(() => {
    const root = pack(data);

    const newSvg = d3
      .create('svg')
      //@ts-ignore
      .attr('viewBox', [0, 0, width, height])
      .attr('font-size', 10)
      .attr('font-family', 'sans-serif')
      .attr('text-anchor', 'middle');

    const leaf = newSvg
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', d => `translate(${d.x + 1},${d.y + 1})`);

    leaf
      .append('circle')
      //@ts-ignore
      .attr('id', d => (d.leafUid = DOM.uid('leaf')).id)
      .attr('r', d => d.r)
      .attr('fill-opacity', 0.7)
      //@ts-ignore
      .attr('fill', d => color(d.data.group));

    leaf
      .append('clipPath')
      //@ts-ignore
      .attr('id', d => (d.clipUid = DOM.uid('clip')).id)
      .append('use')
      //@ts-ignore
      .attr('xlink:href', d => d.leafUid.href);

    //@ts-ignore
    leaf
      .append('text')
      //@ts-ignore
      .attr('clip-path', d => d.clipUid)
      .selectAll('tspan')
      //@ts-ignore
      .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
      .join('tspan')
      .attr('x', 0)
      .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
      .text(d => d);

    leaf.append('title').text(
      d =>
        `${
          //@ts-ignore
          d.data.title === undefined
            ? ''
            : //@ts-ignore
              `${d.data.title}
` //@ts-ignore
        }${format(d.value)}`,
    );

    setSvg(newSvg);
  }, [votingAccounts, yesVotingAccounts, noVotingAccounts]);
  console.log('svg', svg?.node());
  return <p></p>;
}
