import { Popover, Tooltip } from 'antd';

import { ProposalState } from '../../../../models/accounts';
import BN from 'bn.js';

import {
  formatPercentage,
  getAmountFractionAsDecimalPercentage,
} from '../../../../tools/units';
import React, { useRef } from 'react';
import { BigNumber } from 'bignumber.js';

export function VoteScore({
  yesVoteCount,
  noVoteCount,
  maxVoteScore,
  yesVoteThreshold,
  governingMintDecimals,
  proposalState,
  isPreVotingState,
}: {
  yesVoteCount: BN;
  noVoteCount: BN;
  maxVoteScore: BN;
  yesVoteThreshold: number;
  governingMintDecimals: number;
  proposalState: ProposalState;
  isPreVotingState: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const yesVotePercent = getAmountFractionAsDecimalPercentage(
    maxVoteScore,
    yesVoteCount,
  );
  const noVotePercent = getAmountFractionAsDecimalPercentage(
    maxVoteScore,
    noVoteCount,
  );

  const getAdjustedVotePercent = (votePercent: number) => {
    if (votePercent === 0) {
      return 0;
    }
    // Show anything smaller than 0.2 as 0.2%
    if (votePercent < 0.2) {
      return 0.2;
    }
    return votePercent;
  };

  const getArrowPointAtCenter = (votePercent: number) => {
    // For values close to edges point the arrow at the center and for larger follow the progress head
    return votePercent < 15 || votePercent > 95;
  };

  const yesVotePercentAdjusted = getAdjustedVotePercent(yesVotePercent);
  const noVotePercentAdjusted = getAdjustedVotePercent(noVotePercent);
  const abstainedVotePercent =
    100 - (yesVotePercentAdjusted + noVotePercentAdjusted);

  // 50% tipping point is only relevant for yesVote thresholds below 50%
  // Above 50% the yestVote threshold is the tipping point
  const showTippingPoint =
    yesVoteThreshold < 50 && proposalState === ProposalState.Voting;

  // as a temp. workaround shift the tipping point marker to vertical to not overlap it with yesVote threshold
  // this should not be necessary once we have asymmetric tooltip beaks
  const shiftTippingPoint = yesVoteThreshold >= 40;

  const barHeight = 10;

  return (
    <div
      style={{ position: 'relative' }}
      className="vote-score-container"
      ref={parentRef}
    >
      <div
        style={{
          height: barHeight,
          width: '100%',
          marginBottom: 40,
          marginTop: 50,
        }}
      >
        {/* Yes Vote percentage and tooltip + popover */}
        {!isPreVotingState && (
          <Tooltip
            title={
              <Popover
                title="Yes vote count"
                content={
                  <div style={{ textAlign: 'right' }}>
                    {formatVoteCount(yesVoteCount, governingMintDecimals)}
                  </div>
                }
                placement="bottom"
              >
                {formatPercentage(yesVotePercent)}
              </Popover>
            }
            visible
            placement={
              getArrowPointAtCenter(yesVotePercent) ? 'bottom' : 'bottomRight'
            }
            color="green"
            getTooltipContainer={() => parentRef.current!}
            arrowPointAtCenter={getArrowPointAtCenter(yesVotePercent)}
          >
            <div
              style={{
                height: '100%',
                width: `${yesVotePercentAdjusted}%`,
                backgroundColor: '#49aa19',
                display: 'inline-block',
              }}
            ></div>
          </Tooltip>
        )}

        {/* Abstained Vote percentage */}
        <div
          style={{
            width: `${abstainedVotePercent}%`,
            height: '100%',
            background: 'gray',
            display: 'inline-block',
          }}
        ></div>

        {/* No Vote percentage and tooltip */}
        {!isPreVotingState && (
          <Tooltip
            title={
              <Popover
                title="No vote count"
                content={
                  <div style={{ textAlign: 'right' }}>
                    {formatVoteCount(noVoteCount, governingMintDecimals)}
                  </div>
                }
                placement="bottom"
              >
                {formatPercentage(noVotePercent)}
              </Popover>
            }
            visible
            placement={
              getArrowPointAtCenter(noVotePercent) ? 'bottom' : 'bottomLeft'
            }
            color="red"
            arrowPointAtCenter={getArrowPointAtCenter(noVotePercent)}
            getTooltipContainer={() => parentRef.current!}
          >
            <div
              style={{
                width: `${noVotePercentAdjusted}%`,
                height: '100%',
                background: '#d32029',
                display: 'inline-block',
              }}
            ></div>
          </Tooltip>
        )}
      </div>

      {/* Tipping point marker and tooltip */}
      {showTippingPoint && (
        <div
          style={{
            width: '100%',
            height: barHeight,
            position: 'absolute',
            top: 6,
          }}
        >
          <Tooltip
            title={
              <Popover
                title="Vote tipping point"
                placement="top"
                content={
                  <div style={{ textAlign: 'right' }}>
                    {formatVoteCountPercentage(
                      maxVoteScore,
                      50,
                      governingMintDecimals,
                    )}
                  </div>
                }
              >
                <span>{formatPercentage(50)}</span>
              </Popover>
            }
            visible
            placement={shiftTippingPoint ? 'rightTop' : 'top'}
            color="#404040"
            arrowPointAtCenter={false}
            getTooltipContainer={() => parentRef.current!}
          >
            {/* When we shift tipping point then use longer marker to shift the tooltip from progress bar bottom  */}
            <div
              style={{
                left: '50%',
                position: 'absolute',
                width: '2px',
                top: shiftTippingPoint ? -28 : 0,
                bottom: 0,
                opacity: '90%',
              }}
            ></div>
          </Tooltip>
          <div
            style={{
              left: '50%',
              background: '#404040',
              position: 'absolute',
              width: '2px',
              opacity: '90%',
              top: 0,
              bottom: 0,
            }}
          ></div>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: barHeight,
          position: 'absolute',
          top: 6,
        }}
      >
        {/* Yes Vote threshold marker and tooltip */}
        <Tooltip
          title={
            <Popover
              title="Yes vote threshold"
              placement="top"
              content={
                <div style={{ textAlign: 'right' }}>
                  {formatVoteCountPercentage(
                    maxVoteScore,
                    yesVoteThreshold,
                    governingMintDecimals,
                  )}
                </div>
              }
            >
              <span>{formatPercentage(yesVoteThreshold)}</span>
            </Popover>
          }
          visible
          placement="top"
          color="#006400"
          arrowPointAtCenter={true}
          getTooltipContainer={() => parentRef.current!}
        >
          <div
            style={{
              left: `${yesVoteThreshold}%`,
              background: '#006400',
              position: 'absolute',
              width: '2px',
              height: barHeight,
              opacity: '90%',
            }}
          ></div>
        </Tooltip>
      </div>
    </div>
  );
}

function formatVoteCountPercentage(
  maxVoteScore: BN,
  percentage: number,
  mintDecimals: number,
) {
  return (
    percentage === 100
      ? new BigNumber(maxVoteScore.toString()).shiftedBy(-mintDecimals)
      : new BigNumber(maxVoteScore.toString())
          .multipliedBy(percentage)
          .shiftedBy(-(mintDecimals + 2))
  ).toFormat();
}

function formatVoteCount(voteCount: BN, mintDecimals: number) {
  return new BigNumber(voteCount.toString())
    .shiftedBy(-mintDecimals)
    .toFormat();
}
