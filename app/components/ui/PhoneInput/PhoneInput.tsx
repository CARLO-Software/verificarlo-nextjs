'use client';

import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+51', flag: '🇵🇪', name: 'Perú', maxLength: 9 },
  { code: '+1', flag: '🇺🇸', name: 'EE.UU.', maxLength: 10 },
  { code: '+52', flag: '🇲🇽', name: 'México', maxLength: 10 },
  { code: '+57', flag: '🇨🇴', name: 'Colombia', maxLength: 10 },
  { code: '+56', flag: '🇨🇱', name: 'Chile', maxLength: 9 },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', maxLength: 10 },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador', maxLength: 9 },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia', maxLength: 8 },
  { code: '+55', flag: '🇧🇷', name: 'Brasil', maxLength: 11 },
  { code: '+34', flag: '🇪🇸', name: 'España', maxLength: 9 },
] as const;

type CountryCode = typeof COUNTRY_CODES[number]['code'];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string, rawNumber: string, countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  defaultCountry?: CountryCode;
}

export function PhoneInput({
  value,
  onChange,
  placeholder,
  disabled,
  error,
  className = '',
  defaultCountry = '+51',
}: PhoneInputProps) {
  const extractCountry = () => {
    for (const c of COUNTRY_CODES) {
      if (value.startsWith(c.code)) return c.code;
    }
    return defaultCountry;
  };

  const [selectedCode, setSelectedCode] = useState<string>(extractCountry);

  const country = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

  const rawNumber = value.startsWith(selectedCode) ? value.slice(selectedCode.length) : value.replace(/^\+\d+/, '');

  const handleNumberChange = (digits: string) => {
    const clean = digits.replace(/\D/g, '').slice(0, country.maxLength);
    onChange(clean ? `${selectedCode}${clean}` : '', clean, selectedCode);
  };

  const handleCodeChange = (code: string) => {
    setSelectedCode(code);
    const newCountry = COUNTRY_CODES.find((c) => c.code === code) || COUNTRY_CODES[0];
    const clean = rawNumber.replace(/\D/g, '').slice(0, newCountry.maxLength);
    onChange(clean ? `${code}${clean}` : '', clean, code);
  };

  return (
    <div className={`flex ${className}`}>
      <select
        value={selectedCode}
        onChange={(e) => handleCodeChange(e.target.value)}
        disabled={disabled}
        className={`
          inline-flex items-center px-2 py-2 border border-r-0 rounded-l-lg bg-gray-50 text-sm
          focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]
          ${error ? 'border-red-400' : 'border-gray-200'}
        `}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={rawNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder || country.maxLength === 9 ? '987 654 321' : '123 456 7890'}
        maxLength={country.maxLength + 3}
        disabled={disabled}
        className={`
          flex-1 px-3 py-2 border rounded-r-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-[#FFE14C]/50 focus:border-[#FFE14C]
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}
        `}
      />
    </div>
  );
}
