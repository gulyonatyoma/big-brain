import { db } from './db'

export async function clearLocalAppData() {
  await Promise.all([
    db.tasks.clear(),
    db.events.clear(),
    db.notes.clear(),
    db.noteContents.clear(),
    db.focusSessions.clear(),
  ])
}