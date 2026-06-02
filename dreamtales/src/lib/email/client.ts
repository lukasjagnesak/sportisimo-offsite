import { Resend } from 'resend'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export const FROM_EMAIL = 'pohádky@dreamtales.eu'
export const FROM_NAME = 'DreamTales – Pohádky na dobrou noc'
