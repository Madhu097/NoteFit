import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, isMock } from "./config";
import { UserProfile } from "@/types/auth";

// --- MOCK STORAGE IMPLEMENTATION ---
const getMockUsers = (): UserProfile[] => {
  if (typeof window === "undefined") return [];
  const val = localStorage.getItem("notfit_mock_users");
  return val ? JSON.parse(val) : [];
};

const saveMockUsers = (users: UserProfile[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("notfit_mock_users", JSON.stringify(users));
};

const getMockCurrentUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem("notfit_mock_current_user");
  return val ? JSON.parse(val) : null;
};

const saveMockCurrentUser = (user: UserProfile | null) => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("notfit_mock_current_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("notfit_mock_current_user");
  }
};

const listeners = new Set<(user: User | null) => void>();

const notifyListeners = (user: User | null) => {
  listeners.forEach((l) => l(user));
};

const makeMockFirebaseUser = (profile: UserProfile): User => {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: "mock-token",
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => "mock-id-token",
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
  } as unknown as User;
};

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  phoneNumber?: string
): Promise<UserCredential> => {
  const normalizedPhone = phoneNumber ? phoneNumber.replace(/\D/g, "") : null;

  if (isMock) {
    const users = getMockUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error("auth/email-already-in-use");
    }
    const isFirstAdmin = email.toLowerCase() === "admin@notfit.com";
    const profile: UserProfile = {
      uid,
      email,
      displayName,
      phoneNumber: phoneNumber || null,
      normalizedPhoneNumber: normalizedPhone,
      photoURL: null,
      currentWeight: null,
      fitnessGoal: null,
      workoutFrequency: 4,
      restDays: ["Sunday"],
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      onboardingComplete: false,
      role: isFirstAdmin ? "admin" : "user",
      isAdmin: isFirstAdmin,
    };
    users.push(profile);
    saveMockUsers(users);
    saveMockCurrentUser(profile);
    
    const firebaseUser = makeMockFirebaseUser(profile);
    notifyListeners(firebaseUser);
    
    return {
      user: firebaseUser,
      providerId: "password",
      operationType: "signIn",
    } as UserCredential;
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  const isFirstAdmin = email.toLowerCase() === "admin@notfit.com";
  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    email,
    displayName,
    phoneNumber: phoneNumber || null,
    normalizedPhoneNumber: normalizedPhone,
    photoURL: null,
    currentWeight: null,
    fitnessGoal: null,
    workoutFrequency: 4,
    restDays: ["Sunday"],
    createdAt: serverTimestamp(),
    onboardingComplete: false,
    role: isFirstAdmin ? "admin" : "user",
    isAdmin: isFirstAdmin,
  });

  if (normalizedPhone) {
    try {
      await setDoc(doc(db, "phone_lookup", normalizedPhone), {
        email,
        uid: credential.user.uid,
      });
    } catch (err) {
      console.error("Failed to create phone lookup mapping:", err);
    }
  }

  return credential;
};

export const getEmailByPhoneNumber = async (phoneNumber: string): Promise<string | null> => {
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  if (!cleanPhone) return null;

  if (isMock) {
    const users = getMockUsers();
    const profile = users.find((u) => {
      if (!u.phoneNumber) return false;
      return u.phoneNumber.replace(/\D/g, "") === cleanPhone;
    });
    return profile ? profile.email : null;
  }

  // Attempt direct document read first (doesn't scan whole collection, avoids permission issues)
  try {
    const lookupDoc = await getDoc(doc(db, "phone_lookup", cleanPhone));
    if (lookupDoc.exists()) {
      return lookupDoc.data().email || null;
    }
  } catch (err) {
    console.error("Direct phone lookup document fetch failed:", err);
  }

  // Fallback (for older accounts registered before this system)
  try {
    const usersRef = collection(db, "users");
    
    // First query by exact match
    let q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    let snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data().email || null;
    }

    // If no match, try querying by normalizedPhoneNumber
    q = query(usersRef, where("normalizedPhoneNumber", "==", cleanPhone));
    snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data().email || null;
    }
  } catch (err) {
    console.error("Collection query fallback failed (rules restricted):", err);
  }

  return null;
};

