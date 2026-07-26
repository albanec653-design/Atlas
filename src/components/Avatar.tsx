import { avatarUrl, classNames } from '@/lib/utils';
import type { Profile } from '@/lib/types';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeMap: Record<Size, string> = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-32 h-32 text-4xl',
};

export function Avatar({
  profile,
  size = 'md',
  className,
  onClick,
}: {
  profile: Pick<Profile, 'avatar_url' | 'full_name'> & { id?: string };
  size?: Size;
  className?: string;
  onClick?: () => void;
}) {
  const url = profile.avatar_url;
  const initials = profile.full_name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <img
      src={url ?? avatarUrl(url, profile.full_name)}
      alt={profile.full_name}
      onClick={onClick}
      className={classNames(
        'rounded-full object-cover bg-gray-200 shrink-0',
        sizeMap[size],
        onClick && 'cursor-pointer',
        className,
      )}
    />
  );
}

export { avatarUrl };

export function AvatarWithInitials({ name, size = 'md', className }: { name: string; size?: Size; className?: string }) {
  return (
    <div
      className={classNames(
        'rounded-full bg-[#1877F2] text-white flex items-center justify-center font-semibold shrink-0',
        sizeMap[size],
        className,
      )}
    >
      {name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
    </div>
  );
}
