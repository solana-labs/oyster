import React, { useEffect, useState } from 'react';
import { contexts, ParsedAccount } from '@oyster/common';
import { Card, Spin } from 'antd';
import { useProposals } from '../../contexts/proposals';
import { TimelockSet } from '../../models/timelock';
import ReactMarkdown from 'react-markdown';
import { LABELS } from '../../constants';

const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export function Proposal({
  proposal,
}: {
  proposal: ParsedAccount<TimelockSet>;
}) {
  const isUrl = !!proposal.info.state.descLink.match(urlRegex);
  const isGist =
    proposal.info.state.descLink.match(/gist/i) &&
    proposal.info.state.descLink.match(/github/i);
  const [content, setContent] = useState(proposal.info.state.descLink);
  const [loading, setLoading] = useState(isUrl);
  const [failed, setFailed] = useState(true);
  if (loading) {
    let toFetch = proposal.info.state.descLink;
    const pieces = toFetch.match(urlRegex);
    if (isGist && pieces) {
      const justIdWithoutUser = pieces[1].split('/')[2];
      toFetch = 'https://api.github.com/gists/' + justIdWithoutUser;
    }
    fetch(toFetch)
      .then(async resp => {
        if (resp.status == 200) {
          if (isGist) {
            const jsonContent = await resp.json();
            const nextUrlFileName = Object.keys(jsonContent['files'])[0];
            const nextUrl = jsonContent['files'][nextUrlFileName]['raw_url'];
            fetch(nextUrl).then(async response =>
              setContent(await response.text()),
            );
          } else setContent(await resp.text());
        } else {
          setFailed(true);
        }
        setLoading(false);
      })
      .catch(response => {
        setFailed(true);
        setLoading(false);
      });
  }

  return (
    <Card title={LABELS.PROPOSAL + ': ' + proposal.info.state.name}>
      {loading ? (
        <Spin />
      ) : isUrl ? (
        failed ? (
          <Card.Meta
            title={LABELS.DESCRIPTION}
            description={
              <a href={proposal.info.state.descLink} target="_blank">
                {LABELS.NO_LOAD}
              </a>
            }
          />
        ) : (
          <ReactMarkdown children={content} />
        )
      ) : (
        content
      )}
    </Card>
  );
}
