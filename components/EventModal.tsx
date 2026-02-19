
import React from 'react';
import { X, MapPin, Clock, Calendar as CalendarIcon, Type, Palette, Bell, Upload, RefreshCw, Notebook, ChevronDown, Check } from 'lucide-react';
import { CalendarEvent } from '../types';
import { format } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  onUploadRequest?: () => void;
  initialData: Partial<CalendarEvent>;
  lang: 'zh' | 'en';
}

const COLORS = [
  { label: 'Lime', value: 'bg-lime-400' },
  { label: 'Green', value: 'bg-green-400' },
  { label: 'Orange', value: 'bg-orange-400' },
  { label: 'Amber', value: 'bg-amber-400' },
  { label: 'Yellow', value: 'bg-yellow-400' },
  { label: 'Cyan', value: 'bg-sky-400' },
];

const MODAL_TRANS = {
  zh: {
    edit: '编辑',
    add: '新增',
    extract: '自动提取',
    name: '名称',
    date: '日期',
    time: '时间',
    place: '地点',
    reminder: '提醒',
    repeat: '循环',
    notes: '备注',
    theme: '心情',
    save: '确定',
    delete: '删除计划',
    placeholderTitle: '打算做点什么? 🍏',
    placeholderPlace: '约在哪里?',
    placeholderNotes: '写点此时此刻的灵感...',
    reminderTypes: { none: '无', daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' },
    repeatTypes: { none: '无', daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' }
  },
  en: {
    edit: 'Edit',
    add: 'New',
    extract: 'Extract',
    name: 'Event',
    date: 'Date',
    time: 'Time',
    place: 'Where',
    reminder: 'Remind',
    repeat: 'Repeat',
    notes: 'Notes',
    theme: 'Color',
    save: 'Save',
    delete: 'Delete',
    placeholderTitle: 'What is happening? 🍏',
    placeholderPlace: 'Location?',
    placeholderNotes: 'Any inspiration today?...',
    reminderTypes: { none: 'Never', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' },
    repeatTypes: { none: 'Never', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }
  }
};

const CuteAppleIcon = ({ className = "w-6 h-6", showDate = false }) => {
  const day = format(new Date(), 'd');
  const month = format(new Date(), 'MMM').toUpperCase();
  
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M45 25 C45 15, 40 10, 35 10" stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M52 22 C65 10, 75 15, 75 25 C75 35, 65 30, 52 22" fill="#84cc16" />
      <path 
        d="M50 30 
           C35 25, 15 35, 15 60 
           C15 85, 40 95, 50 90 
           C60 95, 85 85, 85 60 
           C85 35, 65 25, 50 30" 
        fill="#bef264" 
      />
      <path 
        d="M50 30 
           C65 25, 85 35, 85 60 
           C85 85, 60 95, 50 90 
           L50 30" 
        fill="#84cc16" 
        fillOpacity="0.2"
      />
      {showDate && (
        <g textAnchor="middle" fill="white" className="font-bold select-none">
          <text x="50" y="62" fontSize="24" style={{ fontFamily: 'Arial, sans-serif' }}>{day}</text>
          <text x="50" y="78" fontSize="12" style={{ fontFamily: 'Arial, sans-serif' }}>{month}</text>
        </g>
      )}
    </svg>
  );
};

const CuteSelect: React.FC<{
  value: string;
  options: Record<string, string>;
  onChange: (val: string) => void;
}> = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 bg-[#fefce8] border-2 border-[#bef264] rounded-[1rem] text-[14px] font-medium font-clean-cute text-slate-700 tracking-wider shadow-inner transition-colors hover:bg-[#fef9c3] flex items-center justify-between"
      >
        <span className="truncate mr-1">{options[value]}</span>
        <ChevronDown size={14} className={`text-lime-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#bef264] rounded-[1rem] shadow-xl z-[60] overflow-hidden py-1 animate-in fade-in zoom-in-95">
          {Object.entries(options).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { onChange(key); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-left text-[15px] font-medium font-clean-cute tracking-wide transition-colors ${
                value === key ? 'bg-[#fef9c3] text-lime-700' : 'hover:bg-lime-50 text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, onUploadRequest, initialData, lang }) => {
  const [formData, setFormData] = React.useState<Partial<CalendarEvent>>(initialData);
  const t = MODAL_TRANS[lang];

  React.useEffect(() => {
    setFormData({
      reminderType: 'none',
      reminderValue: 0,
      repeat: 'none',
      description: '',
      ...initialData
    });
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (formData.name && formData.date && formData.time) {
      onSave({
        ...formData,
        id: formData.id || Math.random().toString(36).substr(2, 9),
        color: formData.color || 'bg-lime-400',
        duration: formData.duration || 60,
        reminderType: formData.reminderType || 'none',
        reminderValue: formData.reminderValue || 0,
        repeat: formData.repeat || 'none',
        description: formData.description || '',
      } as CalendarEvent);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lime-900/10 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 border border-lime-100 max-h-[85vh] flex flex-col relative shadow-lime-200/40">
        
        {/* Condensed Header with Save Button on Right */}
        <div className="px-6 py-4 border-b border-lime-50 bg-white z-20 flex items-center justify-between">
          <button onClick={onClose} className="p-2 hover:bg-lime-50 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <CuteAppleIcon className="w-6 h-6" />
            <h3 className="text-xl font-medium text-slate-800 font-clean-cute tracking-widest uppercase">{formData.id ? t.edit : t.add}</h3>
          </div>

          <button 
            type="button"
            onClick={() => handleSubmit()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-lime-400 to-green-500 text-white rounded-full shadow-lg active:scale-95 transition-all"
          >
            <span className="font-clean-cute text-sm font-bold tracking-widest">{t.save}</span>
            <Check size={16} strokeWidth={3} />
          </button>
        </div>

        <form className="p-6 space-y-4 overflow-y-auto no-scrollbar pb-10">
          {!formData.id && (
            <button type="button" onClick={onUploadRequest} className="w-full flex items-center justify-center gap-2 bg-lime-50/40 border border-dashed border-lime-200 text-lime-600 font-medium py-2.5 rounded-2xl text-[14px] font-clean-cute tracking-widest hover:bg-lime-100 transition-all">
              <Upload size={14} /> {t.extract}
            </button>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-lime-600 uppercase tracking-[0.2em] font-clean-cute flex items-center gap-2 ml-1">
              <Type size={12} /> {t.name}
            </label>
            <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-lime-50/20 border border-transparent rounded-xl focus:border-lime-100 outline-none font-medium text-[16px] font-clean-cute tracking-wider placeholder:opacity-30 shadow-inner"
              placeholder={t.placeholderTitle}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-lime-600 font-clean-cute tracking-[0.2em] flex items-center gap-1.5 ml-1">
                <CalendarIcon size={12} /> {t.date}
              </label>
              <input type="date" required value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 bg-lime-50/20 border border-transparent rounded-xl outline-none font-medium text-[13px] font-clean-cute tracking-wider shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-lime-600 font-clean-cute tracking-[0.2em] flex items-center gap-1.5 ml-1">
                <Clock size={12} /> {t.time}
              </label>
              <input type="time" required value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2.5 bg-lime-50/20 border border-transparent rounded-xl outline-none font-medium text-[13px] font-clean-cute tracking-wider shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-lime-600 font-clean-cute tracking-[0.2em] flex items-center gap-1.5 ml-1">
                <MapPin size={12} /> {t.place}
              </label>
              <input type="text" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2.5 bg-lime-50/20 border border-transparent rounded-xl outline-none font-medium text-[13px] font-clean-cute tracking-wider placeholder:opacity-30 shadow-inner"
                placeholder={t.placeholderPlace}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-lime-600 font-clean-cute tracking-[0.2em] flex items-center gap-1.5 ml-1">
                <RefreshCw size={12} /> {t.repeat}
              </label>
              <CuteSelect 
                value={formData.repeat || 'none'} 
                options={t.repeatTypes} 
                onChange={val => setFormData({ ...formData, repeat: val as any })} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-lime-600 font-clean-cute tracking-[0.2em] flex items-center gap-1.5 ml-1">
              <Bell size={12} /> {t.reminder}
            </label>
            <div className="flex gap-3">
              <input type="number" min="0" value={formData.reminderValue || 0} onChange={e => setFormData({ ...formData, reminderValue: parseInt(e.target.value) })}
                className="w-16 py-2.5 bg-lime-50/20 border border-transparent rounded-xl outline-none font-medium text-center text-[15px] font-clean-cute tracking-widest shadow-inner"
              />
              <CuteSelect 
                value={formData.reminderType || 'none'} 
                options={t.reminderTypes} 
                onChange={val => setFormData({ ...formData, reminderType: val as any })} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-lime-600 font-clean-cute tracking-[0.2em] flex items-center gap-1.5 ml-1">
              <Notebook size={12} /> {t.notes}
            </label>
            <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[80px] bg-lime-50/10 border border-transparent rounded-2xl p-4 text-[15px] text-slate-700 outline-none focus:border-lime-100 font-free leading-relaxed resize-none paper-texture placeholder:opacity-30 tracking-wider"
              placeholder={t.placeholderNotes}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-lime-600" />
              <span className="text-[11px] font-medium text-lime-600 uppercase tracking-[0.2em] font-clean-cute">{t.theme}</span>
            </div>
            <div className="flex gap-2.5">
              {COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setFormData({ ...formData, color: c.value })}
                  className={`w-6 h-6 rounded-lg ${c.value} border-2 transition-all ${formData.color === c.value ? 'border-white ring-1 ring-lime-300 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          {formData.id && onDelete && (
            <div className="pt-2 border-t border-rose-50">
              <button type="button" onClick={() => { onDelete(formData.id!); onClose(); }}
                className="w-full py-2.5 text-rose-300 hover:text-rose-500 font-medium rounded-xl text-[13px] font-clean-cute tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                {t.delete}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EventModal;
