
import React from 'react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { Sparkles, BellRing, Home, User as UserIcon, Settings, LogOut, ChevronRight, Camera, Image as ImageIcon, Mic, Coffee, MessageCircle, Cloud, CloudCheck } from 'lucide-react';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import AuthModal from './components/AuthModal';
import { CalendarEvent, User } from './types';
import { extractEventFromImage } from './services/geminiService';
import { apiService } from './services/apiService';
import { GoogleGenAI, Type } from "@google/genai";

type Language = 'zh' | 'en';

const CuteAppleIcon = ({ className = "w-6 h-6", showDate = false }) => {
  const day = format(new Date(), 'd');
  const month = format(new Date(), 'MMM').toUpperCase();
  
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M45 25 C45 15, 40 10, 35 10" stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M52 22 C65 10, 75 15, 75 25 C75 35, 65 30, 52 22" fill="#84cc16" />
      <path d="M50 30 C35 25, 15 35, 15 60 C15 85, 40 95, 50 90 C60 95, 85 85, 85 60 C85 35, 65 25, 50 30" fill="#bef264" />
      <path d="M50 30 C65 25, 85 35, 85 60 C85 85, 60 95, 50 90 L50 30" fill="#84cc16" fillOpacity="0.2" />
      {showDate && (
        <g textAnchor="middle" fill="white" className="font-bold select-none">
          <text x="50" y="62" fontSize="24" style={{ fontFamily: 'Arial, sans-serif' }}>{day}</text>
          <text x="50" y="78" fontSize="12" style={{ fontFamily: 'Arial, sans-serif' }}>{month}</text>
        </g>
      )}
    </svg>
  );
};

const TRANSLATIONS = {
  zh: {
    title: '青苹果日历',
    addEvent: '计划',
    me: '我',
    tipTitle: '时光贴士',
    tipContent: '点击日期，AI提取灵感。🍎',
    analyzing: '正在解析...',
    compressing: '优化照片中...',
    analyzingSub: '正在提取时间与地点 🍏',
    noImage: '抱歉，识别失败。请换张更清晰的照片📸',
    importAlbum: '相册导入',
    takePhoto: '拍摄照片',
    voiceInput: '语音输入',
    listening: '请说话，我听着呢...',
    profileName: '时光旅人',
    profileBadge: '游客 🍃',
    premiumBadge: '云端同步员 🍏',
    loginBtn: '登录并同步云端',
    logoutBtn: '退出登录',
    settingNotify: '提醒',
    settingPref: '偏好',
    settingContact: '联系我们',
    settingDonation: '请我喝咖啡 ☕',
    settingLogout: '退出',
    energyTitle: '元气满满! 🍹',
    energyDesc: (count: number) => `本月已记录 ${count} 个瞬间。`,
    defaultQuote: '今天也要像苹果一样清脆乐观！',
    syncing: '同步中...',
    synced: '云端已安全',
    voiceError: '浏览器不支持语音或权限被拒 🎙️'
  },
  en: {
    title: 'Lumina',
    addEvent: 'Plans',
    me: 'Me',
    tipTitle: 'Tip',
    tipContent: 'Click date, AI extracts. 🍎',
    analyzing: 'Analyzing...',
    compressing: 'Optimizing...',
    analyzingSub: 'Extracting details 🍏',
    noImage: 'Detection failed. Try clearer photo📸',
    importAlbum: 'Album',
    takePhoto: 'Camera',
    voiceInput: 'Voice Input',
    listening: 'Listening...',
    profileName: 'Traveler',
    profileBadge: 'Guest 🍃',
    premiumBadge: 'Cloud Synced 🍏',
    loginBtn: 'Login & Sync',
    logoutBtn: 'Logout',
    settingNotify: 'Alerts',
    settingPref: 'Settings',
    settingContact: 'Contact Us',
    settingDonation: 'Support Us ☕',
    settingLogout: 'Logout',
    energyTitle: 'Stay Fresh! 🍹',
    energyDesc: (count: number) => `${count} moments captured.`,
    defaultQuote: 'Stay crisp and optimistic today!',
    syncing: 'Syncing...',
    synced: 'Safe in Cloud',
    voiceError: 'Voice not supported or denied 🎙️'
  }
};

