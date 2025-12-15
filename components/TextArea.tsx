import React, { useRef, useEffect } from 'react';

interface TextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

const TextArea: React.FC<TextAreaProps> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when value updates
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full h-full p-6 text-lg md:text-xl text-slate-800 bg-white border-0 resize-none focus:ring-0 focus:outline-none custom-scrollbar leading-relaxed"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      spellCheck={false}
    />
  );
};

export default TextArea;