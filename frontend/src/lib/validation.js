// SmartRide AI - Frontend Validation & Input Sanitization Helper

// 1. Strict Email Format Regex
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test((email || '').trim());
};

// 2. Strict Password Strength Criteria: Min 8 chars, 1 Uppercase, 1 Number, 1 Special Char
export const validatePassword = (password) => {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

  const isValid = hasMinLength && hasUpper && hasNumber && hasSpecial;

  let message = '';
  if (!hasMinLength) message = 'Password must be at least 8 characters long.';
  else if (!hasUpper) message = 'Password must include at least one uppercase letter (A-Z).';
  else if (!hasNumber) message = 'Password must include at least one number (0-9).';
  else if (!hasSpecial) message = 'Password must include at least one special character (@, #, $, etc.).';

  return {
    isValid,
    hasMinLength,
    hasUpper,
    hasNumber,
    hasSpecial,
    message
  };
};

// 3. XSS Sanitizer
export const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&#39;';
      case '"': return '&quot;';
      default: return char;
    }
  }).trim();
};
