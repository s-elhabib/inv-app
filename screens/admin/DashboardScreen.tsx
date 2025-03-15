import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { LineChart, PieChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { ArrowUp, ArrowDown, Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react-native"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { useFocusEffect } from "@react-navigation/native"

const screenWidth = Dimensions.get("window").width

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    clientCount: 0,
    productCount: 0,
    totalRevenue: 0,
    totalSales: 0,
    clientGrowth: 0,
    productGrowth: 0,
    revenueGrowth: 0,
    salesGrowth: 0,
    monthlyRevenue: [0, 0, 0, 0, 0, 0],
    categorySales: [],
    topClients: []
  })

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData()
    }, [])
  )

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch client count
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, created_at')
      
      if (clientError) {
        console.error("Client fetch error:", clientError)
        throw clientError
      }
      
      console.log("Fetched clients:", clients?.length || 0)
      
      // Fetch product count
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, category_id, created_at')
      
      if (productError) throw productError

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, amount, product_id, created_at')
      
      if (salesError) throw salesError

      // Calculate total revenue
      const totalRevenue = sales ? sales.reduce((sum, sale) => sum + (sale.amount || 0), 0) : 0
      
      // Calculate monthly revenue (last 6 months)
      const monthlyRevenue = calculateMonthlyRevenue(sales || [])
      
      // Calculate category sales
      const categorySales = calculateCategorySales(sales || [], products || [])
      
      // Calculate growth percentages
      const clientGrowth = calculateGrowth(clients || [], 'created_at')
      const productGrowth = calculateGrowth(products || [], 'created_at')
      const revenueGrowth = 15 // Placeholder - replace with actual calculation
      const salesGrowth = sales ? (sales.length > 0 ? -3 : 0) : 0 // Placeholder

      // Fetch sales with client information
      const { data: salesWithClients, error: salesClientError } = await supabase
        .from('sales')
        .select(`
          amount,
          clients:client_id (
            id, name
          )
        `)
      
      if (salesClientError) throw salesClientError

      // Calculate top clients by revenue
      const clientRevenue = {}
      salesWithClients?.forEach(sale => {
        if (sale.clients && sale.clients.id) {
          const clientId = sale.clients.id
          const clientName = sale.clients.name
          if (!clientRevenue[clientId]) {
            clientRevenue[clientId] = { id: clientId, name: clientName, total: 0 }
          }
          clientRevenue[clientId].total += (sale.amount || 0)
        }
      })

      // Convert to array and sort by revenue
      const topClients = Object.values(clientRevenue)
        .sort((a, b) => b.total - a.total)
        .slice(0, 4)

      setDashboardData({
        clientCount: clients?.length || 0,
        productCount: products?.length || 0,
        totalRevenue,
        totalSales: sales?.length || 0,
        clientGrowth,
        productGrowth,
        revenueGrowth,
        salesGrowth,
        monthlyRevenue,
        categorySales,
        topClients
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyRevenue = (sales) => {
    const months = Array(6).fill(0)
    const now = new Date()
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at)
      const monthDiff = (now.getMonth() - saleDate.getMonth()) + 
                        (now.getFullYear() - saleDate.getFullYear()) * 12
      
      if (monthDiff >= 0 && monthDiff < 6) {
        months[5 - monthDiff] += (sale.amount || 0)
      }
    })
    
    return months
  }

  const calculateCategorySales = (sales, products) => {
    const categories = {
      "Food": { population: 0, color: "#F47B20" },
      "Drink": { population: 0, color: "#2196F3" },
      "Snack": { population: 0, color: "#4CAF50" },
      "Dessert": { population: 0, color: "#9C27B0" }
    }
    
    // Create a map of product_id to category_id
    const productCategories = {}
    products.forEach(product => {
      productCategories[product.id] = product.category_id
    })
    
    // Count sales by category
    sales.forEach(sale => {
      const categoryId = productCategories[sale.product_id]
      const categoryName = getCategoryName(categoryId)
      if (categories[categoryName]) {
        categories[categoryName].population += 1
      }
    })
    
    // Convert to array format needed for PieChart
    return Object.entries(categories).map(([name, data]) => ({
      name,
      population: data.population || 1, // Ensure at least 1 for display
      color: data.color,
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    }))
  }

  const getCategoryName = (categoryId) => {
    // Map category IDs to names - replace with actual mapping from your database
    const categoryMap = {
      1: "Food",
      2: "Drink",
      3: "Snack",
      4: "Dessert"
    }
    return categoryMap[categoryId] || "Food"
  }

  const calculateGrowth = (items, dateField) => {
    if (!items.length) return 0
    
    const now = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(now.getMonth() - 2)
    
    const currentPeriodItems = items.filter(item => {
      const date = new Date(item[dateField])
      return date >= oneMonthAgo && date <= now
    })
    
    const previousPeriodItems = items.filter(item => {
      const date = new Date(item[dateField])
      return date >= twoMonthsAgo && date < oneMonthAgo
    })
    
    if (previousPeriodItems.length === 0) return currentPeriodItems.length > 0 ? 100 : 0
    
    return Math.round(((currentPeriodItems.length - previousPeriodItems.length) / previousPeriodItems.length) * 100)
  }

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 1 })}k`
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#F47B20" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Admin Dashboard</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Users size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{dashboardData.clientCount}</Text>
            <Text style={styles.statsLabel}>Total Clients</Text>
            <View style={[
              styles.statsChange,
              dashboardData.clientGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.clientGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.clientGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.clientGrowth >= 0 ? '+' : ''}{dashboardData.clientGrowth}%
              </Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <ShoppingBag size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{dashboardData.productCount}</Text>
            <Text style={styles.statsLabel}>Total Products</Text>
            <View style={[
              styles.statsChange,
              dashboardData.productGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.productGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.productGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.productGrowth >= 0 ? '+' : ''}{dashboardData.productGrowth}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <DollarSign size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{formatCurrency(dashboardData.totalRevenue/1000)}</Text>
            <Text style={styles.statsLabel}>Total Revenue</Text>
            <View style={[
              styles.statsChange,
              dashboardData.revenueGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.revenueGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.revenueGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.revenueGrowth >= 0 ? '+' : ''}{dashboardData.revenueGrowth}%
              </Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <TrendingUp size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{dashboardData.totalSales}</Text>
            <Text style={styles.statsLabel}>Total Sales</Text>
            <View style={[
              styles.statsChange,
              dashboardData.salesGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.salesGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.salesGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.salesGrowth >= 0 ? '+' : ''}{dashboardData.salesGrowth}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Overview</Text>
        <LineChart
          data={{
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                data: dashboardData.monthlyRevenue.length > 0 ? 
                  dashboardData.monthlyRevenue : 
                  [20, 45, 28, 80, 99, 43],
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
          }}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={false}
        />
      </View>

      <View style={styles.chartRow}>
        <View style={[styles.chartCard, styles.halfChart]}>
          <Text style={styles.chartTitle}>Sales by Category</Text>
          <PieChart
            data={dashboardData.categorySales.length > 0 ? 
              dashboardData.categorySales : 
              [
                {
                  name: "Food",
                  population: 45,
                  color: "#F47B20",
                  legendFontColor: "#7F7F7F",
                  legendFontSize: 12,
                },
                {
                  name: "Drink",
                  population: 28,
                  color: "#2196F3",
                  legendFontColor: "#7F7F7F",
                  legendFontSize: 12,
                },
                {
                  name: "Snack",
                  population: 17,
                  color: "#4CAF50",
                  legendFontColor: "#7F7F7F",
                  legendFontSize: 12,
                },
                {
                  name: "Dessert",
                  population: 10,
                  color: "#9C27B0",
                  legendFontColor: "#7F7F7F",
                  legendFontSize: 12,
                },
              ]
            }
            width={screenWidth / 2 - 30}
            height={180}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>

        <View style={[styles.chartCard, styles.halfChart]}>
          <Text style={styles.chartTitle}>Top Clients</Text>
          <View style={styles.clientsList}>
            {dashboardData.topClients.length > 0 ? (
              dashboardData.topClients.map(client => (
                <View key={client.id} style={styles.clientItem}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientValue}>{formatCurrency(client.total/1000)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No client data available</Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 15,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    width: "48%",
  },
  statsIconContainer: {
    backgroundColor: "rgba(244, 123, 32, 0.1)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statsChange: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statsChangeNegative: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  statsChangeText: {
    fontSize: 10,
    color: "#4CAF50",
    marginLeft: 2,
  },
  statsChangeTextNegative: {
    fontSize: 10,
    color: "#F44336",
    marginLeft: 2,
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfChart: {
    width: "48%",
  },
  clientsList: {
    marginTop: 10,
  },
  clientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  clientName: {
    fontSize: 12,
    color: "#666",
  },
  clientValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  emptyText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    padding: 10,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
})

