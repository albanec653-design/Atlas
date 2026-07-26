import { parseTextWithHashtagsAndMentions, type ParsedTextSegment } from '@/lib/hashtags';
import { useNav } from '@/context/NavContext';

export function TextWithLinks({ text, className = '' }: { text: string | null; className?: string }) {
  const { navigate } = useNav();
  const segments = parseTextWithHashtagsAndMentions(text || '');

  const handleSegmentClick = (segment: ParsedTextSegment) => {
    if (segment.type === 'mention' && segment.value) {
      // Navigate to profile - would need to search for user by username
      // For now, just log it
      console.log('Navigate to user:', segment.value);
    } else if (segment.type === 'hashtag' && segment.value) {
      // Navigate to hashtag page (to be implemented)
      console.log('Navigate to hashtag:', segment.value);
    }
  };

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.text}</span>;
        }

        const isHashtag = segment.type === 'hashtag';
        const colorClass = isHashtag
          ? 'text-[#1877F2] hover:underline cursor-pointer font-medium'
          : 'text-[#1877F2] hover:underline cursor-pointer font-medium';

        return (
          <span
            key={index}
            className={colorClass}
            onClick={() => handleSegmentClick(segment)}
          >
            {segment.text}
          </span>
        );
      })}
    </span>
  );
}
