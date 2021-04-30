import moment from 'moment';

export const getCountdown = (ts: number) => {
  const now = moment().unix();
  let delta = ts - now;

  if (!ts || delta <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days = Math.floor(delta / 86400);
  delta -= days * 86400;

  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;

  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;

  const seconds = Math.floor(delta % 60);

  return { days, hours, minutes, seconds };
};

export const cleanName = (name: string): string => {
  return name.replaceAll(' ', '-');
};
