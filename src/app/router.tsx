import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import TodayPage from '../pages/TodayPage'
import CalendarPage from '../pages/CalendarPage'
import AllTasksPage from '../pages/AllTasksPage'
import ArchivePage from '../pages/ArchivePage'
import NotesPage from '../pages/NotesPage'
import FocusPage from '../pages/FocusPage'
import StatsPage from '../pages/StatsPage'
import ProfilePage from '../pages/ProfilePage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<AllTasksPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter