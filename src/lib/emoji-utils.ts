// Convert emoji shortcodes to unicode emojis
const emojiMap: Record<string, string> = {
  ':dart:': '🎯',
  ':fire:': '🔥',
  ':rocket:': '🚀',
  ':star:': '⭐',
  ':zap:': '⚡',
  ':sparkles:': '✨',
  ':tada:': '🎉',
  ':hammer:': '🔨',
  ':wrench:': '🔧',
  ':gear:': '⚙️',
  ':brain:': '🧠',
  ':bulb:': '💡',
  ':chart:': '📊',
  ':calendar:': '📅',
  ':clipboard:': '📋',
  ':package:': '📦',
  ':computer:': '💻',
  ':mobile:': '📱',
  ':lock:': '🔒',
  ':key:': '🔑',
  ':shield:': '🛡️',
  ':bug:': '🐛',
  ':construction:': '🚧',
  ':warning:': '⚠️',
  ':check:': '✅',
  ':x:': '❌',
  ':heart:': '❤️',
  ':eyes:': '👀',
  ':wave:': '👋',
  ':trophy:': '🏆',
  ':target:': '🎯',
  ':books:': '📚',
  ':pencil:': '✏️',
  ':mag:': '🔍',
};

export const parseEmoji = (text: string): string => {
  if (!text) return text;
  
  // Replace shortcodes with actual emojis
  let result = text;
  Object.entries(emojiMap).forEach(([shortcode, emoji]) => {
    result = result.replace(new RegExp(shortcode, 'g'), emoji);
  });
  
  return result;
};
