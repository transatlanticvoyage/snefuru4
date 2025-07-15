import { LUCIDE_ICON_MAP, ICON_REGISTRY } from './iconRegistry';
import { IconCategory } from './types/iconTypes';

export const isValidIconName = (iconName: string): boolean => {
  return iconName in LUCIDE_ICON_MAP;
};

export const isValidHexColor = (color: string): boolean => {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexPattern.test(color);
};

export const normalizeHexColor = (color: string): string => {
  if (!color) return '#666666';
  
  // Remove any whitespace
  color = color.trim();
  
  // Add # if missing
  if (!color.startsWith('#')) {
    color = '#' + color;
  }
  
  // Validate and return default if invalid
  if (!isValidHexColor(color)) {
    return '#666666';
  }
  
  return color.toLowerCase();
};

export const getIconsByCategory = (category: IconCategory) => {
  return ICON_REGISTRY.filter(icon => icon.category === category);
};

export const getIconsByUsageContext = (context: string) => {
  return ICON_REGISTRY.filter(icon => 
    icon.usageContexts.includes(context)
  );
};

export const getIconDisplayName = (iconName: string): string => {
  const icon = ICON_REGISTRY.find(icon => icon.iconName === iconName);
  return icon?.displayName || iconName;
};

export const getDefaultIconForContext = (context: string): string => {
  const contextIcons = getIconsByUsageContext(context);
  
  if (contextIcons.length === 0) return 'circle';
  
  // Prefer common shapes for defaults
  const preferredDefaults = ['circle', 'square', 'star'];
  for (const preferred of preferredDefaults) {
    const found = contextIcons.find(icon => icon.iconName === preferred);
    if (found) return found.iconName;
  }
  
  return contextIcons[0].iconName;
};

export const validateIconData = (iconName?: string, iconColor?: string) => {
  const validIconName = iconName && isValidIconName(iconName) ? iconName : undefined;
  const validIconColor = normalizeHexColor(iconColor || '#666666');
  
  return {
    iconName: validIconName,
    iconColor: validIconColor,
    isValid: validIconName !== undefined
  };
};

export const generateIconSql = () => {
  const insertStatements = ICON_REGISTRY.map(icon => {
    const usageContextsArray = `{${icon.usageContexts.map(ctx => `"${ctx}"`).join(',')}}`;
    return `INSERT INTO ui_icons (icon_name, display_name, category, usage_contexts) VALUES ('${icon.iconName}', '${icon.displayName}', '${icon.category}', '${usageContextsArray}');`;
  });
  
  return insertStatements.join('\n');
};

export const getExpandedIconCount = () => {
  return ICON_REGISTRY.length;
};