export const MOTIVATIONAL_QUOTES = [
  {
    quote: "The miracle isn't that I finished. The miracle is that I had the courage to start.",
    author: "John Bingham",
  },
  {
    quote: "Run when you can, walk if you have to, crawl if you must; just never give up.",
    author: "Dean Karnazes",
  },
  {
    quote: "The only bad workout is the one that didn't happen.",
    author: "Unknown",
  },
  {
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
  },
  {
    quote: "Your body can stand almost anything. It's your mind that you have to convince.",
    author: "Unknown",
  },
  {
    quote: "The hardest step for a runner is the first one out the door.",
    author: "Ron Clarke",
  },
  {
    quote: "Pain is temporary. Quitting lasts forever.",
    author: "Lance Armstrong",
  },
  {
    quote: "Every morning in Africa, a gazelle wakes up. It knows it must outrun the fastest lion or it will be killed. Every morning in Africa, a lion wakes up. It knows it must run faster than the slowest gazelle, or it will starve. It doesn't matter whether you're a lion or a gazelle. When the sun comes up, you'd better be running.",
    author: "African Proverb",
  },
  {
    quote: "Running is the greatest metaphor for life, because you get out of it what you put into it.",
    author: "Oprah Winfrey",
  },
  {
    quote: "If you run, you are a runner. It doesn't matter how fast or how far.",
    author: "John Bingham",
  },
  {
    quote: "Running is alone time that lets my brain unspool the tangles that build up over days.",
    author: "Rob Haneisen",
  },
  {
    quote: "Ask yourself: Can I give more? The answer is usually yes.",
    author: "Paul Tergat",
  },
  {
    quote: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
  },
  {
    quote: "Running is nothing more than a series of arguments between the part of your brain that wants to stop and the part that wants to keep going.",
    author: "Unknown",
  },
  {
    quote: "The obsession with running is really an obsession with the potential for more and more life.",
    author: "George Sheehan",
  },
];

export function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

export function getDailyQuote() {
  // Use the day of year to pick a consistent quote for the day
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