const App: React.FC = () => {
  const [lang, setLang] = React.useState<Language>('zh');
  const [currentUser, setCurrentUser] = React.useState<User | null>(() => {
    const saved = localStorage.getItem('lumina_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [activeTab, setActiveTab] = React.useState<'calendar' | 'profile'>('calendar');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Partial<CalendarEvent>>({});
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingState, setProcessingState] = React.useState<'compressing' | 'analyzing'>('analyzing');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [showCameraMenu, setShowCameraMenu] = React.useState(false);
  const [dailyQuote, setDailyQuote] = React.useState({ zh: '', en: '' });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  // 压缩图片逻辑 (核心修复移动端上传)
  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 1024; // 移动端 1024 宽足够 AI 识别

        if (width > max || height > max) {
          if (width > height) {
            height = (height / width) * max;
            width = max;
          } else {
            width = (width / height) * max;
            height = max;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // 输出 jpg 格式并降低质量以减小体积
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  // 语音输入逻辑 (兼容性增强)
  const handleVoiceInput = () => {
    setShowCameraMenu(false);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert(t.voiceError);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setProcessingState('analyzing');
      setIsProcessing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
        const today = format(new Date(), 'yyyy-MM-dd, EEEE');
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `提取事件 JSON。语音内容："${transcript}"。参考时间：${today}。`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                location: { type: Type.STRING },
                color: { type: Type.STRING },
                duration: { type: Type.NUMBER },
                repeat: { type: Type.STRING },
              },
              required: ["name", "date", "time"],
            }
          }
        });
        if (response.text) {
          const extracted = JSON.parse(response.text);
          setSelectedEvent({ ...extracted, id: undefined, repeat: extracted.repeat || 'none' });
          setIsModalOpen(true);
        }
      } catch (err) { 
        console.error(err); 
        alert(t.noImage);
      } finally { 
        setIsProcessing(false); 
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      setIsListening(false);
      if (e.error === 'not-allowed') alert(t.voiceError);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      alert(t.voiceError);
    }
  };

  React.useEffect(() => {
    const load = async () => {
      const data = await apiService.fetchEvents(currentUser?.id || 'guest');
      setEvents(data);
    };
    load();
  }, [currentUser]);

  const fetchDailyQuote = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate a very short optimistic daily quote. One sentence. Return JSON with 'zh' and 'en' keys.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              zh: { type: Type.STRING },
              en: { type: Type.STRING }
            },
            required: ["zh", "en"]
          }
        }
      });
      if (response.text) setDailyQuote(JSON.parse(response.text));
    } catch (e) {
      setDailyQuote({ zh: TRANSLATIONS.zh.defaultQuote, en: TRANSLATIONS.en.defaultQuote });
    }
  };

  React.useEffect(() => { fetchDailyQuote(); }, []);

  const handleLogin = async (username: string) => {
    const user = await apiService.login(username);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProcessingState('compressing');
    setIsProcessing(true);
    setShowCameraMenu(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawBase64 = event.target?.result as string;
        // 压缩后再上传
        const compressedBase64 = await compressImage(rawBase64);
        
        setProcessingState('analyzing');
        const extracted = await extractEventFromImage(compressedBase64);
        
        if (extracted) {
          setSelectedEvent({ ...extracted, id: undefined, repeat: extracted.repeat || 'none' });
          setIsModalOpen(true);
        } else {
          alert(t.noImage);
        }
      } catch (err) {
        console.error("File Upload Handling Error:", err);
        alert(t.noImage);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveEvent = async (newEvent: CalendarEvent) => {
    setIsSyncing(true);
    setEvents(prev => {
      const index = prev.findIndex(e => e.id === newEvent.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = newEvent;
        return updated;
      }
      return [...prev, newEvent];
    });
    
    await apiService.syncEvent(newEvent);
    setIsSyncing(false);
  };

  const deleteEvent = async (id: string) => {
    setIsSyncing(true);
    setEvents(prev => prev.filter(e => e.id !== id));
    await apiService.deleteEvent(id);
    setIsSyncing(false);
  };

  return (
    <div className="flex-1 flex flex-col selection:bg-lime-100">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full pb-32">
        {activeTab === 'calendar' ? (
          <div className="flex flex-col space-y-5">
            <header className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                 <div className="apple-wobble w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-lime-200/40 transition-all cursor-pointer">
                   <CuteAppleIcon className="w-10 h-10 md:w-12 h-12" showDate={true} />
                 </div>
                 <div>
                   <div className="flex items-center gap-2">
                    <h1 className="text-3xl md:text-5xl font-medium text-slate-800 tracking-wider font-clean-cute leading-none">{t.title}</h1>
                    {currentUser && (
                      <div className="animate-pulse">
                        <CloudCheck size={16} className="text-lime-400" />
                      </div>
                    )}
                   </div>
                   <p className="font-clean-cute text-[13px] md:text-[15px] text-lime-600/70 mt-0.5 tracking-wide">{dailyQuote[lang] || t.defaultQuote}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isSyncing && (
                  <span className="text-[10px] font-bold text-lime-400 font-clean-cute uppercase tracking-widest hidden sm:inline">{t.syncing}</span>
                )}
                <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="px-2.5 py-1 bg-white border border-lime-100 rounded-lg text-slate-500 text-[11px] font-medium font-clean-cute shadow-sm hover:bg-lime-50 transition-colors">
                  {lang === 'zh' ? 'EN' : 'ZH'}
                </button>
                <div className="relative">
                  <button onClick={() => setShowCameraMenu(!showCameraMenu)} className="p-2.5 bg-gradient-to-br from-lime-400 to-green-500 rounded-xl text-white shadow-lg active:scale-95 transition-all shadow-lime-200/30">
                    <Camera size={18} />
                  </button>
                  {showCameraMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCameraMenu(false)} />
                      <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-lime-100 z-50 overflow-hidden p-1.5 shadow-lime-100/10">
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-lime-50 rounded-2xl transition-colors">
                          <ImageIcon size={16} className="text-lime-500" />
                          <span className="text-[18px] font-medium font-clean-cute text-slate-700 tracking-wider">{t.importAlbum}</span>
                        </button>
                        <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-orange-50 rounded-2xl transition-colors">
                          <Camera size={16} className="text-orange-500" />
                          <span className="text-[18px] font-medium font-clean-cute text-slate-700 tracking-wider">{t.takePhoto}</span>
                        </button>
                        <button onClick={handleVoiceInput} className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-blue-50 rounded-2xl transition-colors">
                          <Mic size={16} className="text-blue-500" />
                          <span className="text-[18px] font-medium font-clean-cute text-slate-700 tracking-wider">{t.voiceInput}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1">
              <Calendar 
                events={events} 
                onDateClick={(d) => { setSelectedEvent({date: format(d, 'yyyy-MM-dd'), time: '09:00', name: '', color: 'bg-lime-400', repeat: 'none'}); setIsModalOpen(true); }} 
                onEventClick={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} 
                locale={lang === 'zh' ? zhCN : enUS} 
              />
            </div>
            
            <div className="p-4 bg-gradient-to-br from-lime-50/40 to-orange-50/40 rounded-[2rem] border border-white items-center flex gap-4 shadow-sm shadow-lime-100/10">
              <Sparkles size={20} className="text-lime-500" />
              <div className="flex flex-col">
                <h4 className="text-[12px] font-medium text-lime-600 uppercase tracking-widest font-clean-cute">{t.tipTitle}</h4>
                <p className="text-[20px] text-slate-600 font-medium font-clean-cute leading-relaxed tracking-wide">{t.tipContent}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-center space-y-1.5 pt-2">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-yellow-400 p-0.5 shadow-xl shadow-lime-100/20">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {currentUser ? (
                      <div className="w-full h-full bg-lime-100 flex items-center justify-center text-lime-600 font-bold text-xl font-clean-cute">
                        {currentUser.username[0].toUpperCase()}
                      </div>
                    ) : (
                      <UserIcon size={32} className="text-slate-200" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 p-1 bg-white text-white rounded-full border-2 border-lime-100 shadow-md animate-bounce">
                   <CuteAppleIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-0">
                <h2 className="text-4xl font-medium text-slate-800 font-clean-cute tracking-widest leading-tight">
                  {currentUser ? currentUser.username : t.profileName}
                </h2>
                <p className="text-[12px] font-medium text-lime-600 uppercase tracking-[0.15em] font-clean-cute leading-none">
                  {currentUser ? t.premiumBadge : t.profileBadge}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[1.8rem] p-1.5 shadow-lg border border-lime-100/30 max-w-sm mx-auto">
              {!currentUser && (
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full flex items-center gap-3 p-4 bg-lime-50/50 rounded-2xl mb-2 text-lime-600 hover:bg-lime-100 transition-colors group"
                >
                  <Cloud size={20} className="group-hover:animate-bounce" />
                  <span className="font-bold font-clean-cute text-[18px] tracking-widest">{t.loginBtn}</span>
                </button>
              )}

              {[
                { icon: <BellRing size={18} />, label: t.settingNotify, color: 'text-orange-500 bg-orange-50' },
                { icon: <Settings size={18} />, label: t.settingPref, color: 'text-lime-600 bg-lime-50' },
                { icon: <MessageCircle size={18} />, label: t.settingContact, color: 'text-blue-500 bg-blue-50', onClick: () => alert('Contact: hi@lumina.ai') },
                { icon: <Coffee size={18} />, label: t.settingDonation, color: 'text-amber-500 bg-amber-50', onClick: () => alert('☕ Support received!') },
                currentUser ? { icon: <LogOut size={18} />, label: t.logoutBtn, color: 'text-slate-400 bg-slate-50', onClick: handleLogout } : null,
              ].filter(Boolean).map((item, i) => (
                <button key={i} onClick={item!.onClick} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-lime-50/40 rounded-xl transition-all group btn-active">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${item!.color} group-hover:rotate-6 transition-transform shadow-sm`}>{item!.icon}</div>
                    <span className="font-medium text-slate-700 text-[20px] font-clean-cute tracking-wide">{item!.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden group shadow-orange-100/40 max-w-sm mx-auto">
              <div className="absolute -bottom-4 -right-4 w-24 h-24 text-white/20 rotate-12 group-hover:scale-110 transition-transform duration-700">
                <CuteAppleIcon className="w-full h-full" />
              </div>
              <h3 className="font-clean-cute text-3xl font-medium mb-0.5 tracking-wider">{t.energyTitle}</h3>
              <p className="font-clean-cute text-[18px] opacity-90 tracking-wide">{t.energyDesc(events.length)}</p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[240px] md:w-[260px] bg-white/90 backdrop-blur-2xl border border-lime-100 p-1.5 flex items-center justify-center gap-2.5 z-40 rounded-full shadow-2xl shadow-lime-200/40">
        <div className="flex bg-lime-50/40 rounded-full p-1 border border-lime-50/50 shadow-inner w-full">
          <button onClick={() => setActiveTab('calendar')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${activeTab === 'calendar' ? 'bg-gradient-to-br from-lime-400 to-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-lime-500'}`}>
            <Home size={18} fill={activeTab === 'calendar' ? 'white' : 'transparent'} />
            <span className="text-[18px] font-medium uppercase font-clean-cute tracking-widest">{t.addEvent}</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${activeTab === 'profile' ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-orange-500'}`}>
            <UserIcon size={18} fill={activeTab === 'profile' ? 'white' : 'transparent'} />
            <span className="text-[18px] font-medium uppercase font-clean-cute tracking-widest">{t.me}</span>
          </button>
        </div>
      </nav>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={saveEvent} 
        onDelete={deleteEvent} 
        initialData={selectedEvent} 
        lang={lang} 
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={handleLogin} 
        lang={lang} 
      />

      {isListening && (
        <div className="fixed inset-0 z-[110] bg-blue-900/10 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl flex flex-col items-center gap-6 text-center border-4 border-blue-50 animate-in fade-in zoom-in">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
              <div className="p-6 bg-blue-500 text-white rounded-full shadow-lg relative z-10">
                <Mic size={48} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 font-clean-cute tracking-widest">{t.listening}</h3>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[120] bg-lime-900/10 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-6 text-center border-4 border-lime-50 max-w-xs w-full relative overflow-hidden animate-in fade-in zoom-in">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center animate-bounce shadow-xl shadow-lime-100/30">
              <CuteAppleIcon className="w-16 h-16" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-slate-800 uppercase font-clean-cute tracking-widest leading-tight">
                {processingState === 'compressing' ? t.compressing : t.analyzing}
              </h3>
              <p className="text-[18px] text-lime-600/60 font-medium font-clean-cute tracking-wide">{t.analyzingSub}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
