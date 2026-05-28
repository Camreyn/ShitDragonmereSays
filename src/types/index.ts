import type { Episode, Guest, Quote, Tag, TranscriptSegment } from "@prisma/client";

export type EpisodeWithRelations = Episode & {
  episodeTags: { tag: Tag }[];
  episodeGuests: { guest: Guest }[];
  transcript?: TranscriptSegment[];
  quotes?: (Quote & { quoteTags: { tag: Tag }[] })[];
};

export type SearchFilters = {
  q?: string;
  episode?: string;
  source?: string;
  tag?: string;
  speaker?: string;
  from?: string;
  to?: string;
  exact?: boolean;
};
