import React, { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

/**
 * Emoji Picker компонент с emoji-mart
 * Опаковка около @emoji-mart/react с кастомизация
 */
const SVEmojiPicker = ({ onEmojiSelect, onClose, show }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="svmessenger-emoji-picker-wrapper">
      <div className="svmessenger-emoji-picker-backdrop" onClick={onClose}></div>
      <div className="svmessenger-emoji-picker-container">
        <Picker
          ref={pickerRef}
          data={data}
          onEmojiSelect={onEmojiSelect}
          skinTonePosition="search"
          previewPosition="none"
          searchPosition="bottom"
          theme="light"
          locale="bg"
          perLine={7}
          emojiSize={20}
          emojiButtonSize={28}
        />
      </div>
    </div>
  );
};

export default SVEmojiPicker;
