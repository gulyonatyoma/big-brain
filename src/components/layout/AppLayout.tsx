import { Outlet } from 'react-router-dom'
import AuthSessionWatcher from '../../features/auth/components/AuthSessionWatcher'
import FocusMiniIndicator from '../../features/focus/components/FocusMiniIndicator'
import EventReminderWatcher from '../../features/notifications/components/EventReminderWatcher'
import TaskCloudSyncWatcher from '../../features/tasks/components/TaskCloudSyncWatcher'
import MobileSidebar from './MobileSidebar'
import Sidebar from './Sidebar'

function AppLayout() {
  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <AuthSessionWatcher />
      <TaskCloudSyncWatcher />

      <MobileSidebar />

      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>

      <FocusMiniIndicator />
      <EventReminderWatcher />
    </div>
  )
}

export default AppLayout