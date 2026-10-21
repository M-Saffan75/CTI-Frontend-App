export const SELLER_DASHBOARD_DATA = {
  sellerName: 'new',
  dateString: 'Monday 13 July 2026',
  greeting: 'Good AfterNoon',
  stats: {
    todayRevenue: 'Rs. 0',
    todayOrdersNote: 'Delivery orders Today',
    last7DaysRevenue: 'Rs. 0',
    last7DaysChange: '-100% vs prev week',
  },
  revenueTrend: [
    { label: '2 Jul', value: 0 },
    { label: '3 Jul', value: 0 },
    { label: '4 Jul', value: 0 },
    { label: '5 Jul', value: 0 },
    { label: '6 Jul', value: 0 },
    { label: '7 Jul', value: 0 },
    { label: '8 Jul', value: 0 },
  ],
  advertisingPerformance: [
    { day: 'Sun', value: 45 },
    { day: 'Mon', value: 30 },
    { day: 'Tue', value: 70 },
    { day: 'Wed', value: 35 },
    { day: 'Thu', value: 95 },
    { day: 'Fri', value: 65 },
    { day: 'Sat', value: 75 },
  ],
  actionsRequired: [
    { id: '1', title: 'Order Questions', subtitle: 'Open customer order queries', badge: '1', tabTarget: 'Enquiries' },
    { id: '2', title: 'Product Questions', subtitle: 'Open customer product queries', badge: '1', tabTarget: 'Enquiries' },
    { id: '3', title: 'Return Requests', subtitle: 'Awaiting your response', badge: '1', tabTarget: 'OrderManagement' },
  ],
};
