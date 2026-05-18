import { Outlet } from 'react-router-dom'
import AuthSessionWatcher from '../../features/auth/components/AuthSessionWatcher'
import EventCloudSyncWatcher from '../../features/events/components/EventCloudSyncWatcher'
import FocusCloudSyncWatcher from '../../features/focus/components/FocusCloudSyncWatcher'
import FocusMiniIndicator from '../../features/focus/components/FocusMiniIndicator'
import NoteCloudSyncWatcher from '../../features/notes/components/NoteCloudSyncWatcher'
import EventReminderWatcher from '../../features/notifications/components/EventReminderWatcher'
import TaskCloudSyncWatcher from '../../features/tasks/components/TaskCloudSyncWatcher'
import CloudRealtimeWatcher from '../../shared/sync/components/CloudRealtimeWatcher'
import MobileSidebar from './MobileSidebar'
import QuickCreateButton from './QuickCreateButton'
import Sidebar from './Sidebar'

function AppLayout() {
  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <AuthSessionWatcher />
      <TaskCloudSyncWatcher />
      <EventCloudSyncWatcher />
      <NoteCloudSyncWatcher />
      <FocusCloudSyncWatcher />
      <CloudRealtimeWatcher />

      <MobileSidebar />

      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>

      <QuickCreateButton />
      <FocusMiniIndicator />
      <EventReminderWatcher />
    </div>
  )
}

export default AppLayout