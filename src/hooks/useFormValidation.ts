interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

export const useFormValidation = () => {
  const validateField = (name: string, value: string, rules: ValidationRule): string | null => {
    if (rules.required && (!value || value.trim() === '')) return 'Este campo é obrigatório';
    if (!value || value.trim() === '') return null;
    if (rules.minLength && value.length < rules.minLength) return `Mínimo de ${rules.minLength} caracteres`;
    if (rules.maxLength && value.length > rules.maxLength) return `Máximo de ${rules.maxLength} caracteres`;
    if (rules.pattern && !rules.pattern.test(value)) return 'Formato inválido';
    if (rules.custom) return rules.custom(value);
    return null;
  };

  const validateForm = (data: Record<string, string>, rules: ValidationRules): ValidationErrors => {
    const errors: ValidationErrors = {};
    Object.keys(rules).forEach((fieldName) => {
      const error = validateField(fieldName, data[fieldName] || '', rules[fieldName]);
      if (error) errors[fieldName] = error;
    });
    return errors;
  };

  const hasErrors = (errors: ValidationErrors): boolean => Object.keys(errors).length > 0;
  const getFirstError = (errors: ValidationErrors): string | null => {
    const keys = Object.keys(errors);
    return keys.length > 0 ? errors[keys[0]] : null;
  };

  return { validateField, validateForm, hasErrors, getFirstError };
};

export const validationPatterns = {
  phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  money: /^\d+(\.\d{1,2})?$/,
};

export const commonValidations = {
  name: { required: true, minLength: 2, maxLength: 100 },
  phone: { required: true, minLength: 3 },
  email: { required: true, pattern: validationPatterns.email },
  value: {
    required: true,
    pattern: validationPatterns.money,
    custom: (value: string) => {
      const n = parseFloat(value);
      if (n <= 0) return 'Valor deve ser maior que zero';
      if (n > 10000) return 'Valor muito alto';
      return null;
    },
  },
  weeklyFrequency: {
    required: true,
    custom: (value: string) => {
      const n = parseInt(value);
      if (n < 1 || n > 7) return 'Frequência deve ser entre 1 e 7 dias';
      return null;
    },
  },
};
