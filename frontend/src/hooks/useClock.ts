import { useEffect, useState } from 'react';

function pad(n: number) { return String(n).padStart(2, '0'); }

export function useClock() {
  const [s, set] = useState({ date: '', time: '' });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const weekday = n.toLocaleDateString('es-PY', { weekday: 'long' });
      const day = n.getDate();
      const month = n.toLocaleDateString('es-PY', { month: 'long' });
      const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
      set({
        date: `${capWeekday}, ${day} de ${capMonth}`,
        time: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}
