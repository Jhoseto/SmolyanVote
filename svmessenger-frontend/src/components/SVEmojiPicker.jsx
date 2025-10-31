import React, { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

// Български преводи за emoji категории
const bgMessages = {
  search: 'Търсене',
  clear: 'Изчисти',
  notfound: 'Емоджита не са намерени',
  choose: 'Избери цвят на кожа',
  categories: {
    search: 'Резултати от търсене',
    recent: 'Наскоро използвани',
    smileys: 'Усмивки и хора',
    people: 'Хора и тяло',
    nature: 'Природа',
    foods: 'Храна и напитки',
    activity: 'Дейности',
    places: 'Пътуване и места',
    objects: 'Обекти',
    symbols: 'Символи',
    flags: 'Знамена',
    custom: 'Персонализирани',
  },
  categorieslabel: 'Категории',
  skintones: {
    1: 'По подразбиране',
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
