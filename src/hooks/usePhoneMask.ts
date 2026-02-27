import { useState } from 'react';

export const usePhoneMask = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);

  const formatPhone = (phone: string): string => phone;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(formatPhone(e.target.value));
  };

  const setPhoneValue = (phone: string) => {
    setValue(formatPhone(phone));
  };

  const getCleanPhone = (): string => value.replace(/\D/g, '');

  return { value, setValue: setPhoneValue, onChange: handleChange, getCleanPhone };
};
