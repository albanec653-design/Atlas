export type ParsedTextSegment = {
  text: string;
  type: 'text' | 'hashtag' | 'mention';
  value?: string; // for hashtag/mention
};

export function parseTextWithHashtagsAndMentions(text: string): ParsedTextSegment[] {
  if (!text) return [{ text: '', type: 'text' }];

  const segments: ParsedTextSegment[] = [];
  const regex = /(#\w+)|(@\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        type: 'text',
      });
    }

    // Add the match (hashtag or mention)
    const matchedText = match[0];
    const value = matchedText.slice(1); // Remove # or @
    const type = matchedText.startsWith('#') ? 'hashtag' : 'mention';

    segments.push({
      text: matchedText,
      type,
      value,
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      type: 'text',
    });
  }

  return segments;
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches ? matches.map(tag => tag.slice(1)) : [];
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@\w+/g);
  return matches ? matches.map(mention => mention.slice(1)) : [];
}
