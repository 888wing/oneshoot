
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  setDoc, 
  getDoc,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { Game, Comment, User } from "../types";

const GAMES_COLLECTION = "games";
const USERS_COLLECTION = "users";

// --- Users ---

export const syncUserProfile = async (user: User) => {
  const userRef = doc(db, USERS_COLLECTION, user.id);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, user);
  } else {
    // Optional: Update avatar/name if changed on Google
    await updateDoc(userRef, {
      name: user.name,
      avatar: user.avatar
    });
  }
};

// --- Games ---

export const subscribeToGames = (callback: (games: Game[]) => void) => {
  const q = query(collection(db, GAMES_COLLECTION), orderBy("createdAt", "desc"));
  
  // Real-time listener
  return onSnapshot(q, (snapshot) => {
    const gamesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Game[];
    callback(gamesData);
  });
};

export const publishGame = async (gameData: Omit<Game, "id">) => {
  try {
    const docRef = await addDoc(collection(db, GAMES_COLLECTION), gameData);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

export const addGameComment = async (gameId: string, comment: Comment) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
    comments: arrayUnion(comment)
  });
};

export const updateGameRating = async (gameId: string, userId: string, rating: number, currentRatings: Record<string, number>) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  
  const newRatings = { ...currentRatings, [userId]: rating };
  const values = Object.values(newRatings);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  await updateDoc(gameRef, {
    ratings: newRatings,
    averageRating: avg
  });
};

export const updateGamePlays = async (gameId: string, currentPlays: number) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
    plays: currentPlays + 1
  });
}
