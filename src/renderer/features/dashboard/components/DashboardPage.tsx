/**
 * Dashboard Page Component
 */

import { useEffect } from 'react';
import { useAppDispatch } from '../../../store';
import { startMonitoring } from '../../../store/slices/monitoringSlice';
import { TrendingUp, Clock, Target, Activity } from 'lucide-react';

export default function DashboardPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Start monitoring when dashboard loads
    dispatch(startMonitoring());
  }, [dispatch]);

  const stats = [
    { name: 'Productivity Score', value: '85%', icon: TrendingUp, color: 'text-green-500' },
    { name: 'Active Time', value: '6h 42m', icon: Clock, color: 'text-blue-500' },
    { name: 'Focus Sessions', value: '3', icon: Target, color: 'text-purple-500' },
    { name: 'Activities', value: '247', icon: Activity, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your productivity and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Productivity Trend</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart will be rendered here
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">App Usage</h2>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart will be rendered here
          </div>
        </div>
      </div>
    </div>
  );
}

