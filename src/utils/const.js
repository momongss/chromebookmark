export const constDatas = {};

class Text {
    constructor() {
        this.TEXT_SEARCH = chrome.i18n.getMessage("TEXT_SEARCH");
        this.POSTIT_TEXT = chrome.i18n.getMessage("POSTIT_TEXT");
        this.WALLPAPER_TEXT = chrome.i18n.getMessage("WALLPAPER_TEXT");
        this.EXPORT_TEXT = chrome.i18n.getMessage("EXPORT_TEXT");
        this.IMPORT_TEXT = chrome.i18n.getMessage("IMPORT_TEXT");
        
        this.BOOKMARK_SEARCH_PLACEHOLDER = chrome.i18n.getMessage("BOOKMARK_SEARCH_PLACEHOLDER");
        
        this.OPEN_LOCATION = chrome.i18n.getMessage("OPEN_LOCATION");
    }
}

export const ConstText = new Text();