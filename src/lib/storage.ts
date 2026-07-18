import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

// Uploads under event-content/ - Storage rules restrict writes there to
// super_admin, reads to any approved user (see storage.rules).
export async function uploadEventContentImage(
  path: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, `event-content/${path}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
