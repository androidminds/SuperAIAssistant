import {createI18n} from "vue-i18n";
import enMessages from './en'
import zhCNMessages from './zh-CN'
import zhTWMessages from './zh-TW'
import jaMessages from './ja'
import frMessages from './fr'
import deMessages from './de'
import ruMessages from './ru'
import koMessages from './ko'
import arMessages from './ar'
const messages = {
    'en': enMessages,
    'zh-CN': zhCNMessages,
    'zh-TW': zhTWMessages,
    'ja': jaMessages,
    'fr': frMessages,
    'de': deMessages,
    'ru': ruMessages,
    'ko': koMessages,
    'ar': arMessages,
}

const i18n = createI18n({
    legacy: false,
    locale: navigator.language,
    fallbackLocale: 'en',
    messages,
})

export default i18n;
