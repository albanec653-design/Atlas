import { Globe2 } from 'lucide-react';
import { classNames } from '@/lib/utils';

export function Logo({ size = 32, className, withText = false }: { size?: number; className?: string; withText?: boolean }) {
  return (
    <div className={classNames('flex items-center gap-2', className)}>
      <div
        className="bg-accent rounded-xl flex items-center justify-center text-white shadow-sm"
        style={{ width: size, height: size }}
      >
        <Globe2 size={size * 0.6} strokeWidth={2.5} />
      </div>
      {withText && (
        <span className="text-2xl font-extrabold text-accent tracking-tight">Atlas</span>
      )}
    </div>
  );
}
