document.addEventListener('DOMContentLoaded', async () => {
    // Tarayıcının arayüz dilini al (örn: "tr-TR" -> "tr")
    const lang = chrome.i18n.getUILanguage().split('-')[0];
    let translations = {};

    // Çeviri dosyasını yükle
    try {
        const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Defaulting to English');
        const messages = await response.json();
        for (const key in messages) {
            translations[key] = messages[key].message;
        }
    } catch (error) {
        // Hata olursa veya dil desteklenmiyorsa İngilizce'ye dön
        console.warn(`Could not load translations for '${lang}', falling back to 'en'.`);
        const url = chrome.runtime.getURL(`_locales/en/messages.json`);
        const response = await fetch(url);
        const messages = await response.json();
        for (const key in messages) {
            translations[key] = messages[key].message;
        }
    }

    // Basit bir çeviri yardımcısı
    const _ = (key) => translations[key] || `[${key}]`;

    // HTML'i doldur
    document.documentElement.lang = lang;
    document.title = _('welcomePageTitle');
    document.getElementById('welcome-title').textContent = _('welcomeTitle');
    document.getElementById('welcome-intro').textContent = _('welcomeIntro');
    document.getElementById('privacy-title').textContent = _('privacyTitle');
    document.getElementById('privacy-text').textContent = _('privacyText');
    document.getElementById('permissions-title').textContent = _('permissionsTitle');
    document.getElementById('permissions-intro').textContent = _('permissionsIntro');
    document.getElementById('management-description').textContent = _('managementDescription');
    document.getElementById('storage-description').textContent = _('storageDescription');
    document.getElementById('opensource-title').textContent = _('openSourceTitle');

    // GitHub bağlantısını oluştur
    const githubUrl = "[GITHUB_URL_PLACEHOLDER]";
    document.getElementById('opensource-text-container').innerHTML = 
        `${_('openSourceText')} <a href="${githubUrl}" target="_blank">${_('githubLinkText')}</a>.`;
});