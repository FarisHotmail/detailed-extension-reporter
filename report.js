document.addEventListener('DOMContentLoaded', async () => {
    let translations = {};

    const getLangFromURL = () => new URLSearchParams(window.location.search).get('lang');
    const _ = (key) => translations[key] || key;

    const loadTranslations = async (lang) => {
        try {
            const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const messages = await response.json();
            
            for (const key in messages) {
                translations[key] = messages[key].message;
            }
        } catch (error) {
            console.error(`Could not load translations for ${lang}, falling back to 'en'`, error);
            if (lang !== 'en') {
                await loadTranslations('en');
            }
        }
    };

    const urlLang = getLangFromURL();
    const { language: savedLang } = await chrome.storage.local.get('language');
    const browserLang = navigator.language.split('-')[0];
    const targetLang = urlLang || savedLang || browserLang || 'en';

    if (urlLang !== targetLang) {
        window.location.href = `report.html?lang=${targetLang}`;
        return;
    }

    await loadTranslations(targetLang);

    const themeToggleButton = document.getElementById('theme-toggle-button');
    const tableBody = document.getElementById('extension-list');
    const languageSelector = document.getElementById('language-selector');
    
    const supportedLangs = {
        'af': 'Afrikaans', 'ar': 'العربية', 'de': 'Deutsch', 'en': 'English', 'es': 'Español', 
        'fr': 'Français', 'hi': 'हिन्दी', 'id': 'Bahasa Indonesia', 'it': 'Italiano', 
        'ms': 'Bahasa Melayu', 'pt': 'Português', 'ru': 'Русский', 'th': 'ไทย', 
        'tl': 'Tagalog', 'tr': 'Türkçe', 'vi': 'Tiếng Việt', 'zu': 'isiZulu'
    };

    const localizeStaticElements = () => {
        document.title = _('pageTitle');
        document.getElementById('app-title').textContent = _('appName');
        document.getElementById('header-name').textContent = _('tableHeaderName');
        document.getElementById('header-status').textContent = _('tableHeaderStatus');
        document.getElementById('header-version').textContent = _('tableHeaderVersion');
        document.getElementById('header-links').textContent = _('tableHeaderLinks');
    };

    const populateLanguageSelector = (currentLang) => {
        for (const [code, name] of Object.entries(supportedLangs)) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            if (code === currentLang) option.selected = true;
            languageSelector.appendChild(option);
        }
    };
    
    const applyPageSettings = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = ['ar'].includes(lang) ? 'rtl' : 'ltr';
    };

    const handleLanguageChange = async () => {
        const selectedLang = languageSelector.value;
        await chrome.storage.local.set({ language: selectedLang });
        window.location.href = `report.html?lang=${selectedLang}`;
    };

    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
    };

    const toggleAndSaveTheme = async () => {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        applyTheme(newTheme);
        await chrome.storage.local.set({ theme: newTheme });
    };

    const loadExtensionData = async () => {
        tableBody.innerHTML = `<tr><td colspan="4">${_('loadingData')}</td></tr>`;
        try {
            const extensions = await chrome.management.getAll();
            tableBody.innerHTML = '';
            const fragment = document.createDocumentFragment();
            extensions.filter(ext => ext.type === 'extension').forEach((ext, index) => {
                const mainRow = document.createElement('tr');
                mainRow.classList.add('main-row');
                mainRow.dataset.targetId = `details-${index}`;
                const permissionsText = [...ext.permissions, ...ext.hostPermissions].join(', ') || _('none');
                let linksHTML = '';
                if (ext.homepageUrl) linksHTML += `<a href="${ext.homepageUrl}" target="_blank">${_('linkHomepage')}</a>`;
                if (ext.optionsUrl) linksHTML += `<a href="${ext.optionsUrl}" target="_blank">${_('linkOptions')}</a>`;
                const statusClass = ext.enabled ? 'enabled' : 'disabled';
                const statusText = ext.enabled ? _('statusEnabled') : _('statusDisabled');
                mainRow.innerHTML = `<td class="extension-name-cell" data-label="${_('tableHeaderName')}"><img src="${(ext.icons && ext.icons[0]?.url) ? ext.icons[0].url : 'icons/icon16.png'}" width="20" height="20" alt="${ext.name}"><span>${ext.name}</span></td><td data-label="${_('tableHeaderStatus')}"><span class="value ${statusClass}">${statusText}</span></td><td data-label="${_('tableHeaderVersion')}"><span class="value">${ext.version}</span></td><td class="links" data-label="${_('tableHeaderLinks')}">${linksHTML || '<span>-</span>'}</td>`;
                fragment.appendChild(mainRow);
                const detailsRow = document.createElement('tr');
                detailsRow.id = `details-${index}`;
                detailsRow.classList.add('details-row');
                const formatBool = (val) => val ? `<span class="enabled">${_('yes')}</span>` : `<span class="disabled">${_('no')}</span>`;
                const hostPermissionsText = ext.hostPermissions.join(', ') || _('noHostPermissions');
                detailsRow.innerHTML = `<td colspan="4"><dl class="details-list"><dt>${_('detailsDescription')}</dt><dd>${ext.description || _('none')}</dd><dt>${_('detailsId')}</dt><dd class="code">${ext.id}</dd><dt>${_('detailsPermissions')}</dt><dd>${permissionsText}</dd><dt>${_('detailsHostPermissions')}</dt><dd>${hostPermissionsText}</dd><dt>${_('detailsInstallType')}</dt><dd>${ext.installType}</dd><dt>${_('detailsIncognito')}</dt><dd>${formatBool(ext.isAllowedInIncognito)}</dd><dt>${_('detailsFileAccess')}</dt><dd>${formatBool(ext.isAllowedFileUrlAccess)}</dd></dl></td>`;
                fragment.appendChild(detailsRow);
            });
            tableBody.appendChild(fragment);
        } catch (error) {
            console.error("Error fetching extension data:", error);
            tableBody.innerHTML = `<tr><td colspan="4">${_('errorFetch')}</td></tr>`;
        }
    };

    const initialize = async () => {
        applyPageSettings(targetLang);
        localizeStaticElements();
        populateLanguageSelector(targetLang);
        const { theme } = await chrome.storage.local.get('theme');
        applyTheme(theme || 'light');
        themeToggleButton.addEventListener('click', toggleAndSaveTheme);
        languageSelector.addEventListener('change', handleLanguageChange);
        tableBody.addEventListener('click', (event) => {
            const mainRow = event.target.closest('.main-row');
            if (!mainRow || event.target.tagName === 'A') return;
            const targetId = mainRow.dataset.targetId;
            const detailsRow = document.getElementById(targetId);
            if (detailsRow) {
                mainRow.classList.toggle('active');
                detailsRow.classList.toggle('visible');
            }
        });
        await loadExtensionData();
    };
    
    initialize();
});
