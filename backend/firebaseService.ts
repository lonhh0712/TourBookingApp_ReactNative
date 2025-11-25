// ===========================================================
// 🔥 Firebase Setup
// ===========================================================
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// -----------------------------------------------------------
// 🔧 Firebase Config
// -----------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBFaiDPFKpuJA_8UFpkzY9PNqsBXQyPlJY",
  authDomain: "tourbookingapp-f2302.firebaseapp.com",
  projectId: "tourbookingapp-f2302",
  storageBucket: "tourbookingapp-f2302.firebasestorage.app",
  messagingSenderId: "393943018465",
  appId: "1:393943018465:web:84db7cfff00faaf8e180a0",
};

// -----------------------------------------------------------
// 🚀 Init Firebase
// -----------------------------------------------------------
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

type SignUpPayload = {
  email: string;
  password: string;
  displayName?: string;
};

type SignInPayload = {
  email: string;
  password: string;
};

type TourRecord = { id: string } & Record<string, unknown>;

// ===========================================================
// 🔧 Cloudinary Config
// ===========================================================
const CLOUDINARY_UPLOAD_PRESET = "tour_uploads";
const CLOUDINARY_CLOUD_NAME = "dv503ep4p";


// ===========================================================
// 🔹 1️⃣ TOUR FUNCTIONS
// ===========================================================

// 🔹 Lấy tất cả tour
export async function getTours() {
  const snapshot = await getDocs(collection(db, "tours"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// 🔹 Thêm tour mới
export async function addTourToFirestore(tour: any) {
  if (!tour.name || !tour.location || !tour.price || !tour.image || !tour.startDate) {
    throw new Error("Thiếu dữ liệu tour");
  }

  await addDoc(collection(db, "tours"), {
    ...tour,
    startDate: tour.startDate, // lưu dạng string ISO
    createdAt: new Date().toISOString(),
  });

  return true;
}



// ===========================================================
// 🔹 2️⃣ AUTH + USER PROFILE
// ===========================================================

// 🔹 Đăng ký tài khoản
export async function sign_up({ email, password, displayName }: SignUpPayload): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  // 🔥 Tạo document trong Firestore
  await setDoc(doc(db, "users", credential.user.uid), {
    email,
    displayName,
    role: "user",
    createdAt: new Date().toISOString(),
  });

  return credential.user;
}

// 🔹 Đăng nhập
export async function sign_in({ email, password }: SignInPayload): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// 🔹 Lấy thông tin user từ Firestore
export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
}

// 🔹 Cập nhật hồ sơ
export async function updateUserProfile(uid: string, data: any) {
  await updateDoc(doc(db, "users", uid), data);
  return true;
}



// ===========================================================
// 🔹 3️⃣ FAVORITES (Tour đã lưu)
// ===========================================================

export async function addBookmark(uid: string, tourId: string) {
  await setDoc(doc(db, `users/${uid}/bookmarks`, tourId), {
    addedAt: new Date().toISOString(),
  });
}

export async function removeBookmark(uid: string, tourId: string) {
  await deleteDoc(doc(db, `users/${uid}/bookmarks`, tourId));
}

export async function getBookmarks(uid: string) {
  const snapshot = await getDocs(collection(db, `users/${uid}/bookmarks`));
  return snapshot.docs.map((doc) => doc.id);
}

export async function getTourById(tourId: string): Promise<TourRecord | null> {
  if (!tourId) return null;

  const ref = doc(db, "tours", tourId);
  const snapshot = await getDoc(ref);
  return snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as TourRecord)
    : null;
}

export async function getToursByIds(tourIds: string[]): Promise<TourRecord[]> {
  if (!tourIds.length) return [];

  const results = await Promise.all(
    tourIds.map(async (tourId) => {
      try {
        return await getTourById(tourId);
      } catch (error) {
        console.error("getTourById failed", error);
        return null;
      }
    })
  );

  return results.filter((tour): tour is TourRecord => Boolean(tour));
}



// ===========================================================
// 🔹 4️⃣ BOOKINGS (Lịch sử đặt tour)
// ===========================================================

export async function createBooking(booking: any) {
  const bookingRef = await addDoc(collection(db, "bookings"), {
    ...booking,
    createdAt: new Date().toISOString(),
    status: "pending",
    paymentStatus: "unpaid",
    upcomingReminderSent: false,
  });

  if (booking?.userId) {
    const tourName = booking?.tourName ?? "tour";
    await addUserNotification(booking.userId, {
      title: `Đã đặt ${tourName}`,
      body: "Chúng tôi đã nhận được yêu cầu đặt tour của bạn. Vui lòng hoàn tất thanh toán để xác nhận.",
      type: "booking",
      metadata: {
        bookingId: bookingRef.id,
        tourId: booking?.tourId ?? null,
      },
    });
  }

  return bookingRef;
}

type BookingRecord = {
  id: string;
  userId?: string;
  tourId?: string | null;
  tourName?: string | null;
  startDate?: string | null;
  upcomingReminderSent?: boolean;
} & Record<string, unknown>;

