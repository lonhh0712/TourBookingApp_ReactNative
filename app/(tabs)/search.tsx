import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const results = [
  {
    id: "1",
    name: "Đà Lạt",
    location: "Lâm Đồng, Việt Nam",
    price: "$894/Người",
    image: require("../../assets/images/dalat.jpg"),
  },
  {
    id: "2",
    name: "Sa Pa",
    location: "Lào Cai, Việt Nam",
    price: "$894/Người",
    image: require("../../assets/images/sapa.jpg"),
  },
  {
    id: "3",
    name: "Phú Quốc",
    location: "Kiên Giang, Việt Nam",
    price: "$1020/Người",
    image: require("../../assets/images/phuquoc.jpg"),
  },
  {
    id: "4",
    name: "Đà Nẵng",
    location: "Đà Nẵng, Việt Nam",
    price: "$980/Người",
    image: require("../../assets/images/danang.jpg"),
  },
  {
    id: "5",
    name: "Huế",
    location: "Thừa Thiên Huế, Việt Nam",
    price: "$870/Người",
    image: require("../../assets/images/hue.jpg"),
  },
  {
    id: "6",
    name: "Vũng Tàu",
    location: "Bà Rịa - Vũng Tàu, Việt Nam",
    price: "$750/Người",
    image: require("../../assets/images/vungtau.jpg"),
  },
  {
    id: "7",
    name: "Phú Yên",
    location: "Phú Yên, Việt Nam",
    price: "$910/Người",
    image: require("../../assets/images/phuyen.jpg"),
  },
  {
    id: "8",
    name: "Hà Giang",
    location: "Hà Giang, Việt Nam",
    price: "$940/Người",
    image: require("../../assets/images/hagiang.jpg"),
  },
];

export default function SearchScreen() {
  const router = useRouter();

  const renderCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/details",
          params: { name: item.name, location: item.location, price: item.price },
        })
      }
    >
      <Image source={item.image} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardLocation}>{item.location}</Text>
        <Text style={styles.cardPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm</Text>
        <TouchableOpacity>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Search Places"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <Ionicons name="mic-outline" size={20} color="#9CA3AF" />
      </View>

      {/* Kết quả */}
      <Text style={styles.sectionTitle}>Kết quả</Text>

      <FlatList
        data={results}
        numColumns={2} // ✅ Hiển thị 2 cột
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
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
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  cancelText: {
    fontSize: 16,
    color: "#2563EB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    width: "48%", // ✅ 2 cột đều nhau
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  cardLocation: {
    fontSize: 13,
    color: "#6B7280",
    marginVertical: 2,
  },
  cardPrice: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
});
