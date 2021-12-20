import { t } from 'i18next';

export const pluralize = (count: number): string => (count === 1 ? '' : 's');

export const getDuration = (seconds: string | null): string | null => {
  let sec = parseInt(seconds as string, 10);
  if (isNaN(sec) || sec < 0) {
    return null;
  }
  let val, msg;
  sec = Math.max(Math.round(sec), 1);
  if (sec < 60) {
    val = sec;
    msg = `${val} second${pluralize(val)}`;
    return t('durationSeconds', msg, { count: val });
  }
  val = Math.max(Math.round(sec / 60), 1);
  if (val < 60) {
    msg = `${val} minute${pluralize(val)}`;
    return t('durationMinutes', msg, { count: val });
  }
  val = Math.max(Math.round((sec / 60 / 60) * 10) / 10, 1);
  if (val < 24) {
    msg = `${val} hour${pluralize(val)}`;
    return t('durationHours', msg, { count: val });
  }
  val = Math.max(Math.round((sec / 60 / 60 / 24) * 10) / 10, 1);
  if (val < 365) {
    msg = `${val} day${pluralize(val)}`;
    return t('durationDays', msg, { count: val });
  }
  val = Math.max(Math.round(sec / 60 / 60 / 24 / 365), 1);
  msg = `${val} year${pluralize(val)}`;
  return t('durationYears', msg, { count: val });
};
