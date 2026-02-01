import { WidgetStyleSettings } from '@/types/elementor';
import { CSSProperties } from 'react';

export function getWidgetStyles(style?: WidgetStyleSettings): CSSProperties {
  if (!style) return {};

  const styles: CSSProperties = {};

  // Width
  if (style.width === 'full') {
    styles.width = '100%';
  } else if (style.width === 'custom' && style.customWidth) {
    styles.width = `${style.customWidth}${style.widthUnit || 'px'}`;
  }

  // Height
  if (style.height === 'custom' && style.customHeight) {
    styles.height = `${style.customHeight}${style.heightUnit || 'px'}`;
  }

  // Min/Max
  if (style.minHeight) {
    styles.minHeight = `${style.minHeight}px`;
  }
  if (style.maxWidth) {
    styles.maxWidth = `${style.maxWidth}px`;
  }

  // Margin
  const marginUnit = style.marginUnit || 'px';
  if (style.marginTop || style.marginRight || style.marginBottom || style.marginLeft) {
    styles.marginTop = `${style.marginTop || 0}${marginUnit}`;
    styles.marginRight = `${style.marginRight || 0}${marginUnit}`;
    styles.marginBottom = `${style.marginBottom || 0}${marginUnit}`;
    styles.marginLeft = `${style.marginLeft || 0}${marginUnit}`;
  }

  // Padding
  const paddingUnit = style.paddingUnit || 'px';
  if (style.paddingTop || style.paddingRight || style.paddingBottom || style.paddingLeft) {
    styles.paddingTop = `${style.paddingTop || 0}${paddingUnit}`;
    styles.paddingRight = `${style.paddingRight || 0}${paddingUnit}`;
    styles.paddingBottom = `${style.paddingBottom || 0}${paddingUnit}`;
    styles.paddingLeft = `${style.paddingLeft || 0}${paddingUnit}`;
  }

  // Border
  if (style.borderStyle && style.borderStyle !== 'none') {
    styles.borderWidth = `${style.borderWidth || 1}px`;
    styles.borderStyle = style.borderStyle;
    styles.borderColor = style.borderColor || '#e5e7eb';
  }
  if (style.borderRadius) {
    styles.borderRadius = `${style.borderRadius}px`;
  }

  // Background
  if (style.backgroundColor) {
    styles.backgroundColor = style.backgroundColor;
  }

  // Effects
  if (style.opacity !== undefined && style.opacity !== 1) {
    styles.opacity = style.opacity;
  }

  if (style.boxShadow && style.boxShadow !== 'none') {
    const shadows = {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    };
    styles.boxShadow = shadows[style.boxShadow];
  }

  return styles;
}

export function getWidgetClasses(style?: WidgetStyleSettings): string {
  if (!style) return '';

  const classes: string[] = [];

  // Responsive visibility
  if (style.hideOnMobile) {
    classes.push('max-sm:hidden');
  }
  if (style.hideOnTablet) {
    classes.push('sm:max-lg:hidden');
  }
  if (style.hideOnDesktop) {
    classes.push('lg:hidden');
  }

  return classes.join(' ');
}
