import { config } from '../config';

export const generateWebAppUrl = (query) => {
    const baseUrl = config.webAppBaseUrl || 'https://your-webapp-domain.com';
    return `${baseUrl}?query=${encodeURIComponent(query)}`;
};