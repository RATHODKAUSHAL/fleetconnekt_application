// Laravel API base, e.g. http://192.168.1.10:8000/api (use your machine's LAN IP on a device).
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api').replace(/\/$/, '');

// Public website, used to open transporter listings that live only on the web.
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://fleetconnekt.com').replace(/\/$/, '');

// Optional: lets booking city search fall back to Google Places, like the website does.
export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';
