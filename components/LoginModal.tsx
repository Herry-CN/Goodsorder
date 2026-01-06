import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (success: boolean) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '888888') { // 简单密码：888888
      onLogin(true);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
        
        <div className="text-center mb-8 mt-2">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mx-auto mb-4">
            <i className="fas fa-user-shield"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800">管理员登录</h2>
          <p className="text-slate-400 text-sm mt-1">请输入管理密码以访问后台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              placeholder="请输入密码"
              className={`w-full p-4 bg-slate-50 border-2 rounded-xl text-center font-bold tracking-widest text-lg outline-none transition-all ${
                error 
                  ? 'border-rose-200 bg-rose-50 text-rose-600 focus:border-rose-500' 
                  : 'border-slate-100 focus:border-indigo-500 focus:bg-white'
              }`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
            />
            {error && (
              <p className="text-rose-500 text-xs text-center mt-2 font-bold animate-pulse">
                <i className="fas fa-exclamation-circle mr-1"></i> 密码错误，请重试
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            确认登录
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;