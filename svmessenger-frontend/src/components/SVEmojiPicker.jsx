import React, { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

// Български преводи за emoji-mart - ПРАВИЛНА СТРУКТУРА
const bgMessages = {
  search: 'Търсене',
  search_no_results_1: 'О, не!',
  search_no_results_2: 'Няма намерени емоджита',
  pick: 'Избери емоджи',
  categories: {
    activity: 'Активности',
    custom: 'Персонализирани',
    flags: 'Знамена',
    foods: 'Храна и напитки',
    frequent: 'Често използвани',
    nature: 'Природа',
    objects: 'Обекти',
    people: 'Хора',
    places: 'Места',
    search: 'Търсене',
    smileys: 'Усмивки',
    symbols: 'Символи',
  },
  skins: {  // ← skins вместо skintones
    choose: 'Избери тон',  // ← choose е тук вместо в root
    1: 'Стандартен',
    2: 'Светъл',
    3: 'Средно светъл',
    4: 'Среден',
    5: 'Средно тъмен',
    6: 'Тъмен',
  },
};

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
          i18n={bgMessages}
          perLine={7}
          emojiSize={20}
          emojiButtonSize={28}
        />
      </div>
    </div>
  );
};

export default SVEmojiPicker;
