"use client";

import { Skeleton } from "@/shared/ui";
import { useDeepLinkAutoplay } from "../hooks/useDeepLinkAutoplay";
import { useFilteredEpisodes, usePodcastInsights } from "../hooks/useFilteredEpisodes";
import { usePodcastFilters } from "../hooks/usePodcastFilters";
import { usePodcastKeyboardShortcuts } from "../hooks/usePodcastKeyboardShortcuts";
import { usePodcastPlayer } from "../hooks/usePodcastPlayer";
import { PodcastEpisodeGridCard } from "./PodcastEpisodeGridCard";
import { PodcastFeaturedCarousel } from "./PodcastFeaturedCarousel";
import { PodcastHeroSection } from "./PodcastHeroSection";
import { PodcastToolbar } from "./PodcastToolbar";

/** Full `/podcast` studio experience — hero, carousels, live filters, dock player. */
export function PodcastPlayer() {
  useDeepLinkAutoplay();

  const [filters, setFilters] = usePodcastFilters();
  const {
    episodes,
    isPending,
    isError,
    refetch,
    currentEpisode,
    isPlaying,
    playEpisode,
    togglePlay,
    playNext,
    playPrevious,
  } = usePodcastPlayer();

  usePodcastKeyboardShortcuts({ onTogglePlay: togglePlay, onNext: playNext, onPrevious: playPrevious });

  const filteredEpisodes = useFilteredEpisodes(episodes, filters.q, filters.sort);
  const { totalListens, featured, latest } = usePodcastInsights(episodes);
  const showDualCarousels = !filters.q.trim();

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#eef8ef_0%,#f7faf7_38%,#ffffff_100%)] pb-[7rem]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(72,162,76,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
        <PodcastHeroSection episodeCount={episodes.length} totalListens={totalListens} />

        <PodcastToolbar
          search={filters.q}
          sort={filters.sort}
          resultCount={filteredEpisodes.length}
          onSearchChange={(q) => setFilters({ q })}
          onSortChange={(sort) => setFilters({ sort })}
        />

        {isPending && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[360px] rounded-[22px]" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-[24px] border border-[color:var(--color-error)]/20 bg-white p-8 text-center">
            <p className="text-[color:var(--color-text-secondary)]">Епизодите не можаха да се заредят.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-full bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm text-white"
            >
              Опитай отново
            </button>
          </div>
        )}

        {!isPending && !isError && (
          <>
            {showDualCarousels ? (
              <div className="space-y-10">
                <PodcastFeaturedCarousel
                  title="Най-нови"
                  subtitle="Последните разговори, пуснати от SmolyanVote Studio."
                  icon="bi-stars"
                  episodes={latest}
                  currentEpisodeId={currentEpisode?.id ?? null}
                  isPlaying={isPlaying}
                  onSelect={playEpisode}
                />
                <PodcastFeaturedCarousel
                  title="Популярни"
                  subtitle="Епизодите, които общността слуша най-често."
                  icon="bi-fire"
                  episodes={featured}
                  currentEpisodeId={currentEpisode?.id ?? null}
                  isPlaying={isPlaying}
                  onSelect={playEpisode}
                />
              </div>
            ) : (
              <PodcastFeaturedCarousel
                title="Резултати"
                subtitle="Епизоди, които отговарят на твоето търсене."
                icon="bi-search"
                episodes={filteredEpisodes.slice(0, 12)}
                currentEpisodeId={currentEpisode?.id ?? null}
                isPlaying={isPlaying}
                onSelect={playEpisode}
              />
            )}

            <section className="space-y-4">
              <div>
                <h2 className="font-display text-[1.6rem] font-bold tracking-[-0.03em] text-[color:var(--color-text-heading)]">
                  {filters.q.trim() ? "Намерени епизоди" : "Всички епизоди"}
                </h2>
                <p className="mt-1 text-[0.9rem] text-[color:var(--color-text-secondary)]">
                  Подробни карти с описание, дата, продължителност и брой прослушвания.
                </p>
              </div>

              {filteredEpisodes.length === 0 ? (
                <div className="rounded-[24px] border border-black/[0.06] bg-white p-10 text-center">
                  <i className="bi bi-search mb-3 block text-3xl text-[color:var(--color-text-muted)]" />
                  <p className="text-[color:var(--color-text-secondary)]">
                    Няма епизоди, които да отговарят на търсенето.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredEpisodes.map((episode) => (
                    <PodcastEpisodeGridCard
                      key={episode.id}
                      episode={episode}
                      isActive={currentEpisode?.id === episode.id}
                      isPlaying={isPlaying}
                      onSelect={() => playEpisode(episode)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