export const signIn = async (
  identifier: string,
  password: string
): Promise<UserCredential> => {
  let email = identifier;
  const isEmail = identifier.includes("@");

  if (!isEmail) {
    // If it's a phone number, attempt to resolve the email first
    const resolvedEmail = await getEmailByPhoneNumber(identifier);
    if (!resolvedEmail) {
      throw new Error("auth/user-not-found");
    }
    email = resolvedEmail;
  }

  if (isMock) {
    const users = getMockUsers();
    const profile = users.find((u) => u.email === email);
    if (!profile) {
      throw new Error("auth/user-not-found");
    }
    saveMockCurrentUser(profile);
    
    const firebaseUser = makeMockFirebaseUser(profile);
    notifyListeners(firebaseUser);
    
    return {
      user: firebaseUser,
      providerId: "password",
      operationType: "signIn",
    } as UserCredential;
  }

  return signInWithEmailAndPassword(auth, email, password);
};

export const logOut = async (): Promise<void> => {
  if (isMock) {
    saveMockCurrentUser(null);
    notifyListeners(null);
    return;
  }
  return signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (isMock) {
    const users = getMockUsers();
    const found = users.find((u) => u.uid === uid) || null;
    if (found && found.email.toLowerCase() === "admin@notfit.com" && found.role !== "admin") {
      found.role = "admin";
      found.isAdmin = true;
      saveMockUsers(users);
    }
    return found;
  }

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfile;
  
  if (data && data.email && data.email.toLowerCase() === "admin@notfit.com" && data.role !== "admin") {
    data.role = "admin";
    data.isAdmin = true;
    await setDoc(doc(db, "users", uid), { role: "admin", isAdmin: true }, { merge: true });
  }
  
  return data;
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  if (isMock) {
    const users = getMockUsers();
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      saveMockUsers(users);
      
      const current = getMockCurrentUser();
      if (current && current.uid === uid) {
        saveMockCurrentUser(users[idx]);
      }
    }
    return;
  }

  await setDoc(doc(db, "users", uid), data, { merge: true });
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (isMock) {
    listeners.add(callback);
    // Trigger initial state callback immediately
    const current = getMockCurrentUser();
    if (current) {
      callback(makeMockFirebaseUser(current));
    } else {
      callback(null);
    }
    return () => {
      listeners.delete(callback);
    };
  }

  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  if (isMock) {
    const profile: UserProfile = {
      uid: "mock_google_user",
      email: "google.user@example.com",
      displayName: "Google Athlete",
      phoneNumber: null,
      photoURL: null,
      currentWeight: null,
      fitnessGoal: null,
      workoutFrequency: 4,
      restDays: ["Sunday"],
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      onboardingComplete: false,
    };
    const users = getMockUsers();
    if (!users.some((u) => u.uid === profile.uid)) {
      users.push(profile);
      saveMockUsers(users);
    }
    saveMockCurrentUser(profile);
    const firebaseUser = makeMockFirebaseUser(profile);
    notifyListeners(firebaseUser);
    return {
      user: firebaseUser,
      providerId: "google.com",
      operationType: "signIn",
    } as UserCredential;
  }
  
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  
  const userSnap = await getDoc(doc(db, "users", credential.user.uid));
  if (!userSnap.exists()) {
    const phoneNumber = credential.user.phoneNumber;
    const normalizedPhone = phoneNumber ? phoneNumber.replace(/\D/g, "") : null;

    const isFirstAdmin = (credential.user.email || "").toLowerCase() === "admin@notfit.com";
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      email: credential.user.email || "",
      displayName: credential.user.displayName || "Athlete",
      phoneNumber: phoneNumber || null,
      normalizedPhoneNumber: normalizedPhone,
      photoURL: credential.user.photoURL || null,
      currentWeight: null,
      fitnessGoal: null,
      workoutFrequency: 4,
      restDays: ["Sunday"],
      createdAt: serverTimestamp(),
      onboardingComplete: false,
      role: isFirstAdmin ? "admin" : "user",
      isAdmin: isFirstAdmin,
    });

    if (normalizedPhone) {
      try {
        await setDoc(doc(db, "phone_lookup", normalizedPhone), {
          email: credential.user.email || "",
          uid: credential.user.uid
        });
      } catch (err) {
        console.error("Failed to store Google user phone mapping:", err);
      }
    }
  }
  return credential;
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  if (isMock) {
    return getMockUsers();
  }
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
};

export const sendAdminPasswordReset = async (email: string): Promise<void> => {
  if (isMock) {
    return; // Mock success simulated on client toast
  }
  await sendPasswordResetEmail(auth, email);
};
