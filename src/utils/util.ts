export const LIMIT_PER_PAGE = 6

export function calculateReadTime(content: string): number {
    const wordsPerMinute = 180;

    const plainText = content.replace(/<[^>]+>/g, ' ');

    const words = plainText.trim().split(/\s+/).length;

    return Math.max(1, Math.ceil(words / wordsPerMinute));
}