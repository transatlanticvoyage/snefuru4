import { ColtempData } from './favaCTCTypes';

// Event names used throughout the CTC system
export const CTC_EVENTS = {
  TEMPLATE_SELECTED: 'fava-template-selected',
  TEMPLATE_LOADED: 'fava-template-loaded',
  TEMPLATE_SHOW_ALL: 'fava-template-show-all',
  SHENDO_SHOW_CATEGORY: 'fava-shendo-show-category',
  TEMPLATE_PREVIEW: 'fava-template-preview',
  TEMPLATE_PREVIEW_CLEAR: 'fava-template-preview-clear'
} as const;

// Event detail interfaces
export interface TemplateSelectedEventDetail {
  templateId: number;
  template: ColtempData;
  utg_id: string;
}

export interface TemplateLoadedEventDetail {
  templateId: number;
  utg_id: string;
}

export interface TemplateShowAllEventDetail {
  utg_id: string;
}

export interface ShendoShowCategoryEventDetail {
  category: string;
  utg_id: string;
}

export interface TemplatePreviewEventDetail {
  templateId: number | null;
  template: ColtempData | null;
  utg_id: string;
}

// Event emitter utilities
export class CTCEventEmitter {
  static emitTemplateSelected(templateId: number, template: ColtempData, utg_id: string) {
    const event = new CustomEvent(CTC_EVENTS.TEMPLATE_SELECTED, {
      detail: { templateId, template, utg_id }
    });
    window.dispatchEvent(event);
  }

  static emitTemplateLoaded(templateId: number, utg_id: string) {
    const event = new CustomEvent(CTC_EVENTS.TEMPLATE_LOADED, {
      detail: { templateId, utg_id }
    });
    window.dispatchEvent(event);
  }

  static emitTemplateShowAll(utg_id: string) {
    const event = new CustomEvent(CTC_EVENTS.TEMPLATE_SHOW_ALL, {
      detail: { utg_id }
    });
    window.dispatchEvent(event);
  }

  static emitShendoShowCategory(category: string, utg_id: string) {
    const event = new CustomEvent(CTC_EVENTS.SHENDO_SHOW_CATEGORY, {
      detail: { category, utg_id }
    });
    window.dispatchEvent(event);
  }

  static emitTemplatePreview(templateId: number | null, template: ColtempData | null, utg_id: string) {
    const event = new CustomEvent(CTC_EVENTS.TEMPLATE_PREVIEW, {
      detail: { templateId, template, utg_id }
    });
    window.dispatchEvent(event);
  }

  static emitTemplatePreviewClear(utg_id: string) {
    const event = new CustomEvent(CTC_EVENTS.TEMPLATE_PREVIEW_CLEAR, {
      detail: { templateId: null, template: null, utg_id }
    });
    window.dispatchEvent(event);
  }
}

// Event listener utilities
export class CTCEventListener {
  static onTemplateSelected(callback: (detail: TemplateSelectedEventDetail) => void) {
    const handler = (event: CustomEvent<TemplateSelectedEventDetail>) => {
      callback(event.detail);
    };
    window.addEventListener(CTC_EVENTS.TEMPLATE_SELECTED, handler as EventListener);
    return () => window.removeEventListener(CTC_EVENTS.TEMPLATE_SELECTED, handler as EventListener);
  }

  static onTemplateLoaded(callback: (detail: TemplateLoadedEventDetail) => void) {
    const handler = (event: CustomEvent<TemplateLoadedEventDetail>) => {
      callback(event.detail);
    };
    window.addEventListener(CTC_EVENTS.TEMPLATE_LOADED, handler as EventListener);
    return () => window.removeEventListener(CTC_EVENTS.TEMPLATE_LOADED, handler as EventListener);
  }

  static onTemplateShowAll(callback: (detail: TemplateShowAllEventDetail) => void) {
    const handler = (event: CustomEvent<TemplateShowAllEventDetail>) => {
      callback(event.detail);
    };
    window.addEventListener(CTC_EVENTS.TEMPLATE_SHOW_ALL, handler as EventListener);
    return () => window.removeEventListener(CTC_EVENTS.TEMPLATE_SHOW_ALL, handler as EventListener);
  }

  static onShendoShowCategory(callback: (detail: ShendoShowCategoryEventDetail) => void) {
    const handler = (event: CustomEvent<ShendoShowCategoryEventDetail>) => {
      callback(event.detail);
    };
    window.addEventListener(CTC_EVENTS.SHENDO_SHOW_CATEGORY, handler as EventListener);
    return () => window.removeEventListener(CTC_EVENTS.SHENDO_SHOW_CATEGORY, handler as EventListener);
  }

  static onTemplatePreview(callback: (detail: TemplatePreviewEventDetail) => void) {
    const handler = (event: CustomEvent<TemplatePreviewEventDetail>) => {
      callback(event.detail);
    };
    window.addEventListener(CTC_EVENTS.TEMPLATE_PREVIEW, handler as EventListener);
    return () => window.removeEventListener(CTC_EVENTS.TEMPLATE_PREVIEW, handler as EventListener);
  }
}