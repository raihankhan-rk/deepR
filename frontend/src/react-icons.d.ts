declare module 'react-icons/fi' {
  import { ComponentType, SVGAttributes } from 'react';

  export interface IconBaseProps extends SVGAttributes<SVGElement> {
    size?: string | number;
    color?: string;
    title?: string;
    className?: string;
  }

  export type IconType = ComponentType<IconBaseProps>;

  export const FiHome: IconType;
  export const FiSearch: IconType;
  export const FiClock: IconType;
  export const FiLogOut: IconType;
  export const FiUser: IconType;
  export const FiMenu: IconType;
  export const FiX: IconType;
  export const FiDownload: IconType;
  export const FiExternalLink: IconType;
  export const FiLoader: IconType;
  export const FiAlertCircle: IconType;
  export const FiArrowRight: IconType;
}

// Add declarations for other icon packages if you need them
declare module 'react-icons/fa' {
  import { IconType } from 'react-icons/fi';
  export const FaGithub: IconType;
  // Add other icons as needed
}

declare module 'react-icons/md' {
  import { IconType } from 'react-icons/fi';
  export const MdDashboard: IconType;
  // Add other icons as needed
} 