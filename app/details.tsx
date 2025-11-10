import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🧠 Định nghĩa rõ các tham số được truyền từ Home hoặc Search
type TourParams = {
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
  const { name, location, rating, price, image, description, startDate } =
    useLocalSearchParams<TourParams>();

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.buttonText}>Quay lại</Text>
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
