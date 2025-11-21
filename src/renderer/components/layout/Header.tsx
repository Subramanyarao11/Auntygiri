/**
 * Header Component
 */

import { Menu, Bell, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';

export default function Header() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.recommendations);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left side */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
          <User className="w-5 h-5" />
          <span className="text-sm font-medium">{user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
}

