import { AppRole } from './auth';

export interface NavItem {
  id: string;
  tenant_id: string;
  title: string;
  icon: string;
  route: string;
  order: number;
  parent_id: string | null;
  permissions: AppRole[];
  is_visible: boolean;
  created_at: string;
}

export interface View {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Available icons for nav items
export const AVAILABLE_ICONS = [
  'home',
  'users',
  'settings',
  'file',
  'folder',
  'chart-bar',
  'calendar',
  'mail',
  'bell',
  'search',
  'star',
  'heart',
  'bookmark',
  'tag',
  'flag',
  'clock',
  'check',
  'x',
  'plus',
  'minus',
  'edit',
  'trash',
  'eye',
  'lock',
  'unlock',
  'link',
  'image',
  'video',
  'music',
  'download',
  'upload',
  'share',
  'message',
  'phone',
  'map',
  'globe',
  'database',
  'server',
  'code',
  'terminal',
  'package',
  'layers',
  'layout',
  'grid',
  'list',
  'table',
] as const;

export type IconName = typeof AVAILABLE_ICONS[number];
