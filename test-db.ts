import { db } from './src/lib/firebase.ts';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

async function run() {
  const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'), limit(3));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, doc.data().destination, doc.data().coverImage);
  });
}
run();
