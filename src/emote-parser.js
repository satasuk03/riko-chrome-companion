export function parseEmote(text) {
  const match = text.match(/^<emote:([a-z0-9-]+)>\s*/i);
  if (match) {
    return { emotion: match[1], text: text.slice(match[0].length) };
  }
  return { emotion: null, text };
}
