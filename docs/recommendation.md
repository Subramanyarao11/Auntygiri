# Recommendations System - Desktop App Integration Guide

## Overview
The recommendation system provides **personalized career resources, courses, and trending topics** based on a student's class (standard 9-12). The system automatically populates content during registration and serves it on demand.

---

## 🎯 How It Works

### **2-Step Flow:**

1. **Registration** → Call populate API → Database populated with class-specific content
2. **Login/Dashboard** → Call GET API → Fetch recommendations from database

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1/recommendations
```

---

## 1. Populate Recommendations (After Registration)

**Endpoint**: `POST /api/v1/recommendations/populate`

**When to call**: Right after successful parent-student registration

**Authentication**: NOT REQUIRED (can be called directly)

### Request

```javascript
POST http://localhost:3000/api/v1/recommendations/populate
Content-Type: application/json

{
  "student_standard": 11
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Recommendations populated for Class 11",
  "data": {
    "student_standard": 11,
    "categories_processed": ["ai_ml", "programming", "data_science", "technology"],
    "recommendations_added": 8,
    "trending_topics_added": 4,
    "total_content_added": 12,
    "existing_recommendations": 0,
    "existing_topics": 0
  }
}
```

### If Content Already Exists

```json
{
  "status": "success",
  "message": "Sufficient recommendations already exist for Class 11",
  "data": {
    "student_standard": 11,
    "existing_recommendations": 15,
    "existing_topics": 5,
    "new_content_added": 0
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "status": "error",
  "message": "Valid student_standard (9-12) is required"
}
```

---

## 2. Get User Recommendations (After Login)

**Endpoint**: `GET /api/v1/recommendations/user`

**When to call**: After login, when loading dashboard/recommendations screen

**Authentication**: REQUIRED (Bearer token)

### Request

```javascript
GET http://localhost:3000/api/v1/recommendations/user?limit=10&category=ai_ml
Authorization: Bearer <access_token>
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Number of recommendations to return |
| `category` | string | No | all | Filter by category (see categories below) |

### Categories

- `ai_ml` - Artificial Intelligence & Machine Learning
- `programming` - Software Development & Programming
- `data_science` - Data Science & Analytics
- `technology` - Technology & IT
- `career` - Career Guidance & Planning
- `digital_marketing` - Digital Marketing (Class 10 only)
- `science` - STEM & Science (Class 9-10)
- `entrepreneurship` - Entrepreneurship (Class 12 only)

### Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "user_profile": {
      "student_standard": 11,
      "username": "Jane Doe"
    },
    "recommendations": [
      {
        "id": "uuid",
        "title": "Introduction to Artificial Intelligence",
        "description": "Understanding AI concepts and applications",
        "content_type": "course",
        "url": "https://example.com/ai-intro",
        "category": "ai_ml",
        "target_standards": [11],
        "difficulty_level": "intermediate",
        "source": "Coursera",
        "trending_score": 95.0,
        "is_active": true,
        "created_at": "2025-11-22T08:00:00.000Z"
      },
      {
        "id": "uuid",
        "title": "Machine Learning Career Guide",
        "description": "ML job market and opportunities in India",
        "content_type": "article",
        "url": "https://example.com/ml-careers",
        "category": "ai_ml",
        "target_standards": [11],
        "difficulty_level": "beginner",
        "source": "TechCrunch",
        "trending_score": 90.0,
        "is_active": true,
        "created_at": "2025-11-22T08:00:00.000Z"
      }
    ],
    "trending_topics": [
      {
        "id": "uuid",
        "topic_name": "Artificial Intelligence & Machine Learning",
        "description": "AI/ML transforming industries with massive opportunities",
        "category": "ai_ml",
        "target_standards": [11],
        "job_market_demand": "very_high",
        "salary_range": "6-30 LPA",
        "trending_score": 95.0,
        "is_active": true,
        "created_at": "2025-11-22T08:00:00.000Z"
      },
      {
        "id": "uuid",
        "topic_name": "Data Science & Analytics",
        "description": "Data-driven decision making creating huge demand",
        "category": "data_science",
        "target_standards": [11],
        "job_market_demand": "very_high",
        "salary_range": "5-25 LPA",
        "trending_score": 90.0,
        "is_active": true,
        "created_at": "2025-11-22T08:00:00.000Z"
      }
    ],
    "total_recommendations": 8,
    "total_trending_topics": 4,
    "filters_applied": {
      "category": "ai_ml",
      "limit": 10
    }
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

**400 Bad Request**
```json
{
  "status": "error",
  "message": "User not found or student_standard not set"
}
```

---

## Desktop App Implementation

### Step 1: Registration Flow

After successful parent-student registration:

