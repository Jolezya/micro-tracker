import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { Spinner } from './components/ui/kit.jsx';

// Route-level code splitting keeps the initial bundle lean; heavy deps
// (recharts on Admin, framer-motion on detail flows) load on demand.
const HomeScreen = lazy(() => import('./screens/Home.jsx'));
const SearchScreen = lazy(() => import('./screens/Search.jsx'));
const ListingDetail = lazy(() => import('./screens/ListingDetail.jsx'));
const SellerProfile = lazy(() => import('./screens/SellerProfile.jsx'));
const Messages = lazy(() => import('./screens/Messages.jsx'));
const Chat = lazy(() => import('./screens/Chat.jsx'));
const Sell = lazy(() => import('./screens/Sell.jsx'));
const Profile = lazy(() => import('./screens/Profile.jsx'));
const Saved = lazy(() => import('./screens/Saved.jsx'));
const Notifications = lazy(() => import('./screens/Notifications.jsx'));
const Plans = lazy(() => import('./screens/Plans.jsx'));
const Admin = lazy(() => import('./screens/Admin.jsx'));
const Auth = lazy(() => import('./screens/Auth.jsx'));

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-accent">
      <Spinner size={28} />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<AppShell />}>
          <Route index element={<HomeScreen />} />
          <Route path="search" element={<SearchScreen />} />
          <Route path="category/:categoryId" element={<SearchScreen />} />
          <Route path="listing/:id" element={<ListingDetail />} />
          <Route path="seller/:id" element={<SellerProfile />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:convId" element={<Chat />} />
          <Route path="sell" element={<Sell />} />
          <Route path="profile" element={<Profile />} />
          <Route path="saved" element={<Saved />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="plans" element={<Plans />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
