/**
 * Recommendations Service
 * Fetches recommendations and trending topics from backend API
 */

import log from 'electron-log';
import * as keytar from 'keytar';

const API_BASE_URL = 'http://localhost:3000';

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  content_type: 'course' | 'video' | 'article' | 'tutorial';
  url: string;
  category: string;
  target_standards: number[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  source: string;
  trending_score: number;
  is_active: boolean;
  created_at: string;
}

export interface TrendingTopic {
  id: string;
  topic_name: string;
  description: string;
  category: string;
  target_standards: number[];
  job_market_demand: 'very_high' | 'high' | 'medium';
  salary_range: string;
  trending_score: number;
  is_active: boolean;
  created_at: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  trendingTopics: TrendingTopic[];
  userProfile: {
    student_standard: number;
    username: string;
  };
  totalRecommendations: number;
  totalTrendingTopics: number;
}

export interface FetchOptions {
  limit?: number;
  category?: string;
}

/**
 * Fetch user recommendations from backend API
 */
export async function fetchUserRecommendations(): Promise<RecommendationsResponse> {
  try {
    // Get access token from keychain
    const accessToken = await keytar.getPassword('StudentMonitorApp', 'accessToken');

    if (!accessToken) {
      throw new Error('No access token found - user not authenticated');
    }

    log.info('Fetching recommendations from API');

    const response = await fetch(
      `${API_BASE_URL}/api/v1/recommendations/user`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch recommendations');
    }

    log.info(
      `✅ Fetched ${data.data.recommendations.length} recommendations and ${data.data.trending_topics.length} trending topics`
    );

    return {
      recommendations: data.data.recommendations,
      trendingTopics: data.data.trending_topics,
      userProfile: data.data.user_profile,
      totalRecommendations: data.data.total_recommendations,
      totalTrendingTopics: data.data.total_trending_topics,
    };
  } catch (error: any) {
    log.error('Error fetching recommendations:', error);
    throw new Error(error.message || 'Failed to load recommendations');
  }
}
