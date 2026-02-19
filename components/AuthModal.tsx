
import React from 'react';
import { X, Mail, User as UserIcon, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
  lang: 'zh' | 'en';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, lang }) => {
  const [username, setUsername] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setIsSuccess(true);
    setTimeout(() => {
      onLogin(username);
      onClose();
      setIsSuccess(false);
    }, 1500);
  };

  const t = {
    zh: {
      title: '加入青苹果云',
      sub: '同步你的灵感瞬间 🍏',
      user: '昵称',
      login: '开启同步',
      success: '欢迎回来！',
      placeholder: '取个好听的名字'
    },
    en: {
      title: 'Join Lumina Cloud',
      sub: 'Sync your moments 🍏',
      user: 'Username',
      login: 'Enable Sync',
      success: 'Welcome back!',
      placeholder: 'Enter your name'
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-lime-900/20 backdrop-blur-xl">
      <div className="bg-white rounded-[3.5rem] w-full max-w-sm p-8 shadow-2xl border-4 border-lime-50 animate-in fade-in zoom-in-95 relative overflow-hidden">
        
        {isSuccess ? (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center text-lime-500 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 font-clean-cute tracking-widest">{t.success}</h2>
          </div>
        ) : (
          <>
            <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-lime-50 rounded-full text-slate-300 transition-colors">
              <X size={20} />
            </button>

            <div className="mb-8">
              <h2 className="text-4xl font-bold text-slate-800 font-clean-cute tracking-widest mb-2 leading-tight">{t.title}</h2>
              <p className="text-[18px] text-lime-600 font-medium font-clean-cute tracking-wide">{t.sub}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-lime-600 uppercase tracking-[0.2em] font-clean-cute ml-2 flex items-center gap-2">
                  <UserIcon size={14} /> {t.user}
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-6 py-4 bg-lime-50/30 border-2 border-transparent rounded-[1.8rem] focus:border-lime-200 outline-none text-[18px] font-clean-cute tracking-wider transition-all shadow-inner" 
                  placeholder={t.placeholder}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-gradient-to-br from-lime-400 to-green-500 text-white rounded-[1.8rem] shadow-xl shadow-lime-200/50 flex items-center justify-center gap-3 active:scale-95 transition-all group"
              >
                <span className="text-[20px] font-bold font-clean-cute tracking-[0.2em]">{t.login}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