export async function getBookings(uid: string) {
  const snapshot = await getDocs(collection(db, "bookings"));
  const bookings: BookingRecord[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  }));

  return bookings.filter((booking) => booking.userId === uid);
}



// ===========================================================
// 🔹 5️⃣ PAYMENTS (Thanh toán)
// ===========================================================

export async function createPayment(payment: any) {
  return await addDoc(collection(db, "payments"), {
    ...payment,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  const paymentRef = doc(db, "payments", paymentId);
  const paymentSnapshot = await getDoc(paymentRef);

  if (!paymentSnapshot.exists()) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  await updateDoc(paymentRef, { status });

  const paymentData = paymentSnapshot.data() as {
    bookingId?: string;
    userId?: string;
    amount?: number | null;
    currency?: string | null;
    tourName?: string | null;
  } | undefined;
  const bookingId = paymentData?.bookingId;

  if (bookingId) {
    await updateDoc(doc(db, "bookings", bookingId), { paymentStatus: status });
  }

  if (paymentData?.userId && status === "paid") {
    let amountLabel: string | null = null;
    if (typeof paymentData.amount === "number") {
      if (paymentData.currency === "USD") {
        amountLabel = `$${paymentData.amount.toLocaleString("en-US")}`;
      } else {
        amountLabel = `${paymentData.amount.toLocaleString("vi-VN")}đ`;
      }
    }

    await addUserNotification(paymentData.userId, {
      title: paymentData.tourName
        ? `Thanh toán tour ${paymentData.tourName}`
        : "Thanh toán thành công",
      body:
        amountLabel != null
          ? `Bạn đã thanh toán thành công ${amountLabel}. Chúc bạn có chuyến đi tuyệt vời!`
          : "Bạn đã thanh toán thành công. Chúc bạn có chuyến đi tuyệt vời!",
      type: "payment",
      metadata: {
        paymentId,
        bookingId: paymentData.bookingId ?? null,
        amount: paymentData.amount ?? null,
        currency: paymentData.currency ?? null,
      },
    });
  }
}



// ===========================================================
// 🔹 6️⃣ NOTIFICATIONS
// ===========================================================

type NotificationPayload = {
  title: string;
  body: string;
  type?: "booking" | "payment" | "reminder" | "general";
  metadata?: Record<string, unknown> | null;
};

export type NotificationRecord = {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
  type?: string;
  metadata?: Record<string, unknown> | null;
};

export async function addUserNotification(uid: string, payload: NotificationPayload) {
  if (!uid) {
    return null;
  }

  return await addDoc(collection(db, `users/${uid}/notifications`), {
    ...payload,
    metadata: payload.metadata ?? null,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

export async function getUserNotifications(uid: string, take: number = 20) {
  if (!uid) return [];

  const notificationsRef = collection(db, `users/${uid}/notifications`);
  const notificationsQuery = query(
    notificationsRef,
    orderBy("createdAt", "desc"),
    limit(Math.max(1, take))
  );
  const snapshot = await getDocs(notificationsQuery);

  return snapshot.docs.map((notification) => ({
    id: notification.id,
    ...(notification.data() as Record<string, unknown>),
  }));
}

export async function markNotificationRead(uid: string, notificationId: string, read = true) {
  if (!uid || !notificationId) return;

  await updateDoc(doc(db, `users/${uid}/notifications`, notificationId), {
    read,
    readAt: read ? new Date().toISOString() : null,
  });
}

export async function maybeNotifyUpcomingDepartures(uid: string) {
  if (!uid) return;

  const bookings = await getBookings(uid);
  if (!bookings.length) return;

  const now = new Date();
  const upperBound = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await Promise.all(
    bookings.map(async (booking) => {
      const startValue = booking.startDate ? new Date(String(booking.startDate)) : null;

      if (!startValue || Number.isNaN(startValue.getTime())) {
        return;
      }

      if (startValue < now || startValue > upperBound) {
        return;
      }

      if (booking.upcomingReminderSent) {
        return;
      }

      const formattedDate = startValue.toLocaleDateString("vi-VN");
      const title = booking.tourName
        ? `Sắp khởi hành: ${booking.tourName}`
        : "Chuyến đi sắp khởi hành";
      const body = `Tour của bạn sẽ bắt đầu vào ${formattedDate}. Đừng quên chuẩn bị hành trình!`;

      await addUserNotification(uid, {
        title,
        body,
        type: "reminder",
        metadata: {
          bookingId: booking.id,
          tourId: booking.tourId ?? null,
          startDate: booking.startDate ?? null,
        },
      });

      await updateDoc(doc(db, "bookings", booking.id), {
        upcomingReminderSent: true,
      });
    })
  );
}



// ===========================================================
// 🔹 7️⃣ UPLOAD ẢNH CLOUDINARY
// ===========================================================

export async function uploadImageToCloudinary(uri: string) {
  const data = new FormData();
  data.append("file", { uri, type: "image/jpeg", name: "upload.jpg" } as any);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: data }
  );

  const result = await res.json();
  if (!result.secure_url) throw new Error("Upload ảnh thất bại");

  return result.secure_url;
}
