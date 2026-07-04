export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhoneNumber = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone.replace(/[\s-]/g, ''));
};

export const validateAadhaar = (aadhaar) => {
  return aadhaar.replace(/\s/g, '').length === 12 && /^[0-9]+$/.test(aadhaar);
};

export const validatePAN = (pan) => {
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$|^[0-9]{12}$|^[0-9]{9}[A-Z]{1}$/;
  return regex.test(pan.toUpperCase());
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const validateFormData = (data, requiredFields) => {
  const errors = [];
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
};

export const sanitizeInput = (input) => {
  return input.replace(/[<>"']/g, (char) => {
    const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return escapeMap[char];
  });
};
