import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NavProvider, useNav } from '@/context/NavContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthPage } from '@/pages/AuthPage';
import { TopBar } from '@/components/TopBar';
import { LeftSidebar, RightSidebar } from '@/components/Sidebars';
import { HomePage } from '@/pages/HomePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { FriendsPage } from '@/pages/FriendsPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { GroupsPage, GroupDetailPage } from '@/pages/GroupsPage';
import { SavedPage } from '@/pages/SavedPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { Logo } from '@/components/Logo';

function Shell() {
  const { profile, loading } = useAuth();
  const { page } = useNav();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] gap-4">
        <Logo size={64} />
        <p className="text-gray-400 text-sm">Loading Atlas…</p>
      </div>
    );
  }

  if (!profile) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (page.name) {
      case 'home': return <HomePage />;
      case 'profile': return <ProfilePage key={page.userId} userId={page.userId} />;
      case 'friends': return <FriendsPage />;
      case 'messages': return <MessagesPage />;
      case 'notifications': return <NotificationsPage />;
      case 'groups': return <GroupsPage />;
      case 'group': return <GroupDetailPage key={page.groupId} groupId={page.groupId} />;
      case 'saved': return <SavedPage />;
      case 'explore': return <ExplorePage />;
      default: return <HomePage />;
    }
  };

  const isFullScreen = page.name === 'messages';

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-950">
      <TopBar />
      {isFullScreen ? (
        <main>{renderPage()}</main>
      ) : (
        <div className="flex max-w-[2000px] mx-auto px-2 sm:px-3 gap-3">
          <LeftSidebar />
          <main className="flex-1 min-w-0">{renderPage()}</main>
          <RightSidebar />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavProvider>
          <Shell />
        </NavProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
