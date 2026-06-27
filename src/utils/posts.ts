import type { CollectionEntry } from 'astro:content';

export type BlogPostEntry = CollectionEntry<'blog'>;

export function sortPosts(posts: BlogPostEntry[]) {
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getTagCounts(posts: BlogPostEntry[]) {
	const counts = new Map<string, number>();

	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function tagToSlug(tag: string) {
	return encodeURIComponent(tag.toLowerCase());
}

export function slugToTag(slug: string, tags: string[]) {
	const normalized = decodeURIComponent(slug).toLowerCase();
	return tags.find((tag) => tag.toLowerCase() === normalized);
}
