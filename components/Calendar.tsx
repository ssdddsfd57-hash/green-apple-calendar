
import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  setMonth,
  parseISO,
  isAfter,
  getDay,
  getDate,
  getMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  locale: any;
}

const Calendar: React.FC<CalendarProps> = ({ events, onDateClick, onEventClick, locale }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);

  const days = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      if (isSameDay(day, eventDate)) return true;
      if (!event.repeat || event.repeat === 'none' || isAfter(eventDate, day)) return false;
      switch (event.repeat) {
        case 'daily': return true;
        case 'weekly': return getDay(day) === getDay(eventDate);
        case 'monthly': return getDate(day) === getDate(eventDate);
        case 'yearly': return getDate(day) === getDate(eventDate) && getMonth(day) === getMonth(eventDate);
        default: return false;
      }
    });
  };

  const handleMonthSelect = (mIndex: number) => {
    setCurrentDate(setMonth(currentDate, mIndex));
    setShowMonthPicker(false);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-lime-100 flex flex-col shadow-lime-100/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-br from-lime-50/20 to-white flex-shrink-0 border-b border-lime-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="text-xl font-semibold text-slate-800 flex items-center gap-1.5 font-clean-cute tracking-widest transition-opacity hover:opacity-70">
            {format(currentDate, 'MMMM', { locale })}
            <Settings2 size={16} className="text-lime-400" />
          </button>
          <span className="text-[12px] font-semibold text-lime-300 font-clean-cute mt-1">{format(currentDate, 'yyyy')}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-lime-50/50 p-1.5 rounded-2xl">
          <button onClick={prevMonth} className="p-1.5 text-lime-500 hover:bg-lime-400 hover:text-white rounded-xl transition-all"><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-[11px] font-semibold text-slate-600 font-clean-cute tracking-wide">{locale.code === 'zh-CN' ? '今日' : 'Today'}</button>
          <button onClick={nextMonth} className="p-1.5 text-lime-500 hover:bg-lime-400 hover:text-white rounded-xl transition-all"><ChevronRight size={18} /></button>
        </div>
      </div>

      {showMonthPicker && (
        <div className="absolute top-20 left-6 right-6 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-lime-100 p-6 grid grid-cols-4 gap-3 z-50 animate-in fade-in zoom-in-95">
          {Array.from({ length: 12 }, (_, i) => format(setMonth(new Date(), i), 'MMM', { locale })).map((m, i) => (
            <button key={i} onClick={() => handleMonthSelect(i)} className={`py-3 rounded-2xl text-[12px] font-semibold font-clean-cute tracking-widest ${getMonth(currentDate) === i ? 'bg-lime-400 text-white' : 'hover:bg-lime-50 text-slate-600'}`}>{m}</button>
          ))}
        </div>
      )}

      {/* Days Header */}
      <div className="calendar-grid bg-white flex-shrink-0 border-b border-lime-50">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
          <div key={dayIdx} className={`py-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] font-clean-cute ${dayIdx === 0 || dayIdx === 6 ? 'text-orange-400' : 'text-lime-400'}`}>
            {format(addMonths(startOfWeek(currentDate), 0).setDate(startOfWeek(currentDate).getDate() + dayIdx), 'eee', { locale })}
          </div>
        ))}
      </div>

      {/* Grid Days */}
      <div className="calendar-grid flex-1">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div 
              key={idx}
              onClick={() => onDateClick(day)}
              className={`day-cell border-r border-b border-lime-50/20 p-1 flex flex-col items-center transition-all cursor-pointer min-h-[70px] sm:min-h-[100px] ${!isCurrentMonth ? 'bg-slate-50/10 opacity-30' : 'bg-white hover:bg-lime-50/30'}`}
            >
              <span className={`text-[12px] font-semibold w-7 h-7 flex items-center justify-center rounded-xl mt-1 ${isToday ? 'bg-lime-400 text-white shadow-lg' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'} font-clean-cute tracking-tighter`}>
                {format(day, 'd')}
              </span>
              <div className="mt-2 flex flex-col gap-1 w-full px-1.5 pb-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div key={event.id} className={`${event.color} h-1.5 rounded-full shadow-sm`}></div>
                ))}
                {dayEvents.length > 2 && <div className="text-[8px] font-semibold text-slate-400 text-center font-clean-cute">+{dayEvents.length - 2}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
