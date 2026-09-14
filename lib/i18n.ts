'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import themeConfig from '../theme.config';
import ae from '../public/locales/ae/translation.json';
import da from '../public/locales/da/translation.json';
import de from '../public/locales/de/translation.json';
import el from '../public/locales/el/translation.json';
import en from '../public/locales/en/translation.json';
import es from '../public/locales/es/translation.json';
import fr from '../public/locales/fr/translation.json';
import hu from '../public/locales/hu/translation.json';
import it from '../public/locales/it/translation.json';
import ja from '../public/locales/ja/translation.json';
import pl from '../public/locales/pl/translation.json';
import pt from '../public/locales/pt/translation.json';
import ru from '../public/locales/ru/translation.json';
import sv from '../public/locales/sv/translation.json';
import tr from '../public/locales/tr/translation.json';
import zh from '../public/locales/zh/translation.json';

const resources = {
    ae: { translation: ae },
    da: { translation: da },
    de: { translation: de },
    el: { translation: el },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    hu: { translation: hu },
    it: { translation: it },
    ja: { translation: ja },
    pl: { translation: pl },
    pt: { translation: pt },
    ru: { translation: ru },
    sv: { translation: sv },
    tr: { translation: tr },
    zh: { translation: zh },
};

if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources,
        lng: themeConfig.locale || 'en',
        fallbackLng: themeConfig.locale || 'en',
        debug: false,
        load: 'languageOnly',
        interpolation: { escapeValue: false },
    });
}

export default i18n;
