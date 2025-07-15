import { 
  // Basic Shapes
  Circle, Square, Triangle, Star, Heart, Diamond, Hexagon, Pentagon, Octagon,
  RoundedRect, Ellipsis, Infinity, Hash, AtSign, Percent,
  
  // Arrows & Navigation
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpDown, ArrowLeftRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, ChevronsLeft, ChevronsRight,
  MoveUp, MoveDown, MoveLeft, MoveRight, Move, Move3d, RotateCw, RotateCcw,
  Navigation, Navigation2, MapPin, Map, Compass, Route, Signpost, TrendingUp, TrendingDown,
  CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight,
  ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight,
  
  // Actions & Controls
  Play, Pause, Stop, SkipForward, SkipBack, FastForward, Rewind,
  Edit, Edit2, Edit3, Pen, PenTool, Pencil, Eraser,
  Copy, Cut, Paste, Clipboard, ClipboardCopy, ClipboardPaste, ClipboardCheck,
  Save, Download, Upload, Share, Share2, Send, SendHorizontal,
  Search, Filter, FilterX, Shuffle, Repeat, Repeat1,
  Undo, Redo, RefreshCw, RefreshCcw,
  Plus, Minus, X, Check, CheckCheck, XCircle, CheckCircle,
  MoreHorizontal, MoreVertical, Menu, Grid3x3, List, Settings,
  
  // Status & Alerts
  AlertCircle, AlertTriangle, AlertOctagon, Info, HelpCircle, CheckCircle2,
  Clock, Timer, Hourglass, Shield, ShieldCheck, ShieldAlert, ShieldX,
  Lock, Unlock, Eye, EyeOff, Bell, BellOff, BellRing,
  Zap, ZapOff, Power, PowerOff, Loader, Loader2, CircleDot,
  
  // Files & Documents
  File, FileText, FileImage, FileVideo, FileAudio,
  Folder, FolderOpen, FolderPlus, FolderMinus, FolderX,
  FileEdit, FilePlus, FileMinus, FileX, FileCheck,
  Paperclip, Link, Link2, Unlink, Archive, Package,
  Book, BookOpen, Bookmark, BookmarkPlus, Newspaper,
  Notebook, NotebookPen, StickyNote, Database, Server,
  HardDrive, Usb, Disc,
  
  // Communication
  Mail, MailOpen, MailPlus, MailMinus, MailX, MailCheck,
  MessageCircle, MessageSquare, MessageSquarePlus,
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneOff,
  Headphones, Mic, MicOff, Volume, Volume1, Volume2, VolumeX,
  Wifi, WifiOff, Bluetooth,
  
  // Technology & Devices
  Laptop, Monitor, Smartphone, Tablet, Computer, Tv,
  Camera, Video, VideoOff, Image, Images, Scan, Printer,
  Mouse, Keyboard, Gamepad2, Router, Cloud, CloudUpload, CloudDownload,
  Battery, BatteryLow, Plug, Cable,
  
  // User & People
  User, Users, UserPlus, UserMinus, UserX, UserCheck,
  Contact, Contacts, Users2, Crown, UserCircle, UserSquare, BadgeCheck,
  
  // Business & Finance
  Briefcase, Building, Building2, Store, ShoppingCart, ShoppingBag,
  CreditCard, Banknote, Coins, DollarSign, Euro, PoundSterling,
  Receipt, Calculator, PieChart, BarChart, LineChart,
  Target, Award, Trophy, Medal, Gift,
  
  // Transport & Travel
  Car, Truck, Bus, Plane, Train, Ship, Bike, Fuel,
  Luggage, Backpack, Tent, Mountain, TreePine, Waves,
  
  // Home & Living
  Home, Door, DoorOpen, DoorClosed, Key, Bed, Chair, Armchair,
  Lamp, LampDesk, Lightbulb, Coffee, Cup, Utensils,
  Flower, Sun, Moon,
  
  // Tools & Objects
  Wrench, Hammer, Screwdriver, Scissors, PaintBucket, Brush,
  Palette, Pipette, Magnet, Microscope, Telescope, Glasses,
  Watch, Calendar, CalendarDays, AlarmClock, Trash, Trash2,
  Recycle, Boxes,
  
  // Science & Education
  GraduationCap, School, TestTube, Atom, Dna, Beaker,
  FlaskConical, Globe, Earth, Flame, Thermometer, Activity,
  
  // Food & Drink
  Wine, Beer, Pizza, Cake, Apple, Cherry, Grape, IceCream,
  Cookie, UtensilsCrossed, ChefHat, Restaurant,
  
  // Weather & Nature
  CloudRain, CloudSnow, CloudLightning, Rainbow, Umbrella,
  Wind, Tornado, Volcano, Flower2, Leaf,
  
  // Medical & Health
  HeartPulse, Pill, Stethoscope, Bandage, Cross,
  Brain, Ear, Hand, Footprints,
  
  // Sports & Recreation
  Football, Basketball, Tennis, Golf, Baseball,
  Dumbbell, Music, Dice1
} from 'lucide-react';

