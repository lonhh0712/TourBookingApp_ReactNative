import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const destinations = [
  { id: "1", name: "Phú Quốc", location: "Kiên Giang, Việt Nam", rating: 4.9, image: require("../../assets/images/phuquoc.jpg") },
  { id: "2", name: "Đà Nẵng", location: "Đà Nẵng, Việt Nam", rating: 4.8, image: require("../../assets/images/danang.jpg") },
  { id: "3", name: "Đà Lạt", location: "Lâm Đồng, Việt Nam", rating: 4.7, image: require("../../assets/images/dalat.jpg") },
  { id: "4", name: "Sa Pa", location: "Lào Cai, Việt Nam", rating: 4.9, image: require("../../assets/images/sapa.jpg") },
  { id: "5", name: "Huế", location: "Thừa Thiên Huế, Việt Nam", rating: 4.6, image: require("../../assets/images/hue.jpg") },
  { id: "6", name: "Vũng Tàu", location: "Bà Rịa - Vũng Tàu, Việt Nam", rating: 4.8, image: require("../../assets/images/vungtau.jpg") },
  { id: "7", name: "Hà Nội", location: "Thủ đô Hà Nội, Việt Nam", rating: 4.7, image: require("../../assets/images/hanoi.jpg") },
  { id: "8", name: "Phú Yên", location: "Phú Yên, Việt Nam", rating: 4.8, image: require("../../assets/images/phuyen.jpg") },
];

export default function HomeScreen() {
  const router = useRouter();

  const renderCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/details",
          params: { name: item.name, location: item.location, rating: item.rating },
        })
      }
    >
      <Image source={item.image} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardLocation}>{item.location}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={require("../../assets/images/user.png")} style={styles.avatar} />
          <Text style={styles.username}>User</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>
          Khám phá thế giới <Text style={styles.highlight}>tuyệt đẹp!</Text>
        </Text>
        <Text style={styles.subtitle}>Địa điểm tuyệt vời nhất!</Text>
      </View>

      {/* Grid 2 cột */}
      <FlatList
        data={destinations}
        numColumns={2} // ✅ hiển thị 2 cột
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 50 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={renderCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  bellButton: {
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 12,
  },
  titleBlock: {
    paddingHorizontal: 24,
    marginBottom: 12,
    paddingTop: 10,
  },
  title: {
    fontSize: 38,
    fontWeight: "400",
    color: "#111827",
    flexWrap: "wrap",
    width: "100%",
    lineHeight: 46,
  },
  highlight: {
    color: "#FF6B00",
    textDecorationLine: "underline",
  },
  subtitle: {
    fontSize: 17,
    color: "#6B7280",
    marginVertical: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 18,
    width: "48%", // ✅ 2 cột chia đều
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  cardContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  cardLocation: {
    fontSize: 13,
    color: "#6B7280",
    marginVertical: 3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    color: "#111827",
  },
});
