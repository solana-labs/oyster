import BN from 'bn.js';
import * as d3 from 'd3';
import React, { useEffect, useState } from 'react';
import { VoteType } from '../../views/proposal';
//https://observablehq.com/d/86d91b23534992ff
interface IVoterBubbleGraph {
  votingAccounts: Record<string, { amount: BN }>;
  yesVotingAccounts: Record<string, { amount: BN }>;
  noVotingAccounts: Record<string, { amount: BN }>;
  width: number;
  height: number;
  endpoint: string;
}

const MAX_BUBBLE_AMOUNT = 50;

export function VoterBubbleGraph(props: IVoterBubbleGraph) {
  const {
    votingAccounts,
    yesVotingAccounts,
    noVotingAccounts,
    width,
    height,
    endpoint,
  } = props;
  const subdomain = endpoint
    .replace('http://', '')
    .replace('https://', '')
    .split('.')[0];

  const mapper = (key: string, account: { amount: BN }, label: string) => ({
    name: key.slice(0, 3) + '...' + key.slice(key.length - 3, key.length),
    title: key,
    group: label,
    value: account.amount.toNumber(),
  });
  // For some reason giving this a type causes an issue where setRef
  // cant be used with ref={} prop...not sure why. SetStateAction nonsense.
  const [ref, setRef] = useState<any>();

  const data = [
    ...Object.keys(votingAccounts).map(key =>
      mapper(key, votingAccounts[key], VoteType.Undecided),
    ),
    ...Object.keys(yesVotingAccounts).map(key =>
      mapper(key, yesVotingAccounts[key], VoteType.Yes),
    ),
    ...Object.keys(noVotingAccounts).map(key =>
      mapper(key, noVotingAccounts[key], VoteType.No),
    ),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_BUBBLE_AMOUNT);

  const format = d3.format(',d');
  const color = d3
    .scaleOrdinal()
    .domain([VoteType.Undecided, VoteType.Yes, VoteType.No])
    .range(['grey', 'green', 'red']);

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

  useEffect(() => {
    if (ref) {
      ref.innerHTML = '';
      const root = pack(data);
      console.log('Re-rendered');
      const newSvg = d3
        .select(ref)
        .append('svg')
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
      //@ts-ignore
      leaf
        .append('circle')
        //@ts-ignore
        .attr('id', d => (d.leafUid = { id: d.name }).id)
        .attr('r', d => d.r)
        .attr('fill-opacity', 0.7)
        //@ts-ignore
        .attr('fill', d => color(d.data.group));

      leaf
        .append('clipPath')

        .attr(
          'id',
          d =>
            //@ts-ignore
            (d.clipUid = {
              //@ts-ignore
              id: d.name,
              //@ts-ignore
              href: `https://explorer.solana.com/address/${d.title}?cluster=${subdomain}`,
            }).id,
        )
        .append('use')
        //@ts-ignore
        .attr('xlink:href', d => d.leafUid.href);

      //@ts-ignore
      leaf
        .append('svg:a')
        .attr(
          'xlink:href',
          d =>
            //@ts-ignore
            `https://explorer.solana.com/address/${d.data.title}?cluster=${subdomain}`,
        )
        .append('svg:text')
        //@ts-ignore
        .attr('clip-path', d => d.clipUid)
        .selectAll('tspan')
        //@ts-ignore
        .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
        .join('tspan')
        .attr('x', 0)
        .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
        .attr('fill', 'white')
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
    }
  }, [ref, votingAccounts, yesVotingAccounts, noVotingAccounts, height, width]);

  return (
    <div
      ref={ref => {
        if (ref) setRef(ref);
      }}
    ></div>
  );
}