import { IconCategory } from './types/iconTypes';

export const EXPANDED_ICON_MAP = {
  // Basic Shapes
  'circle': Circle, 'square': Square, 'triangle': Triangle, 'star': Star, 'heart': Heart,
  'diamond': Diamond, 'hexagon': Hexagon, 'pentagon': Pentagon, 'octagon': Octagon,
  'rounded-rect': RoundedRect, 'ellipsis': Ellipsis, 'infinity': Infinity, 'hash': Hash,
  'at-sign': AtSign, 'percent': Percent,
  
  // Arrows & Navigation
  'arrow-up': ArrowUp, 'arrow-down': ArrowDown, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
  'arrow-up-down': ArrowUpDown, 'arrow-left-right': ArrowLeftRight,
  'arrow-up-left': ArrowUpLeft, 'arrow-up-right': ArrowUpRight,
  'arrow-down-left': ArrowDownLeft, 'arrow-down-right': ArrowDownRight,
  'chevron-up': ChevronUp, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'chevrons-up': ChevronsUp, 'chevrons-down': ChevronsDown, 'chevrons-left': ChevronsLeft, 'chevrons-right': ChevronsRight,
  'move-up': MoveUp, 'move-down': MoveDown, 'move-left': MoveLeft, 'move-right': MoveRight,
  'move': Move, 'move-3d': Move3d, 'rotate-cw': RotateCw, 'rotate-ccw': RotateCcw,
  'navigation': Navigation, 'navigation-2': Navigation2, 'map-pin': MapPin, 'map': Map,
  'compass': Compass, 'route': Route, 'signpost': Signpost, 'trending-up': TrendingUp, 'trending-down': TrendingDown,
  'corner-up-left': CornerUpLeft, 'corner-up-right': CornerUpRight,
  'corner-down-left': CornerDownLeft, 'corner-down-right': CornerDownRight,
  'arrow-big-up': ArrowBigUp, 'arrow-big-down': ArrowBigDown,
  'arrow-big-left': ArrowBigLeft, 'arrow-big-right': ArrowBigRight,
  
  // Actions & Controls
  'play': Play, 'pause': Pause, 'stop': Stop, 'skip-forward': SkipForward, 'skip-back': SkipBack,
  'fast-forward': FastForward, 'rewind': Rewind,
  'edit': Edit, 'edit-2': Edit2, 'edit-3': Edit3, 'pen': Pen, 'pen-tool': PenTool,
  'pencil': Pencil, 'eraser': Eraser,
  'copy': Copy, 'cut': Cut, 'paste': Paste, 'clipboard': Clipboard,
  'clipboard-copy': ClipboardCopy, 'clipboard-paste': ClipboardPaste, 'clipboard-check': ClipboardCheck,
  'save': Save, 'download': Download, 'upload': Upload, 'share': Share, 'share-2': Share2,
  'send': Send, 'send-horizontal': SendHorizontal,
  'search': Search, 'filter': Filter, 'filter-x': FilterX, 'shuffle': Shuffle,
  'repeat': Repeat, 'repeat-1': Repeat1,
  'undo': Undo, 'redo': Redo, 'refresh-cw': RefreshCw, 'refresh-ccw': RefreshCcw,
  'plus': Plus, 'minus': Minus, 'x': X, 'check': Check, 'check-check': CheckCheck,
  'x-circle': XCircle, 'check-circle': CheckCircle,
  'more-horizontal': MoreHorizontal, 'more-vertical': MoreVertical, 'menu': Menu,
  'grid-3x3': Grid3x3, 'list': List, 'settings': Settings,
  
  // Status & Alerts
  'alert-circle': AlertCircle, 'alert-triangle': AlertTriangle, 'alert-octagon': AlertOctagon,
  'info': Info, 'help-circle': HelpCircle, 'check-circle-2': CheckCircle2,
  'clock': Clock, 'timer': Timer, 'hourglass': Hourglass,
  'shield': Shield, 'shield-check': ShieldCheck, 'shield-alert': ShieldAlert, 'shield-x': ShieldX,
  'lock': Lock, 'unlock': Unlock, 'eye': Eye, 'eye-off': EyeOff,
  'bell': Bell, 'bell-off': BellOff, 'bell-ring': BellRing,
  'zap': Zap, 'zap-off': ZapOff, 'power': Power, 'power-off': PowerOff,
  'loader': Loader, 'loader-2': Loader2, 'circle-dot': CircleDot,
  
  // Files & Documents
  'file': File, 'file-text': FileText, 'file-image': FileImage, 'file-video': FileVideo,
  'file-audio': FileAudio, 'folder': Folder, 'folder-open': FolderOpen,
  'folder-plus': FolderPlus, 'folder-minus': FolderMinus, 'folder-x': FolderX,
  'file-edit': FileEdit, 'file-plus': FilePlus, 'file-minus': FileMinus,
  'file-x': FileX, 'file-check': FileCheck,
  'paperclip': Paperclip, 'link': Link, 'link-2': Link2, 'unlink': Unlink,
  'archive': Archive, 'package': Package,
  'book': Book, 'book-open': BookOpen, 'bookmark': Bookmark, 'bookmark-plus': BookmarkPlus,
  'newspaper': Newspaper, 'notebook': Notebook, 'notebook-pen': NotebookPen,
  'sticky-note': StickyNote, 'database': Database, 'server': Server,
  'hard-drive': HardDrive, 'usb': Usb, 'disc': Disc,
  
  // Communication
  'mail': Mail, 'mail-open': MailOpen, 'mail-plus': MailPlus, 'mail-minus': MailMinus,
  'mail-x': MailX, 'mail-check': MailCheck,
  'message-circle': MessageCircle, 'message-square': MessageSquare, 'message-square-plus': MessageSquarePlus,
  'phone': Phone, 'phone-call': PhoneCall, 'phone-incoming': PhoneIncoming,
  'phone-outgoing': PhoneOutgoing, 'phone-off': PhoneOff,
  'headphones': Headphones, 'mic': Mic, 'mic-off': MicOff,
  'volume': Volume, 'volume-1': Volume1, 'volume-2': Volume2, 'volume-x': VolumeX,
  'wifi': Wifi, 'wifi-off': WifiOff, 'bluetooth': Bluetooth,
  
  // Technology & Devices
  'laptop': Laptop, 'monitor': Monitor, 'smartphone': Smartphone, 'tablet': Tablet,
  'computer': Computer, 'tv': Tv, 'camera': Camera, 'video': Video, 'video-off': VideoOff,
  'image': Image, 'images': Images, 'scan': Scan, 'printer': Printer,
  'mouse': Mouse, 'keyboard': Keyboard, 'gamepad-2': Gamepad2,
  'router': Router, 'cloud': Cloud, 'cloud-upload': CloudUpload, 'cloud-download': CloudDownload,
  'battery': Battery, 'battery-low': BatteryLow, 'plug': Plug, 'cable': Cable,
  
  // User & People
  'user': User, 'users': Users, 'user-plus': UserPlus, 'user-minus': UserMinus,
  'user-x': UserX, 'user-check': UserCheck, 'contact': Contact, 'contacts': Contacts,
  'users-2': Users2, 'crown': Crown, 'user-circle': UserCircle, 'user-square': UserSquare,
  'badge-check': BadgeCheck,
  
  // Business & Finance
  'briefcase': Briefcase, 'building': Building, 'building-2': Building2, 'store': Store,
  'shopping-cart': ShoppingCart, 'shopping-bag': ShoppingBag,
  'credit-card': CreditCard, 'banknote': Banknote, 'coins': Coins, 'dollar-sign': DollarSign,
  'euro': Euro, 'pound-sterling': PoundSterling, 'receipt': Receipt, 'calculator': Calculator,
  'pie-chart': PieChart, 'bar-chart': BarChart, 'line-chart': LineChart,
  'target': Target, 'award': Award, 'trophy': Trophy, 'medal': Medal, 'gift': Gift,
  
  // Transport & Travel
  'car': Car, 'truck': Truck, 'bus': Bus, 'plane': Plane, 'train': Train,
  'ship': Ship, 'bike': Bike, 'fuel': Fuel, 'luggage': Luggage, 'backpack': Backpack,
  'tent': Tent, 'mountain': Mountain, 'tree-pine': TreePine, 'waves': Waves,
  
  // Home & Living
  'home': Home, 'door': Door, 'door-open': DoorOpen, 'door-closed': DoorClosed, 'key': Key,
  'bed': Bed, 'chair': Chair, 'armchair': Armchair, 'lamp': Lamp, 'lamp-desk': LampDesk,
  'lightbulb': Lightbulb, 'coffee': Coffee, 'cup': Cup, 'utensils': Utensils,
  'flower': Flower, 'sun': Sun, 'moon': Moon,
  
  // Tools & Objects
  'wrench': Wrench, 'hammer': Hammer, 'screwdriver': Screwdriver, 'scissors': Scissors,
  'paint-bucket': PaintBucket, 'brush': Brush, 'palette': Palette, 'pipette': Pipette,
  'magnet': Magnet, 'microscope': Microscope, 'telescope': Telescope, 'glasses': Glasses,
  'watch': Watch, 'calendar': Calendar, 'calendar-days': CalendarDays, 'alarm-clock': AlarmClock,
  'trash': Trash, 'trash-2': Trash2, 'recycle': Recycle, 'boxes': Boxes,
  
  // Science & Education
  'graduation-cap': GraduationCap, 'school': School, 'test-tube': TestTube,
  'atom': Atom, 'dna': Dna, 'beaker': Beaker, 'flask-conical': FlaskConical,
  'globe': Globe, 'earth': Earth, 'flame': Flame, 'thermometer': Thermometer, 'activity': Activity,
  
  // Food & Drink
  'wine': Wine, 'beer': Beer, 'pizza': Pizza, 'cake': Cake,
  'apple': Apple, 'cherry': Cherry, 'grape': Grape, 'ice-cream': IceCream, 'cookie': Cookie,
  'utensils-crossed': UtensilsCrossed, 'chef-hat': ChefHat, 'restaurant': Restaurant,
  
  // Weather & Nature
  'cloud-rain': CloudRain, 'cloud-snow': CloudSnow, 'cloud-lightning': CloudLightning,
  'rainbow': Rainbow, 'umbrella': Umbrella, 'wind': Wind, 'tornado': Tornado, 'volcano': Volcano,
  'flower-2': Flower2, 'leaf': Leaf,
  
  // Medical & Health
  'heart-pulse': HeartPulse, 'pill': Pill, 'stethoscope': Stethoscope,
  'bandage': Bandage, 'cross': Cross, 'brain': Brain, 'ear': Ear, 'hand': Hand, 'footprints': Footprints,
  
  // Sports & Recreation
  'football': Football, 'basketball': Basketball, 'tennis': Tennis, 'golf': Golf, 'baseball': Baseball,
  'dumbbell': Dumbbell, 'music': Music, 'gamepad': Gamepad2, 'dice-1': Dice1
} as const;

export type ExpandedLucideIconName = keyof typeof EXPANDED_ICON_MAP;