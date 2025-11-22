/**
 * Recommendations Page Component
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchRecommendations, type RecommendationItem, type TrendingTopic } from '../../../store/slices/recommendationsSlice';

export default function RecommendationsPage() {
  const dispatch = useAppDispatch();
  const {
    recommendations,
    trendingTopics,
    userProfile,
    isLoading,
    error,
  } = useAppSelector((state) => state.recommendations);

  useEffect(() => {
    dispatch(fetchRecommendations());
  }, [dispatch]);

  const openURL = (url: string) => {
    window.electron.recommendations.openURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recommendations</h1>
        {userProfile && (
          <p className="text-muted-foreground">Personalized for Class {userProfile.student_standard}</p>
        )}
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="bg-card rounded-lg border border-border p-6">Loading recommendations...</div>
      )}
      {error && (
        <div className="bg-card rounded-lg border border-border p-6 text-destructive">{error}</div>
      )}

      {/* Recommendations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec: RecommendationItem) => (
          <div key={rec.id} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{rec.title}</h3>
                <p className="text-sm text-muted-foreground">{rec.source} • {rec.difficulty_level} • {Math.round(rec.trending_score)}★</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-secondary text-foreground border border-border">{rec.category}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{rec.description}</p>
            <div className="mt-4">
              <button onClick={() => openURL(rec.url)} className="px-3 py-2 rounded bg-primary text-primary-foreground">Open</button>
            </div>
          </div>
        ))}
      </div>

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Trending Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingTopics.map((topic: TrendingTopic) => (
              <div key={topic.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{topic.topic_name}</h3>
                    <p className="text-sm text-muted-foreground">Demand: {topic.job_market_demand.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-foreground border border-border">{topic.category}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{topic.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">Salary: {topic.salary_range}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

