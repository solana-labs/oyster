import { Col, Row } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const endAt = moment().unix() + 10000;

export const VoteCountdown = () => {
  const [state, setState] = useState<CountdownState>();

  const getTimeToEnd = () => {
    const now = moment().unix();
    const ended = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    let delta = endAt - now;

    if (!endAt || delta <= 0) return ended;

    const days = Math.floor(delta / 86400);
    delta -= days * 86400;

    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    const seconds = Math.floor(delta % 60);

    return { days, hours, minutes, seconds };
  };

  useEffect(() => {
    const calc = () => {
      const newState = getTimeToEnd();

      setState(newState);
    };

    const interval = setInterval(() => {
      calc();
    }, 1000);

    calc();
    return () => clearInterval(interval);
    // }, [auction]);
  }, []);

  const ended = isEnded(state);

  return <Countdown state={state} />;
};

const Countdown = ({ state }: { state?: CountdownState }) => {
  return (
    <>
      <div style={{ width: '100%', justifyContent: 'center' }}>
        <>
          {state &&
            (isEnded(state) ? (
              <Row style={{ width: '100%' }}>
                <div className="cd-number">This auction has ended</div>
              </Row>
            ) : (
              <Row
                style={{
                  width: '100%',
                  flexWrap: 'nowrap',
                  justifyContent: 'center',
                }}
              >
                {state && state.days > 0 && (
                  <Col>
                    <div className="cd-number">
                      {state.days < 10 && (
                        <span style={{ opacity: 0.2 }}>0</span>
                      )}
                      {state.days}
                      <span style={{ opacity: 0.2 }}>:</span>
                    </div>
                    <div className="cd-label">days</div>
                  </Col>
                )}
                <Col>
                  <div className="cd-number">
                    {state.hours < 10 && (
                      <span style={{ opacity: 0.2 }}>0</span>
                    )}
                    {state.hours}
                    <span style={{ opacity: 0.2 }}>:</span>
                  </div>
                  <div className="cd-label">hour</div>
                </Col>
                <Col>
                  <div className="cd-number">
                    {state.minutes < 10 && (
                      <span style={{ opacity: 0.2 }}>0</span>
                    )}
                    {state.minutes}
                    {state.days === 0 && (
                      <span style={{ opacity: 0.2 }}>:</span>
                    )}
                  </div>
                  <div className="cd-label">mins</div>
                </Col>
                {!state.days && (
                  <Col>
                    <div className="cd-number">
                      {state.seconds < 10 && (
                        <span style={{ opacity: 0.2 }}>0</span>
                      )}
                      {state.seconds}
                    </div>
                    <div className="cd-label">secs</div>
                  </Col>
                )}
              </Row>
            ))}
        </>
      </div>
    </>
  );
};

const isEnded = (state?: CountdownState) =>
  state?.days === 0 &&
  state?.hours === 0 &&
  state?.minutes === 0 &&
  state?.seconds === 0;
