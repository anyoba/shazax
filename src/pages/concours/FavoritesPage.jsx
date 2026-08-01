import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import SearchInput from '../../components/concours/common/SearchInput.jsx';
import { concoursQuestions } from '../../data/concours/index.js';
import { createSession, getFavorites, toggleFavorite } from '../../services/concoursLocalStorage.js';
import { getQuestionMeta } from '../../utils/concours/catalog.js';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState(() => getFavorites());
  const [query, setQuery] = useState('');
  const favorites = concoursQuestions.filter((question) => favoriteIds.includes(question.id));
  const filtered = favorites.filter((question) => {
    const meta = getQuestionMeta(question);
    const normalized = query.trim().toLowerCase();
    return !normalized || question.statement.toLowerCase().includes(normalized) || meta.chapterName.toLowerCase().includes(normalized);
  });

  function removeFavorite(questionId) {
    setFavoriteIds(toggleFavorite(questionId));
  }

  function startFavoritesSession() {
    const first = favorites[0];
    if (!first) return;
    const session = createSession({
      contestId: first.contestId,
      subjectId: first.subjectId,
      chapterId: first.chapterId,
      questionCount: Math.min(favorites.length, 10),
      questionIds: favorites.slice(0, 10).map((question) => question.id),
      difficulty: 'mixed',
      timerEnabled: true,
      mode: 'training',
    });
    navigate(`/concours/session/${session.id}`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="red">Favoris</Badge>
            <h2 className="mt-4 text-3xl font-black text-slate-950">Mes questions favorites</h2>
          </div>
          <button
            type="button"
            disabled={favorites.length === 0}
            onClick={startFavoritesSession}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            <Play size={17} />
            Serie favoris
          </button>
        </div>
        <div className="mt-5 max-w-xl">
          <SearchInput value={query} onChange={setQuery} placeholder="Filtrer les favoris" />
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun favori" description="Ajoute des questions depuis une session QCM." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((question) => {
            const meta = getQuestionMeta(question);
            return (
              <article key={question.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{meta.contestName}</Badge>
                      <Badge tone="slate">{meta.chapterName}</Badge>
                    </div>
                    <p className="mt-3 font-black text-slate-900">{question.statement}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFavorite(question.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-pink-100 bg-pink-50 px-4 py-2 text-sm font-black text-pink-700"
                  >
                    <Heart size={16} fill="currentColor" />
                    Retirer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
