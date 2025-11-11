import React from 'react';

/**
 * Call Button компонент за SVMessenger
 * Показва телефонен бутон в chat header
 */
const SVCallButton = ({ onClick, disabled = false }) => {
  return (
    <button
      className="svmessenger-call-btn"
      onClick={onClick}
      disabled={disabled}
      title="Start voice call"
      type="button"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 5.5C3 14.06 9.94 21 18.5 21C19.38 21 20.23 20.9 21.05 20.72C21.44 20.63 21.78 20.39 21.95 20.02C22.12 19.65 22.1 19.24 21.9 18.9L20.5 16.5C20.34 16.22 20.07 16.05 19.77 16.03C19.47 16.01 19.18 16.14 18.98 16.36L16.62 18.72C16.24 19.1 15.62 19.05 15.29 18.62C13.57 16.5 11.5 14.43 9.38 12.71C8.95 12.38 8.9 11.76 9.28 11.38L11.64 9.02C11.86 8.82 11.99 8.53 11.97 8.23C11.95 7.93 11.78 7.66 11.5 7.5L9.1 6.1C8.76 5.9 8.35 5.88 7.98 6.05C7.61 6.22 7.37 6.56 7.28 6.95C7.1 7.77 7 8.62 7 9.5C7 9.78 6.78 10 6.5 10C6.22 10 6 9.78 6 9.5C6 8.57 6.1 7.67 6.28 6.8L3.9 3.9C3.62 3.62 3.5 3.22 3.62 2.85C3.74 2.48 4.07 2.23 4.45 2.27C6.06 2.43 7.58 2.84 9 3.56L3 5.5Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
};

export default SVCallButton;
