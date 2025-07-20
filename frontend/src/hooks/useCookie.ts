import { useState, useEffect } from 'react';

export function useCookie<T>(
  key: string,
  initialValue: T,
  options?: { days?: number }
): [T, (value: T) => void] {
  const getCookie = (): T => {
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[2]));
      } catch {
        return initialValue;
      }
    } else {
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(getCookie);

  const setCookie = (val: T) => {
    setValue(val);
    let expires = '';
    if (options?.days) {
      const d = new Date();
      d.setTime(d.getTime() + options.days * 24 * 60 * 60 * 1000);
      expires = `; expires=${d.toUTCString()}`;
    }
    document.cookie = `${key}=${encodeURIComponent(JSON.stringify(val))}${expires}; path=/`;
  };

  useEffect(() => {
    setValue(getCookie());
  }, [key]);

  return [value, setCookie];
}
