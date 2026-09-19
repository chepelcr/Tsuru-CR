import {
  ArrowRight, ArrowUpRight, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, X, Minus, Plus,
  Receipt, ShoppingCart, Package, CreditCard, Wallet, Banknote, Store, Scan,
  Tag, Boxes, ShieldCheck, FileSignature, FileText, BadgeCheck, Building2,
  Users, BarChart2, Layers, Zap, Cloud, Lock, Smartphone, Monitor, Wifi, Battery,
  Home, Trash, Trash2, Globe, Sparkles, Sun, Moon, Menu, Search, Star, Quote,
  Settings, Save, Eye, EyeOff, RefreshCw, Plus as PlusIcon, Pencil, Palette,
  Languages, DollarSign, LayoutDashboard, AlertCircle, Info, GitCompare, ListOrdered,
  HelpCircle, Grid3x3, TrendingDown, GripVertical, type LucideProps,
} from 'lucide-react';

export type IconName =
  | 'ArrowRight' | 'ArrowUpRight' | 'ArrowUp' | 'ArrowDown' | 'ChevronDown' | 'ChevronUp' | 'ChevronLeft' | 'ChevronRight'
  | 'Check' | 'X' | 'Minus' | 'Plus' | 'Receipt' | 'ShoppingCart'
  | 'Package' | 'CreditCard' | 'Wallet' | 'Banknote' | 'Store' | 'Scan'
  | 'Tag' | 'Boxes' | 'ShieldCheck' | 'FileSignature' | 'FileText'
  | 'BadgeCheck' | 'Building2' | 'Users' | 'BarChart2' | 'Layers'
  | 'Zap' | 'Cloud' | 'Lock' | 'Smartphone' | 'Monitor' | 'Wifi' | 'Battery'
  | 'Home' | 'Trash' | 'Trash2' | 'Globe' | 'Sparkles' | 'Sun' | 'Moon' | 'Menu'
  | 'Search' | 'Star' | 'Quote' | 'Settings' | 'Save' | 'Eye' | 'EyeOff'
  | 'RefreshCw' | 'Pencil' | 'Palette' | 'Languages' | 'DollarSign' | 'LayoutDashboard'
  | 'AlertCircle' | 'Info' | 'GitCompare' | 'ListOrdered' | 'HelpCircle' | 'Grid3x3'
  | 'TrendingDown' | 'GripVertical';

const ICONS: Record<IconName, React.FC<LucideProps>> = {
  ArrowRight, ArrowUpRight, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, X, Minus, Plus,
  Receipt, ShoppingCart, Package, CreditCard, Wallet, Banknote, Store, Scan,
  Tag, Boxes, ShieldCheck, FileSignature, FileText, BadgeCheck, Building2,
  Users, BarChart2, Layers, Zap, Cloud, Lock, Smartphone, Monitor, Wifi, Battery,
  Home, Trash, Trash2, Globe, Sparkles, Sun, Moon, Menu, Search, Star, Quote,
  Settings, Save, Eye, EyeOff, RefreshCw, Pencil, Palette, Languages,
  DollarSign, LayoutDashboard, AlertCircle, Info, GitCompare, ListOrdered,
  HelpCircle, Grid3x3, TrendingDown, GripVertical,
};

interface IconProps extends LucideProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const Comp = ICONS[name];
  if (!Comp) return null;
  return <Comp strokeWidth={1.75} {...props} />;
}
