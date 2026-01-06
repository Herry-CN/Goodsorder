
import React, { useEffect, useRef } from 'react';

interface VoiceAlertProps {
  shouldAlert: boolean;
  message: string;
}

const VoiceAlert: React.FC<VoiceAlertProps> = ({ shouldAlert, message }) => {
  const lastAlertedRef = useRef<number>(0);

  useEffect(() => {
    if (shouldAlert && Date.now() - lastAlertedRef.current > 5000) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
      lastAlertedRef.current = Date.now();
    }
  }, [shouldAlert, message]);

  return null;
};

export default VoiceAlert;
