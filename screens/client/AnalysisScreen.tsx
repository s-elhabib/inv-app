"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { LineChart, BarChart } from "react-native-chart-kit"
import { Calendar } from "lucide-react-native"

const screenWidth = Dimensions.get("window").width

export default function AnalysisScreen() {
  const [activeTab, setActiveTab] = useState("Sale")
  const [timeframe, setTimeframe] = useState("Monthly")
  const [productTab, setProductTab] = useState("Semua")

  const renderTabContent = () => {
    if (activeTab === "Sale") {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sales Statistics</Text>
            <TouchableOpacity style={styles.timeframeButton}>
              <Calendar size={16} color="#666" />
              <Text style={styles.timeframeText}>{timeframe}</Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={{
              labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
              datasets: [
                {
                  data: [4000, 6000, 8000, 6000, 4000, 6000],
                  color: (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#F47B20",
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "#F5F5F5",
              },
              propsForLabels: {
                fontSize: 10,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            fromZero={true}
            yAxisSuffix=""
            yAxisInterval={1}
            segments={4}
          />

          <View style={styles.targetSection}>
            <Text style={styles.sectionTitle}>Target Prediction</Text>
            <View style={styles.targetCard}>
              <Text style={styles.targetAmount}>$ 30.000.000</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: "52%" }]} />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressPercentage}>52%</Text>
                <Text style={styles.currentAmount}>$ 15.237.000</Text>
              </View>
            </View>
          </View>
        </View>
      )
    } else {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Product sale</Text>
            <TouchableOpacity style={styles.timeframeButton}>
              <Calendar size={16} color="#666" />
              <Text style={styles.timeframeText}>{timeframe}</Text>
            </TouchableOpacity>
          </View>

          <BarChart
            data={{
              labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
              datasets: [
                {
                  data: [4000, 6000, 8000, 3500, 5000, 6000],
                  colors: [
                    (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  ],
                },
                {
                  data: [2000, 3000, 2000, 1500, 2000, 2500],
                  colors: [
                    (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                    (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                    (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                    (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                    (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                    (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                  ],
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.7,
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "#F5F5F5",
              },
              propsForLabels: {
                fontSize: 10,
              },
            }}
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            fromZero={true}
            yAxisSuffix=""
            yAxisInterval={1}
            segments={4}
            showBarTops={false}
          />

          <View style={styles.categoryContainer}>
            <TouchableOpacity style={[styles.categoryButton, styles.categoryButtonActive]}>
              <Text style={styles.categoryText}>Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>Drink</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>Snack</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>Dessert</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Product</Text>
              <TouchableOpacity style={styles.timeframeButton}>
                <Calendar size={16} color="#666" />
                <Text style={styles.timeframeText}>{timeframe}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.productTabsContainer}>
              <TouchableOpacity
                style={[styles.productTab, productTab === "Semua" && styles.productTabActive]}
                onPress={() => setProductTab("Semua")}
              >
                <Text style={styles.productTabText}>Semua</Text>
                {productTab === "Semua" && <View style={styles.productTabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.productTab, productTab === "Food" && styles.productTabActive]}
                onPress={() => setProductTab("Food")}
              >
                <Text style={styles.productTabText}>Food</Text>
                {productTab === "Food" && <View style={styles.productTabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.productTab, productTab === "Drink" && styles.productTabActive]}
                onPress={() => setProductTab("Drink")}
              >
                <Text style={styles.productTabText}>Drink</Text>
                {productTab === "Drink" && <View style={styles.productTabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.productTab, productTab === "Snack" && styles.productTabActive]}
                onPress={() => setProductTab("Snack")}
              >
                <Text style={styles.productTabText}>Snack</Text>
                {productTab === "Snack" && <View style={styles.productTabIndicator} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Sale" && styles.activeTab]}
          onPress={() => setActiveTab("Sale")}
        >
          <Text style={[styles.tabText, activeTab === "Sale" && styles.activeTabText]}>Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Product" && styles.activeTab]}
          onPress={() => setActiveTab("Product")}
        >
          <Text style={[styles.tabText, activeTab === "Product" && styles.activeTabText]}>Product</Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#F47B20",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  tabContent: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timeframeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  timeframeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  targetSection: {
    marginTop: 20,
  },
  targetCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginTop: 10,
  },
  targetAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#F47B20",
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressPercentage: {
    fontSize: 12,
    color: "#666",
  },
  currentAmount: {
    fontSize: 12,
    color: "#666",
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryButtonActive: {
    backgroundColor: "#2196F3",
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
  },
  productSection: {
    marginTop: 20,
  },
  productTabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  productTab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    position: "relative",
  },
  productTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#F47B20",
  },
  productTabText: {
    fontSize: 14,
    color: "#666",
  },
  productTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 15,
    right: 15,
    height: 2,
    backgroundColor: "#F47B20",
  },
})

