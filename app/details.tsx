import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addBookmark,
  auth,
  getBookmarks,
  removeBookmark,
} from "../backend/firebaseService";

// 🧠 Định nghĩa rõ các tham số được truyền từ Home hoặc Search
type TourParams = {
  id?: string;
  name?: string;
  location?: string;
  price?: string;
  rating?: string;
  image?: string;
  description?: string;
  startDate?: string;
};

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<TourParams>();
  const tourId = useMemo(() => {
    const rawId = params.id;
    if (Array.isArray(rawId)) return rawId[0];
    return rawId ?? undefined;
  }, [params.id]);

  const { name, location, rating, price, image, description, startDate } = params;
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkSyncing, setBookmarkSyncing] = useState(false);

  // 🗓️ Format ngày khởi hành (nếu có)
  let formattedDate = "Chưa cập nhật";

  if (startDate) {
    try {
      const dateObj = new Date(startDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString("vi-VN");
      }
    } catch (e) {
      formattedDate = "Không xác định";
    }
  }

  useEffect(() => {
    let active = true;

    const syncBookmarkStatus = async () => {
      if (!tourId) {
        if (active) setBookmarked(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        if (active) setBookmarked(false);
        return;
      }

      try {
        const bookmarks = await getBookmarks(user.uid);
        if (active) {
          setBookmarked(bookmarks.includes(tourId));
        }
      } catch (error) {
        console.error("sync bookmarks failed", error);
      }
    };

    syncBookmarkStatus();

    return () => {
      active = false;
    };
  }, [tourId]);

  const toggleBookmark = async () => {
    if (!tourId) {
      Alert.alert("Không thể lưu", "Tour này chưa có mã định danh.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để lưu tour yêu thích.", [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đăng nhập",
          onPress: () => router.replace("/(auth)/sign-in"),
        },
      ]);
      return;
    }

    try {
      setBookmarkSyncing(true);
      if (bookmarked) {
        await removeBookmark(user.uid, tourId);
        setBookmarked(false);
      } else {
        await addBookmark(user.uid, tourId);
        setBookmarked(true);
      }
    } catch (error) {
      console.error("toggle bookmark failed", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái đánh dấu.");
    } finally {
      setBookmarkSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topBarButton}
          activeOpacity={0.8}
          onPress={toggleBookmark}
          disabled={bookmarkSyncing}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={18}
            color={bookmarked ? "#FBBF24" : "#fff"}
          />
        </TouchableOpacity>
      </View>
      {/* Ảnh tour */}
      <Image source={{ uri: image }} style={styles.image} />

      {/* Nội dung chi tiết */}
      <View style={styles.content}>
        <Text style={styles.title}>{name}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#2563EB" />
          <Text style={styles.location}>{location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <Text style={styles.startDate}>Khởi hành: {formattedDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="star" size={18} color="#FBBF24" />
          <Text style={styles.rating}>Đánh giá: {rating}</Text>
        </View>

        <Text style={styles.price}>{price}</Text>

        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "./book-tour",
              params: {
                id: tourId,
                name,
                location,
                price,
                image,
                rating,
                startDate,
                description,
              },
            })
          }
        >
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Book Tour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topBarButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
  },
  image: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  location: {
    fontSize: 15,
    color: "#4B5563",
    marginLeft: 6,
  },
  startDate: {
    fontSize: 15,
    color: "#2563EB",
    marginLeft: 6,
  },
  rating: {
    fontSize: 15,
    color: "#F59E0B",
    marginLeft: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 10,
  },
  description: {
    fontSize: 15,
    color: "#374151",
    marginTop: 14,
    lineHeight: 22,
  },
  button: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
});
