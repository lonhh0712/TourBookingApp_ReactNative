import { getApp, getApps, initializeApp } from "firebase/app";
import { addDoc, collection, getDocs, getFirestore } from "firebase/firestore";

// 🔹 Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBFaiDPFKpuJA_8UFpkzY9PNqsBXQyPlJY",
  authDomain: "tourbookingapp-f2302.firebaseapp.com",
  projectId: "tourbookingapp-f2302",
  storageBucket: "tourbookingapp-f2302.firebasestorage.app",
  messagingSenderId: "393943018465",
  appId: "1:393943018465:web:84db7cfff00faaf8e180a0"
};

// 🔹 Khởi tạo Firebase (chỉ 1 lần)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// 🔹 Cloudinary config
const CLOUDINARY_UPLOAD_PRESET = "tour_uploads";
const CLOUDINARY_CLOUD_NAME = "dv503ep4p";


// ===========================================================
// ✅ LẤY DỮ LIỆU TOUR TỪ FIRESTORE
// ===========================================================
export async function getTours() {
  try {
    const toursRef = collection(db, "tours");
    const snapshot = await getDocs(toursRef);

    const tours: any[] = [];
    snapshot.forEach((doc) => {
      tours.push({ id: doc.id, ...doc.data() });
    });

    console.log("✅ Đã tải dữ liệu:", tours.length, "tour(s)");
    return tours;
  } catch (error) {
    console.error("🔥 Lỗi khi tải dữ liệu Firestore:", error);
    throw error;
  }
}


// ===========================================================
// ✅ THÊM TOUR MỚI VÀO FIRESTORE (CÓ startDate)
// ===========================================================
export async function addTourToFirestore(tour: any) {
  try {
    if (!tour.name || !tour.location || !tour.price || !tour.image || !tour.startDate) {
      throw new Error("Thiếu dữ liệu tour");
    }

    const toursRef = collection(db, "tours");
    await addDoc(toursRef, {
      ...tour,
      startDate: new Date(tour.startDate) // ✅ Lưu dưới dạng Firestore Timestamp
    });

    console.log("✅ Tour mới đã được thêm:", tour.name);
    return true;
  } catch (error) {
    console.error("🔥 Lỗi khi thêm tour vào Firestore:", error);
    throw error;
  }
}



// ===========================================================
// ✅ UPLOAD ẢNH LÊN CLOUDINARY
// ===========================================================
export async function uploadImageToCloudinary(uri: string) {
  try {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();
    if (result.secure_url) {
      console.log("✅ Ảnh đã upload lên Cloudinary:", result.secure_url);
      return result.secure_url;
    } else {
      console.error("❌ Upload thất bại:", result);
      throw new Error("Upload ảnh thất bại");
    }
  } catch (error) {
    console.error("🔥 Lỗi upload Cloudinary:", error);
    throw error;
  }
}
