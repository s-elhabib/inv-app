"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { LineChart, BarChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { Calendar, ArrowUp, ArrowDown } from "lucide-react-native"
import { supabase } from "../../lib/supabase"

const screenWidth = Dimensions.get("window").width

export default function AnalyticsScreen() {
  const [timeframe, setTimeframe] = useState("Monthly")
  const [activeTab, setActiveTab] = useState("Revenue")
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [0, 0, 0, 0, 0, 0],
    revenueLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    totalRevenue: 0,
    averageOrder: 0,
    topSellingProducts: [0, 0, 0, 0],
    topSellingLabels: ["Food", "Drink", "Snack", "Dessert"],
    activeClients: 0,
    revenueGrowth: 0,
    averageOrderGrowth: 0,
    activeClientsGrowth: 0
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch sales data for the last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', sixMonthsAgo.toISOString())
      
      if (salesError) throw salesError

      // Fetch profiles (clients) data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
      
      if (profilesError) throw profilesError

      // Calculate monthly revenue
      const monthlyData = calculateMonthlyRevenue(sales || [])
      
      // Calculate total revenue
      const totalRevenue = sales ? sales.reduce((sum, sale) => sum + (sale.revenue || 0), 0) : 0
      
      // Calculate average order value
      const averageOrder = sales && sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0
      
      // Calculate top selling products by category
      const topSelling = await calculateTopSellingCategories()
      
      // Count active clients (assuming all clients are active for this example)
      const activeClients = profiles ? profiles.length : 0
      
      // Calculate growth percentages
      const revenueGrowth = calculateRevenueGrowth(sales || [])
      const averageOrderGrowth = calculateAverageOrderGrowth(sales || [])
      const activeClientsGrowth = calculateActiveClientsGrowth(profiles || [])

      setAnalyticsData({
        revenueData: monthlyData.data,
        revenueLabels: monthlyData.labels,
        totalRevenue,
        averageOrder,
        topSellingProducts: topSelling.data,
        topSellingLabels: topSelling.labels,
        activeClients,
        revenueGrowth,
        averageOrderGrowth,
        activeClientsGrowth
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
      Alert.alert("Error", "Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyRevenue = (sales) => {
    const months = Array(6).fill(0)
    const now = new Date()
    
    // Create array of month labels (last 6 months)
    const monthNames = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(now.getMonth() - i)
      monthNames.push(d.toLocaleString('default', { month: 'short' }))
    }
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at)
      const monthDiff = (now.getMonth() - saleDate.getMonth()) + 
                       (now.getFullYear() - saleDate.getFullYear()) * 12
      
      if (monthDiff >= 0 && monthDiff < 6) {
        months[5 - monthDiff] += (sale.revenue || 0)
      }
    })
    
    return { data: months, labels: monthNames }
  }

  const calculateTopSellingCategories = async () => {
    try {
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          quantity,
          products (
            category_id
          )
        `)
      
      if (salesError) throw salesError

      // Count sales by category
      const categoryCounts = {
        1: 0, // Fruits & Vegetables
        2: 0, // Groceries
        3: 0, // Meat
        4: 0  // Dairy
      }
      
      sales?.forEach(sale => {
        const categoryId = sale.products?.category_id
        if (categoryId && categoryCounts[categoryId] !== undefined) {
          categoryCounts[categoryId] += sale.quantity || 0
        }
      })
      
      // Map category IDs to names
      const categoryMap = {
        1: "Fruits & Veg",
        2: "Groceries",
        3: "Meat",
        4: "Dairy"
      }
      
      const data = Object.values(categoryCounts)
      const labels = Object.keys(categoryCounts).map(id => categoryMap[id] || `Category ${id}`)
      
      return { data, labels }
    } catch (error) {
      console.error("Error calculating top selling categories:", error)
      return { data: [0, 0, 0, 0], labels: ["Cat 1", "Cat 2", "Cat 3", "Cat 4"] }
    }
  }

  const calculateRevenueGrowth = (sales) => {
    const now = new Date()
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1))
    const twoMonthsAgo = new Date(now.setMonth(now.getMonth() - 1))
    
    const currentPeriodSales = sales.filter(sale => 
      new Date(sale.created_at) >= oneMonthAgo
    )
    
    const previousPeriodSales = sales.filter(sale => 
      new Date(sale.created_at) >= twoMonthsAgo && 
      new Date(sale.created_at) < oneMonthAgo
    )
    
    const currentRevenue = currentPeriodSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0)
    const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0)
    
    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0
    
    return Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
  }

  const calculateAverageOrderGrowth = (sales) => {
    const now = new Date()
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1))
    const twoMonthsAgo = new Date(now.setMonth(now.getMonth() - 1))
    
    const currentPeriodSales = sales.filter(sale => 
      new Date(sale.created_at) >= oneMonthAgo
    )
    
    const previousPeriodSales = sales.filter(sale => 
      new Date(sale.created_at) >= twoMonthsAgo && 
      new Date(sale.created_at) < oneMonthAgo
    )
    
    const currentAvg = currentPeriodSales.length > 0 
      ? currentPeriodSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0) / currentPeriodSales.length 
      : 0
    
    const previousAvg = previousPeriodSales.length > 0 
      ? previousPeriodSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0) / previousPeriodSales.length 
      : 0
    
    if (previousAvg === 0) return currentAvg > 0 ? 100 : 0
    
    return Math.round(((currentAvg - previousAvg) / previousAvg) * 100)
  }

  const calculateActiveClientsGrowth = (clients) => {
    // For this example, we'll consider all clients as active
    // You might want to add a status field to profiles table for more accurate tracking
    const now = new Date()
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1))
    const twoMonthsAgo = new Date(now.setMonth(now.getMonth() - 1))
    
    const currentActive = clients.filter(client => 
      new Date(client.created_at) < now
    ).length
    
    const previousActive = clients.filter(client => 
      new Date(client.created_at) < oneMonthAgo
    ).length
    
    if (previousActive === 0) return currentActive > 0 ? 100 : 0
    
    return Math.round(((currentActive - previousActive) / previousActive) * 100)
  }

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} MAD`
  }

  const renderTabContent = () => {
    if (activeTab === "Revenue") {
      return (
        <>
          <View style={styles.chartCard}>
            <LineChart
              data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [{
                  data: [20, 45, 28, 80, 99, 43],
                  color: (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                  strokeWidth: 2
                }]
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                fillShadowGradientFrom: "rgba(244, 123, 32, 0.2)",
                fillShadowGradientTo: "rgba(244, 123, 32, 0)",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                labelColor: () => `#666`,
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#fff"
                },
                propsForBackgroundLines: {
                  strokeDasharray: "",
                  stroke: "#F5F5F5",
                }
              }}
              bezier
              style={styles.chart}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withInnerLines={false}
              withOuterLines={true}
            />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Total Revenue</Text>
                <Text style={styles.statsValue}>$45,237</Text>
                <View style={styles.statsChange}>
                  <ArrowUp size={12} color="#4CAF50" />
                  <Text style={styles.statsChangeText}>+15% vs last period</Text>
                </View>
              </View>

              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Average Order</Text>
                <Text style={styles.statsValue}>$128</Text>
                <View style={styles.statsChange}>
                  <ArrowUp size={12} color="#4CAF50" />
                  <Text style={styles.statsChangeText}>+3% vs last period</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Conversion Rate</Text>
                <Text style={styles.statsValue}>24.8%</Text>
                <View style={[styles.statsChange, styles.statsChangeNegative]}>
                  <ArrowDown size={12} color="#F44336" />
                  <Text style={[styles.statsChangeText, styles.statsChangeTextNegative]}>-2% vs last period</Text>
                </View>
              </View>

              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Active Clients</Text>
                <Text style={styles.statsValue}>18</Text>
                <View style={styles.statsChange}>
                  <ArrowUp size={12} color="#4CAF50" />
                  <Text style={styles.statsChangeText}>+4 vs last period</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )
    } else if (activeTab === "Products") {
      return (
        <>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Sales by Category</Text>
            <BarChart
              data={{
                labels: analyticsData.topSellingLabels,
                datasets: [
                  {
                    data: analyticsData.topSellingProducts,
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
                barPercentage: 0.7,
                propsForBackgroundLines: {
                  strokeDasharray: "",
                  stroke: "#F5F5F5",
                },
              }}
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              showBarTops={false}
              fromZero={true}
            />
          </View>
        </>
      );
    } else if (activeTab === "Clients") {
      return (
        <>
          <View style={styles.statsCard} style={{marginHorizontal: 20, marginTop: 10}}>
            <Text style={styles.statsLabel}>Active Clients</Text>
            <Text style={styles.statsValue}>{analyticsData.activeClients}</Text>
            <View style={[
              styles.statsChange,
              analyticsData.activeClientsGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {analyticsData.activeClientsGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={[
                styles.statsChangeText,
                analyticsData.activeClientsGrowth < 0 ? styles.statsChangeTextNegative : null
              ]}>
                {analyticsData.activeClientsGrowth >= 0 ? '+' : ''}{analyticsData.activeClientsGrowth}%
              </Text>
            </View>
          </View>
        </>
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity style={styles.timeframeButton}>
          <Calendar size={16} color="#666" />
          <Text style={styles.timeframeText}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {["Revenue", "Sales", "Products", "Clients"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
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
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F5F5F5",
    padding: 4,
    borderRadius: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabButtonText: {
    color: "#F47B20",
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsGrid: {
    marginHorizontal: 15,
    marginTop: 15,
    gap: 15
  },
  statsRow: {
    flexDirection: "row",
    gap: 15
  },
  statsCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15
  },
  statsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8
  },
  statsChange: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start"
  },
  statsChangeNegative: {
    backgroundColor: "rgba(244, 67, 54, 0.1)"
  },
  statsChangeText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 4
  },
  statsChangeTextNegative: {
    color: "#F44336"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
})

