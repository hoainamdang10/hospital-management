// lib/emailjs.ts
import emailjs from '@emailjs/browser';

export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_firjd2k',
  TEMPLATE_ID: 'template_2fun97i',
  PUBLIC_KEY: 'uLUmnGJzcad9zNY58', // Thay bằng Public Key
};

if (typeof window !== 'undefined') {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

export interface ContactFormData {
  from_name: string;
  phone: string;
  from_email: string;
  subject: string;
  message: string;
  sent_time: string;
}

export const sendContactEmail = async (data: ContactFormData) => {
  try {
    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      {
        ...data,
        sent_time: new Date().toLocaleString('vi-VN'),
      }
    );
    
    return { success: true, result };
  } catch (error) {
    console.error('EmailJS Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};