```javascript
// After registration succeeds
async function handleRegistrationSuccess(registrationData) {
  const { student } = registrationData;
  
  // Populate recommendations for the student's class
  try {
    const response = await fetch('http://localhost:3000/api/v1/recommendations/populate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_standard: student.student_standard
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log(`✅ Populated ${result.data.total_content_added} recommendations for Class ${student.student_standard}`);
    }
  } catch (error) {
    console.error('Failed to populate recommendations:', error);
    // Non-blocking - registration is still successful
  }
}
```

### Step 2: Login/Dashboard Flow

After successful login, fetch recommendations:

```javascript
// After login succeeds
async function loadRecommendations(accessToken, filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.category) params.append('category', filters.category);
    
    const response = await fetch(
      `http://localhost:3000/api/v1/recommendations/user?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        recommendations: data.data.recommendations,
        trendingTopics: data.data.trending_topics,
        userProfile: data.data.user_profile
      };
    }
  } catch (error) {
    console.error('Failed to load recommendations:', error);
    return null;
  }
}

// Usage
const accessToken = getStoredAccessToken();
const { recommendations, trendingTopics } = await loadRecommendations(accessToken, {
  limit: 10,
  category: 'ai_ml' // Optional filter
});
```

---

## Content by Class

### Class 9
**Categories**: Programming, Science  
**Focus**: Foundation building, basic programming concepts

**Sample Content**:
- Python Programming Basics
- Physics Concepts for Class 9
- Web Development Introduction

---

### Class 10
**Categories**: Programming, Science, Career, Digital Marketing  
**Focus**: Career exploration, skill development

**Sample Content**:
- Python Programming for Class 10
- Career Options After Class 10
- Digital Marketing for Beginners
- Web Development Basics

---

### Class 11
**Categories**: AI/ML, Programming, Data Science, Technology  
**Focus**: Advanced tech skills, emerging technologies

**Sample Content**:
- Introduction to Artificial Intelligence
- Machine Learning Career Guide
- Data Science Fundamentals
- Python Programming for Class 11

**Trending Topics**:
- AI & Machine Learning (6-30 LPA)
- Data Science & Analytics (5-25 LPA)
- Software Development (4-20 LPA)
- Technology & IT

---

### Class 12
**Categories**: AI/ML, Data Science, Technology, Career, Entrepreneurship  
**Focus**: Industry-ready skills, career preparation

**Sample Content**:
- Advanced AI/ML Courses
- Data Science Career Path
- Entrepreneurship Guide
- Industry-Ready Programming

**Trending Topics**:
- AI & ML (6-30 LPA)
- Data Science (5-25 LPA)
- Entrepreneurship (3-20 LPA)
- Emerging Career Opportunities

---

## UI/UX Recommendations

### 1. Dashboard Recommendations Section

```
┌─────────────────────────────────────┐
│  📚 Recommended for You             │
│  Based on Class 11                  │
├─────────────────────────────────────┤
│  🎓 Introduction to AI              │
│  Coursera • Intermediate • 95★     │
│  [Learn More]                       │
├─────────────────────────────────────┤
│  💻 Python Programming              │
│  YouTube • Beginner • 85★          │
│  [Learn More]                       │
└─────────────────────────────────────┘
```

### 2. Trending Topics Section

```
┌─────────────────────────────────────┐
│  🔥 Trending Career Paths           │
├─────────────────────────────────────┤
│  🤖 AI & Machine Learning           │
│  Demand: Very High                  │
│  Salary: 6-30 LPA                   │
│  [Explore]                          │
├─────────────────────────────────────┤
│  📊 Data Science & Analytics        │
│  Demand: Very High                  │
│  Salary: 5-25 LPA                   │
│  [Explore]                          │
└─────────────────────────────────────┘
```

### 3. Category Filters

```javascript
const categories = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'ai_ml', label: 'AI & ML', icon: '🤖' },
  { id: 'programming', label: 'Programming', icon: '💻' },
  { id: 'data_science', label: 'Data Science', icon: '📊' },
  { id: 'career', label: 'Career', icon: '🎯' }
];
```

---

## Complete Implementation Example (Electron/Node.js)

```javascript
// recommendations.js - Desktop App Module

const BASE_URL = 'http://localhost:3000/api/v1';

class RecommendationsManager {
  
