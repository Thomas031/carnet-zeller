import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js'
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js'
import { getFirestore, collection, doc, getDocsFromServer, getDocFromServer, setDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js'
import { getStorage, ref, uploadBytes, getBlob } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js'
import { firebaseConfig, accounts, attachmentsEnabled } from './firebase-config.js'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = attachmentsEnabled ? getStorage(app) : null
const adminDoc = doc(db, 'admin', 'settings')
const fail = (status, message) => { throw Object.assign(new Error(message), { status }) }

export { attachmentsEnabled }
export async function downloadFile(id) {
  if (!storage)fail(400, 'Le stockage des pièces jointes est désactivé.')
  return getBlob(ref(storage, 'attachments/'+id), 20 * 1024 * 1024)
}
export async function api(path, method='GET', data) {
  await auth.authStateReady()
  if (path === 'login') {
    if (!Object.hasOwn(accounts, data.username))fail(401,'Identifiant ou mot de passe incorrect.')
    try {
      await signInWithEmailAndPassword(auth, accounts[data.username].email, data.password)
    } catch(error) {
      if (['auth/invalid-credential','auth/invalid-login-credentials','auth/wrong-password','auth/user-not-found'].includes(error.code)) {
        fail(401,'Identifiant ou mot de passe incorrect.')
      }
      throw error
    }
    return {}
  }
  if (path === 'logout')return signOut(auth)
  const username = Object.keys(accounts).find(name => accounts[name].uid === auth.currentUser?.uid)
  if (!username)fail(401,'Compte non autorisé. Vérifie la configuration Firebase.')
  if (path === 'library') {
    const [courses,folders] = await Promise.all(['courses','folders'].map(name=>getDocsFromServer(collection(db,name))))
    return {username, courses:courses.docs.map(s=>s.data()), folders:folders.docs.map(s=>s.data().name).sort()}
  }
  if (path === 'folders') {
    await setDoc(doc(db,'folders',encodeURIComponent(data.name)), {name:data.name})
    const snapshot = await getDocsFromServer(collection(db,'folders'))
    return {folders:snapshot.docs.map(s=>s.data().name).sort()}
  }
  if (path === 'courses') {
    if (new TextEncoder().encode(JSON.stringify(data)).length > 950000)fail(413,'Cours trop volumineux. Réduis les images intégrées ou divise le cours.')
    const course = doc(db,'courses',data.id)
    return runTransaction(db, async transaction => {
      const existing = await transaction.get(course)
      if (data.rev !== (existing.data()?.rev ?? 0))fail(409,'Ce cours a été modifié ailleurs. Enregistre ton brouillon comme copie.')
      const metadata = {rev:data.rev+1, updated:Date.now()}
      transaction.set(course,{...data,...metadata})
      return metadata
    })
  }
  if (path === 'files') {
    if (!storage)fail(400,'Le stockage des pièces jointes est désactivé.')
    const id = crypto.randomUUID()
    await uploadBytes(ref(storage,'attachments/'+id),data,{contentType:'application/octet-stream'})
    return {id}
  }
  if (path === 'admin') {
    if (username !== 'thomas')fail(403,'Accès réservé à Thomas.')
    if(method === 'PUT')return setDoc(adminDoc,{notes:data.notes})
    return (await getDocFromServer(adminDoc)).data() ?? {notes:''}
  }
  fail(404,'Page introuvable.')
}
