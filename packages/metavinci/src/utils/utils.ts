import moment from 'moment';

export const getCountdown = (ts: number) => {
  const now = moment().unix();
  let delta = Math.abs(ts - now);

  const days = Math.floor(delta / 86400);
  delta -= days * 86400;

  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;

  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;

  const seconds = Math.floor(delta % 60);

  return { days, hours, minutes, seconds };
};