  /**
   * Call after registration to populate recommendations
   */
  async populateForStudent(studentStandard) {
    try {
      const response = await fetch(`${BASE_URL}/recommendations/populate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_standard: studentStandard })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Populate error:', error);
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Fetch recommendations for logged-in user
   */
  async getUserRecommendations(accessToken, options = {}) {
    const { limit = 10, category } = options;
    
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (category) params.append('category', category);
      
      const response = await fetch(
        `${BASE_URL}/recommendations/user?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return await response.json();
    } catch (error) {
      console.error('Fetch recommendations error:', error);
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Filter recommendations by category
   */
  filterByCategory(recommendations, category) {
    if (!category || category === 'all') {
      return recommendations;
    }
    return recommendations.filter(rec => rec.category === category);
  }
  
  /**
   * Open recommendation URL in browser
   */
  openRecommendation(url) {
    const { shell } = require('electron');
    shell.openExternal(url);
  }
}

// Export singleton
module.exports = new RecommendationsManager();
```

### Usage in Desktop App

```javascript
const recommendationsManager = require('./recommendations');
const { getAccessToken, getStudentData } = require('./auth');

// After registration
async function onRegistrationComplete(studentData) {
  const result = await recommendationsManager.populateForStudent(
    studentData.student_standard
  );
  
  if (result.status === 'success') {
    showNotification(`${result.data.total_content_added} career resources added!`);
  }
}

// Load recommendations on dashboard
async function loadDashboard() {
  const token = getAccessToken();
  const result = await recommendationsManager.getUserRecommendations(token, {
    limit: 10
  });
  
  if (result.status === 'success') {
    displayRecommendations(result.data.recommendations);
    displayTrendingTopics(result.data.trending_topics);
  }
}

// Filter by category
async function filterRecommendations(category) {
  const token = getAccessToken();
  const result = await recommendationsManager.getUserRecommendations(token, {
    limit: 20,
    category: category
  });
  
  if (result.status === 'success') {
    displayRecommendations(result.data.recommendations);
  }
}

// Open recommendation
function onRecommendationClick(recommendation) {
  recommendationsManager.openRecommendation(recommendation.url);
}
```

---

## Testing

### 1. Test Populate API

```bash
curl -X POST http://localhost:3000/api/v1/recommendations/populate \
  -H "Content-Type: application/json" \
  -d '{"student_standard": 11}'
```

### 2. Test Get Recommendations

```bash
curl -X GET "http://localhost:3000/api/v1/recommendations/user?limit=5" \
  -H "Authorization: Bearer <access_token>"
```

### 3. Test with Category Filter

```bash
curl -X GET "http://localhost:3000/api/v1/recommendations/user?limit=5&category=ai_ml" \
  -H "Authorization: Bearer <access_token>"
```

---

## Data Fields Reference

### Recommendation Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `title` | String | Recommendation title |
| `description` | String | Brief description |
| `content_type` | String | course, video, article, tutorial |
| `url` | String | Resource URL |
| `category` | String | Category (ai_ml, programming, etc.) |
| `target_standards` | Array | Classes this applies to [9,10,11,12] |
| `difficulty_level` | String | beginner, intermediate, advanced |
| `source` | String | Content source (Coursera, YouTube, etc.) |
| `trending_score` | Float | Popularity score (0-100) |
| `is_active` | Boolean | Whether visible to users |
| `created_at` | Timestamp | When added to database |

### Trending Topic Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `topic_name` | String | Topic title |
| `description` | String | Topic description |
| `category` | String | Category |
| `target_standards` | Array | Applicable classes |
| `job_market_demand` | String | very_high, high, medium |
| `salary_range` | String | Expected salary (e.g., "6-30 LPA") |
| `trending_score` | Float | Popularity score |
| `is_active` | Boolean | Whether visible |
| `created_at` | Timestamp | When added |

---

## Error Handling

```javascript
async function safeLoadRecommendations(token, options) {
  try {
    const result = await recommendationsManager.getUserRecommendations(token, options);
    
    if (result.status === 'error') {
      // Handle API error
      if (result.message.includes('Authentication')) {
        // Token expired, redirect to login
        redirectToLogin();
      } else {
        showError('Failed to load recommendations');
      }
      return null;
    }
    
    return result.data;
  } catch (error) {
    // Handle network error
    showError('Network error. Please check your connection.');
    return null;
  }
}
```

---

## Best Practices

1. **Call populate API in background** - Don't block registration flow
2. **Cache recommendations locally** - Store in local storage for offline access
3. **Refresh periodically** - Update recommendations every 24 hours
4. **Handle offline gracefully** - Show cached data if network unavailable
5. **Track user clicks** - Send analytics when users click recommendations
6. **Show loading states** - Display skeleton screens while fetching
7. **Respect rate limits** - Don't spam the API

---

## Support

For issues or questions:
- Check server logs: `logs/combined.log`
- Review: `SIMPLE_RECOMMENDATION_FLOW.md`
- Backend code: `controllers/recommendationController.js`

---

**Version**: 1.0  
**Last Updated**: November 22, 2025  
**Backend Endpoint**: `/api/v1/recommendations/*`
