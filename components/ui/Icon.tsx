import { LucideIcon } from 'lucide-react';
import {
  ArrowBigRight,
  ArrowBigLeft,
  ArrowLeftRight,
  Box,
  Check,
  Circle,
  CircleDot,
  X,
  Clock,
  Hourglass,
  ShoppingCart,
  Search,
  LogOut,
  CircleUserRound,
  Cookie,
  Mail,
  ScrollText,
  Trash2,
  Image,
  Upload,
  Download,
  ThumbsUp,
  ThumbsDown,
  FilePlus,
  PenTool,
  SquarePen,
  Rocket,
  Network,
  CircleQuestionMark,
  Info,
  Mouse,
  MousePointerClick,
  MoveVertical,
  Sliders,
  SquareChevronUp,
  Grid,
  Ruler,
  Minus,
  Eye,
  CircleCheck,
  ShoppingBag,
  Copyright,
    ChevronDown
} from 'lucide-react';

const Icons = {
  ArrowBigRight,
  ArrowBigLeft,
  ArrowLeftRight,
  Box,
  Check,
  Circle,
  CircleDot,
  X,
  Clock,
  Hourglass,
  ShoppingCart,
  Search,
  LogOut,
  CircleUserRound,
  Cookie,
  Mail,
  ScrollText,
  Trash2,
  Image,
  Upload,
  Download,
  ThumbsUp,
  ThumbsDown,
  FilePlus,
  PenTool,
  SquarePen,
  Rocket,
  Network,
  CircleQuestionMark,
  Info,
  Mouse,
  MousePointerClick,
  MoveVertical,
  Sliders,
  SquareChevronUp,
  Grid,
  Ruler,
  Minus,
  Eye,
  CircleCheck,
  ShoppingBag,
  Copyright,
  ChevronDown
};

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
} & React.SVGProps<SVGSVGElement>;

export function Icon({ name, size = 24, color = 'currentColor', className, ...props }: IconProps) {
  const IconComponent = Icons[name as keyof typeof Icons] as LucideIcon;
 
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide React`);
    return null;
  }

  return <IconComponent size={size} color={color} className={className} {...props} />;
}
