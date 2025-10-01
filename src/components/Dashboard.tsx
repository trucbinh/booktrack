import React from 'react';
import { ReadingStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendUp, 
  Star, 
  Fire 
} from '@phosphor-icons/react';
import { formatReadingTime } from '@/lib/utils-books';

interface DashboardProps {
  stats: ReadingStats;
  dailyGoal?: number;
  todayPages?: number;
}

export function Dashboard({ stats, dailyGoal = 20, todayPages = 0 }: DashboardProps) {
  const dailyProgress = dailyGoal > 0 ? Math.min(100, (todayPages / dailyGoal) * 100) : 0;
  const completionRate = stats.totalBooks > 0 ? (stats.completedBooks / stats.totalBooks) * 100 : 0;

  const statCards = [
    {
      title: 'Total Books',
      value: stats.totalBooks,
      icon: BookOpen,
      description: `${stats.completedBooks} completed`,
      color: 'text-primary'
    },
    {
      title: 'Pages Read',
      value: stats.totalPages.toLocaleString(),
      icon: Target,
      description: `${stats.averagePagesPerDay} avg/day`,
      color: 'text-accent'
    },
    {
      title: 'Reading Time',
      value: formatReadingTime(stats.totalReadingTime),
      icon: Clock,
      description: 'Total time spent',
      color: 'text-green-600'
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Fire,
      description: `Best: ${stats.longestStreak} days`,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reading Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          <TrendUp size={14} className="mr-1" />
          {stats.favoriteGenre}
        </Badge>
      </div>

      {/* Daily Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={20} className="text-accent" />
            Today's Reading Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{todayPages} / {dailyGoal} pages</span>
              <span>{Math.round(dailyProgress)}%</span>
            </div>
            <Progress value={dailyProgress} className="h-3" />
            {dailyProgress >= 100 ? (
              <p className="text-sm text-green-600 font-medium">
                🎉 Daily goal achieved! Great job!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {dailyGoal - todayPages} pages to go
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background border ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reading Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star size={20} className="text-accent" />
              Reading Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="text-sm font-medium">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <p className="font-medium">{stats.completedBooks} books</p>
                </div>
                <div>
                  <span className="text-muted-foreground">In Progress:</span>
                  <p className="font-medium">{stats.totalBooks - stats.completedBooks} books</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendUp size={20} className="text-green-600" />
              Reading Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Favorite Genre</span>
                <Badge variant="outline">{stats.favoriteGenre}</Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Pages/Day</span>
                <span className="font-medium">{stats.averagePagesPerDay}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Reading Time</span>
                <span className="font-medium">{formatReadingTime(stats.totalReadingTime)}</span>
              </div>

              {stats.currentStreak > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reading Streak</span>
                  <span className="font-medium text-orange-500 flex items-center gap-1">
                    <Fire size={14} />
                    {stats.currentStreak} days
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}