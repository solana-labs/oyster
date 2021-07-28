import { Space } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ParsedAccount } from '@oyster/common';
import { Governance, Proposal } from '../../../../models/accounts';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZeroCountdown: CountdownState = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const isZeroCountdown = (state: CountdownState) =>
  state.days === 0 &&
  state.hours === 0 &&
  state.minutes === 0 &&
  state.seconds === 0;

export function VoteCountdown({
  proposal,
  governance,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
}) {
  const [countdown, setCountdown] = useState(ZeroCountdown);

  useEffect(() => {
    if (proposal.info.isVoteFinalized()) {
      setCountdown(ZeroCountdown);
      return;
    }

    const getTimeToVoteEnd = () => {
      const now = moment().unix();

      let timeToVoteEnd = proposal.info.isPreVotingState()
        ? governance.info.config.maxVotingTime
        : proposal.info.votingAt?.toNumber()! +
          governance.info.config.maxVotingTime -
          now;

      if (timeToVoteEnd <= 0) {
        return ZeroCountdown;
      }

      const days = Math.floor(timeToVoteEnd / 86400);
      timeToVoteEnd -= days * 86400;

      const hours = Math.floor(timeToVoteEnd / 3600) % 24;
      timeToVoteEnd -= hours * 3600;

      const minutes = Math.floor(timeToVoteEnd / 60) % 60;
      timeToVoteEnd -= minutes * 60;

      const seconds = Math.floor(timeToVoteEnd % 60);

      return { days, hours, minutes, seconds };
    };

    const updateCountdown = () => {
      const newState = getTimeToVoteEnd();
      setCountdown(newState);
    };

    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);

    updateCountdown();
    return () => clearInterval(interval);
  }, [proposal, governance]);

  return (
    <>
      {isZeroCountdown(countdown) ? (
        <Space>
          <div className="cd-number">vote has ended</div>
        </Space>
      ) : (
        <Space>
          {countdown && countdown.days > 0 && (
            <Space direction="vertical" size={0}>
              <div className="cd-number">
                {countdown.days < 10 && <span style={{ opacity: 0.1 }}>0</span>}
                {countdown.days}
                <span style={{ opacity: 0.2 }}>:</span>
              </div>
              <div className="cd-label">days</div>
            </Space>
          )}

          <Space direction="vertical" size={0}>
            <div className="cd-number">
              {countdown.hours < 10 && <span style={{ opacity: 0.1 }}>0</span>}
              {countdown.hours}
              <span style={{ opacity: 0.2 }}>:</span>
            </div>
            <div className="cd-label">hours</div>
          </Space>

          <Space direction="vertical" size={0}>
            <div className="cd-number">
              {countdown.minutes < 10 && (
                <span style={{ opacity: 0.1 }}>0</span>
              )}
              {countdown.minutes}
              {countdown.days === 0 && <span style={{ opacity: 0.2 }}>:</span>}
            </div>
            <div className="cd-label">mins</div>
          </Space>

          {!countdown.days && (
            <Space direction="vertical" size={0}>
              <div className="cd-number">
                {countdown.seconds < 10 && (
                  <span style={{ opacity: 0.1 }}>0</span>
                )}
                {countdown.seconds}
              </div>
              <div className="cd-label">secs</div>
            </Space>
          )}
        </Space>
      )}
    </>
  );
}
