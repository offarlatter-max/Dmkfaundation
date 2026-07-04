import { v4 as uuidv4 } from 'uuid';

export const generateAdminId = () => {
  return 'ADM' + Date.now() + Math.floor(Math.random() * 1000);
};

export const generateStaffId = () => {
  return 'STF' + Date.now() + Math.floor(Math.random() * 1000);
};

export const generateCustomerId = () => {
  return 'CUS' + Date.now() + Math.floor(Math.random() * 1000);
};

export const generateLoanId = () => {
  return 'LON' + Date.now() + Math.floor(Math.random() * 1000);
};

export const generateBranchId = () => {
  return 'BR' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
};

export const generateTransactionId = () => {
  return 'TXN' + Date.now() + Math.floor(Math.random() * 10000);
};

export const generateUUID = () => {
  return uuidv4();
};
