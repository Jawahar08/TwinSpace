/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'lucide-react' {
  export const SquarePen: any;
  export const Search: any;
  export const Sun: any;
  export const Moon: any;
  export const LogOut: any;
  export const Wifi: any;
  export const WifiOff: any;
  export const RefreshCw: any;
  export const Pin: any;
  export const Archive: any;
  export const Trash2: any;
  export const RotateCcw: any;
  export const FileText: any;
  export const Bold: any;
  export const Italic: any;
  export const Underline: any;
  export const List: any;
  export const ListOrdered: any;
  export const CheckSquare: any;
  export const Code: any;
  export const Quote: any;
  export const Paperclip: any;
  export const File: any;
  export const Image: any;
  export const FileArchive: any;
  export const Download: any;
  export const Plus: any;
  export const Lock: any;
  export const Mail: any;
  export const UserPlus: any;
  export const LogIn: any;
}
