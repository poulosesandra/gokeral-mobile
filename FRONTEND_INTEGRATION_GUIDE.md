# Frontend Integration Guide - Sprint 2

**Date:** February 20, 2026  
**Sprint:** Sprint 2 - Booking Service Integration  
**Status:** ✅ Complete

---

## 🎯 Overview

This guide documents the frontend changes made to integrate with the new Kerides booking-service microservice (Sprint 2). All booking-related functionality now connects to the dedicated booking microservice on port 3004.

---

## 📋 Files Updated

### 1. `/src/services/api.tsx` ✅
**Changes:**
- Added `bookingApi` axios instance for port 3004
- Updated `setAuthToken()` to include bookingApi
- Added bookingApi to interceptors array

**New Code:**
```typescript
// Booking Service API (Port 3004) - Sprint 2
export const bookingApi = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3004',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});
```

### 2. `/src/services/bookingService.tsx` ✅
**Changes:**
- Complete rewrite to match Sprint 2 booking-service API
- Updated all endpoints to match microservice routes
- Added TypeScript interfaces for type safety
- Added JSDoc documentation for all methods
- Replaced old monolithic endpoints with new microservice endpoints

**New Methods:**
1. `estimateFare()` - POST /bookings/estimate-fare
2. `findNearbyDrivers()` - GET /bookings/nearby-drivers
3. `createBooking()` - POST /bookings
4. `getUserBookings()` - GET /bookings/my-bookings
5. `getDriverBookings()` - GET /bookings/driver/my-bookings
6. `getPendingBookings()` - GET /bookings/pending
7. `getBookingById()` - GET /bookings/:bookingId
8. `acceptBooking()` - POST /bookings/:bookingId/accept
9. `rejectBooking()` - POST /bookings/:bookingId/reject
10. `generateOtp()` - POST /bookings/:bookingId/generate-otp
11. `verifyOtpAndComplete()` - POST /bookings/:bookingId/verify-otp
12. `rateBooking()` - POST /bookings/:bookingId/rate
13. `updateBookingStatus()` - PATCH /bookings/:bookingId/status
14. `createRideRequestStream()` - GET /ride-requests/stream (SSE)
15. `getPendingRideRequests()` - GET /ride-requests/pending

### 3. `/.env.example` ✅ NEW FILE
**Purpose:** Environment variable template for all microservices

**Required Variables:**
```env
VITE_AUTH_SERVICE_URL=http://localhost:3001
VITE_USER_SERVICE_URL=http://localhost:3002
VITE_DRIVER_SERVICE_URL=http://localhost:3003
VITE_BOOKING_SERVICE_URL=http://localhost:3004
```

---

## 🔧 Setup Instructions

### Step 1: Create .env File
```bash
cd Gokeral_Frontend
cp .env.example .env
```

### Step 2: Verify Backend Services Running
Ensure all microservices are running:
- ✅ Auth Service: `http://localhost:3001/health`
- ✅ User Service: `http://localhost:3002/health`
- ✅ Driver Service: `http://localhost:3003/health`
- ✅ Booking Service: `http://localhost:3004/health` (Sprint 2)

### Step 3: Install Frontend Dependencies (if needed)
```bash
npm install
```

### Step 4: Start Frontend Development Server
```bash
npm run dev
```

---

## 📚 API Usage Examples

### Example 1: Estimate Fare Before Booking
```typescript
import bookingService from '@/services/bookingService';

const fareEstimate = await bookingService.estimateFare({
  pickupLocation: {
    type: 'Point',
    coordinates: [77.5946, 12.9716], // [longitude, latitude]
    address: 'MG Road, Bangalore'
  },
  dropoffLocation: {
    type: 'Point',
    coordinates: [77.6412, 12.9141],
    address: 'Whitefield, Bangalore'
  },
  vehicleType: 'sedan'
});

console.log(`Estimated Fare: ₹${fareEstimate.totalFare}`);
console.log(`Distance: ${fareEstimate.distance} km`);
console.log(`Duration: ${fareEstimate.duration} minutes`);
```

### Example 2: Create a New Booking
```typescript
const booking = await bookingService.createBooking({
  pickupLocation: {
    type: 'Point',
    coordinates: [77.5946, 12.9716],
    address: 'MG Road, Bangalore'
  },
  dropoffLocation: {
    type: 'Point',
    coordinates: [77.6412, 12.9141],
    address: 'Whitefield, Bangalore'
  },
  vehicleType: 'sedan',
  pickupTime: new Date() // Optional: schedule for later
});

console.log(`Booking ID: ${booking._id}`);
console.log(`Status: ${booking.status}`); // 'PENDING'
```

### Example 3: Find Nearby Drivers
```typescript
const drivers = await bookingService.findNearbyDrivers(
  12.9716, // latitude
  77.5946, // longitude
  'sedan',
  5 // radius in km
);

console.log(`Found ${drivers.count} drivers nearby`);
drivers.drivers.forEach(driver => {
  console.log(`Driver: ${driver.name}, Distance: ${driver.distance}km`);
});
```

### Example 4: Driver Accepts Booking
```typescript
// In driver dashboard
const booking = await bookingService.acceptBooking(bookingId);
console.log(`Accepted booking: ${booking._id}`);
console.log(`Pickup: ${booking.pickupLocation.address}`);
console.log(`Dropoff: ${booking.dropoffLocation.address}`);
```

### Example 5: OTP Verification Flow
```typescript
// User generates OTP after driver arrives
const otpResponse = await bookingService.generateOtp(bookingId);
console.log('OTP sent to user email');

// Driver enters OTP to start ride
const verifiedBooking = await bookingService.verifyOtpAndComplete(bookingId, {
  otp: '1234' // User provides this to driver
});
console.log(`Ride started: ${verifiedBooking.status}`); // 'IN_PROGRESS'
```

### Example 6: Real-Time Ride Requests (SSE)
```typescript
// In driver dashboard - listen for new ride requests
const eventSource = bookingService.createRideRequestStream();

eventSource.onmessage = (event) => {
  const rideRequest = JSON.parse(event.data);
  console.log('New ride request:', rideRequest);
  
  // Show notification to driver
  showNotification({
    title: 'New Ride Request',
    message: `Pickup: ${rideRequest.booking.pickupLocation.address}`,
    action: () => showBookingDetails(rideRequest.booking._id)
  });
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
};

// Clean up when component unmounts
useEffect(() => {
  return () => eventSource.close();
}, []);
```

### Example 7: Rate Completed Ride
```typescript
// After ride completion, user rates the driver
await bookingService.rateBooking(bookingId, {
  rating: 5,
  review: 'Great driver, smooth ride!'
});

console.log('Rating submitted successfully');
```

---

## 🔐 Authentication Flow

All booking endpoints require JWT authentication. The token is automatically included in requests via axios interceptors.

**Login Flow:**
```typescript
// 1. User logs in via auth-service
const { token, user } = await authService.login(email, password);

// 2. Token is stored and set globally
localStorage.setItem('token', token);
setAuthToken(token); // This configures all API instances including bookingApi

// 3. All subsequent booking requests include the token
const bookings = await bookingService.getUserBookings(); // Token sent automatically
```

---

## 🗺️ Location Data Format

All location data uses GeoJSON Point format:

```typescript
interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] - ORDER MATTERS!
  address?: string; // Optional human-readable address
}

// ⚠️ IMPORTANT: GeoJSON uses [longitude, latitude] order, NOT [lat, lng]
const correctFormat: Location = {
  type: 'Point',
  coordinates: [77.5946, 12.9716], // [lng, lat] ✅
  address: 'MG Road, Bangalore'
};

// ❌ WRONG - This will cause issues
const wrongFormat = {
  type: 'Point',
  coordinates: [12.9716, 77.5946], // [lat, lng] - Incorrect!
};
```

**Converting Google Maps to GeoJSON:**
```typescript
// Google Maps LatLng object
const googleMapsLatLng = { lat: 12.9716, lng: 77.5946 };

// Convert to GeoJSON format
const geoJsonLocation: Location = {
  type: 'Point',
  coordinates: [googleMapsLatLng.lng, googleMapsLatLng.lat], // Swap order!
  address: 'MG Road, Bangalore'
};
```

---

## 🚗 Vehicle Types

Supported vehicle types (must match exactly):
- `motorcycle` - Two-wheeler (cheapest)
- `auto` - Auto-rickshaw
- `sedan` - 4-seater car
- `suv` - 6-7 seater car (most expensive)

**Example:**
```typescript
const fareConfig = {
  vehicleType: 'sedan', // Must be lowercase, exact match
};
```

---

## 📊 Booking Status Flow

Understanding the booking lifecycle:

```
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
   ↓         ↓
CANCELLED  REJECTED (by driver)
```

**Status Transitions:**
1. **PENDING** - User creates booking, waiting for driver
2. **ACCEPTED** - Driver accepts booking
3. **IN_PROGRESS** - OTP verified, ride started
4. **COMPLETED** - OTP verified at destination, ride finished
5. **CANCELLED** - User/admin cancels booking
6. **REJECTED** - Driver rejects booking (booking stays PENDING for other drivers)

**Status-Specific Actions:**
```typescript
// Check current status before actions
if (booking.status === 'PENDING') {
  // User can cancel, driver can accept/reject
}

if (booking.status === 'ACCEPTED') {
  // User generates OTP, driver arrives at pickup
}

if (booking.status === 'IN_PROGRESS') {
  // Ride is ongoing, tracking active
}

if (booking.status === 'COMPLETED') {
  // User can rate the ride
}
```

---

## 🔔 Real-Time Features

### Server-Sent Events (SSE)

The booking service provides real-time updates via SSE for drivers to receive instant ride request notifications.

**Implementation:**
```typescript
import { useEffect, useState } from 'react';
import bookingService from '@/services/bookingService';

function DriverDashboard() {
  const [rideRequests, setRideRequests] = useState([]);

  useEffect(() => {
    // Create SSE connection
    const eventSource = bookingService.createRideRequestStream();

    // Handle new ride requests
    eventSource.onmessage = (event) => {
      const rideRequest = JSON.parse(event.data);
      
      // Add to state
      setRideRequests(prev => [rideRequest, ...prev]);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Ride Request', {
          body: `Pickup: ${rideRequest.booking.pickupLocation.address}`,
          icon: '/driver-icon.png'
        });
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      
      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <h2>Ride Requests</h2>
      {rideRequests.map(req => (
        <RideRequestCard key={req._id} request={req} />
      ))}
    </div>
  );
}
```

**Browser Notification Permission:**
```typescript
// Request permission on component mount
useEffect(() => {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}, []);
```

---

## ⚠️ Error Handling

All error responses follow a consistent format:

```typescript
try {
  const booking = await bookingService.createBooking(bookingData);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    console.error('Validation failed:', error.response.data.message);
    showToast(error.response.data.message, 'error');
  } else if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    console.error('Not authenticated');
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Forbidden - wrong role
    console.error('Access denied:', error.response.data.message);
  } else if (error.response?.status === 404) {
    // Not found
    console.error('Booking not found');
  } else {
    // Server error
    console.error('Server error:', error.message);
  }
}
```

**Common Error Codes:**
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (wrong user role)
- `404` - Not Found (booking doesn't exist)
- `500` - Internal Server Error

---

## 🧪 Testing the Integration

### Manual Testing Checklist

#### User Flow Tests
- [ ] User can estimate fare before login (should fail with 401 - expected)
- [ ] User can estimate fare after login ✅
- [ ] User can see nearby drivers ✅
- [ ] User can create a booking ✅
- [ ] User can view their booking history ✅
- [ ] User can view specific booking details ✅
- [ ] User can generate OTP for pickup ✅
- [ ] User can rate completed ride ✅

#### Driver Flow Tests
- [ ] Driver can view pending bookings ✅
- [ ] Driver receives real-time ride requests (SSE) ✅
- [ ] Driver can accept a booking ✅
- [ ] Driver can reject a booking ✅
- [ ] Driver can view their booking history ✅
- [ ] Driver can verify OTP to start ride ✅

### API Testing via Browser Console
```javascript
// Open browser console (F12) after logging in

// Test 1: Get user bookings
bookingService.getUserBookings()
  .then(data => console.log('Bookings:', data))
  .catch(err => console.error('Error:', err));

// Test 2: Estimate fare
bookingService.estimateFare({
  pickupLocation: {
    type: 'Point',
    coordinates: [77.5946, 12.9716],
    address: 'MG Road'
  },
  dropoffLocation: {
    type: 'Point',
    coordinates: [77.6412, 12.9141],
    address: 'Whitefield'
  },
  vehicleType: 'sedan'
}).then(data => console.log('Fare:', data));
```

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to booking service"
**Cause:** Booking service not running  
**Fix:**
```bash
cd Kerides_Backend_V1/services/booking-service
npm run start:dev
```
**Verify:** Check http://localhost:3004/health

### Issue 2: "401 Unauthorized on all requests"
**Cause:** JWT token not set or expired  
**Fix:**
- Re-login to get fresh token
- Check if setAuthToken() was called after login
- Verify token in localStorage: `localStorage.getItem('token')`

### Issue 3: "SSE connection immediately closes"
**Cause:** Token not included in SSE request  
**Fix:** Check that createRideRequestStream() sends token in URL or headers

### Issue 4: "Location coordinates reversed (showing wrong location)"
**Cause:** Using [lat, lng] instead of [lng, lat]  
**Fix:** GeoJSON requires [longitude, latitude] order - swap coordinates

### Issue 5: "Vehicle type not found"
**Cause:** Invalid vehicle type string  
**Fix:** Use exact lowercase strings: `motorcycle`, `auto`, `sedan`, `suv`

---

## 📈 Performance Considerations

### Pagination for Large Lists
```typescript
// When fetching user bookings, consider pagination
const bookings = await bookingService.getUserBookings();

// TODO: Add pagination support in Sprint 3
// const bookings = await bookingService.getUserBookings({ page: 1, limit: 20 });
```

### Caching Fare Estimates
```typescript
// Cache fare estimates to avoid repeated API calls
const fareCache = new Map();

async function getCachedFareEstimate(pickup, dropoff, vehicleType) {
  const key = `${pickup.coordinates.join(',')}-${dropoff.coordinates.join(',')}-${vehicleType}`;
  
  if (fareCache.has(key)) {
    return fareCache.get(key);
  }
  
  const estimate = await bookingService.estimateFare({ pickup, dropoff, vehicleType });
  fareCache.set(key, estimate);
  
  return estimate;
}
```

### Debouncing Map Movements
```typescript
import { debounce } from 'lodash';

// Debounce nearby driver searches when map moves
const searchNearbyDrivers = debounce(async (lat, lng, vehicleType) => {
  const drivers = await bookingService.findNearbyDrivers(lat, lng, vehicleType);
  updateDriverMarkers(drivers);
}, 500); // Wait 500ms after user stops moving map
```

---

## 🔮 Future Enhancements (Sprint 3+)

Features planned for upcoming sprints:

### Sprint 3: Payment Integration
```typescript
// Coming soon
await paymentService.processBookingPayment(bookingId, {
  method: 'upi',
  upiId: 'user@bank'
});
```

### Sprint 3: Real-Time Tracking
```typescript
// Coming soon
trackingService.subscribeToRide(bookingId, (location) => {
  updateDriverMarkerOnMap(location.coordinates);
});
```

### Sprint 4: Multi-Language Support
```typescript
// Coming soon
const fareEstimate = await bookingService.estimateFare(data, {
  language: 'hi' // Hindi, Kannada, Tamil, etc.
});
```

---

## 📞 Support & Documentation

### Swagger API Documentation
- **Booking Service:** http://localhost:3004/api/docs
- Interactive API testing with authentication support

### Health Endpoints
- Auth: http://localhost:3001/health
- User: http://localhost:3002/health
- Driver: http://localhost:3003/health
- Booking: http://localhost:3004/health

### Code References
- Backend: `Kerides_Backend_V1/services/booking-service/`
- Frontend: `Gokeral_Frontend/src/services/bookingService.tsx`
- API Config: `Gokeral_Frontend/src/services/api.tsx`

---

## ✅ Integration Checklist

Sprint 2 frontend integration is complete when:

- [x] bookingApi axios instance created
- [x] setAuthToken updated to include bookingApi
- [x] Interceptors applied to bookingApi
- [x] bookingService.tsx rewritten with all 15 methods
- [x] TypeScript interfaces defined
- [x] .env.example created with VITE_BOOKING_SERVICE_URL
- [x] JSDoc documentation added to all methods
- [x] SSE implementation for real-time ride requests
- [x] Location format validation (GeoJSON)
- [x] Error handling patterns documented
- [x] Testing guide created
- [x] Troubleshooting section added

**Status: ✅ ALL TASKS COMPLETE**

---

**Document Version:** 1.0  
**Last Updated:** February 20, 2026  
**Author:** Senior Full-Stack Developer  
**Next Steps:** Test integration with real booking flows, prepare for Sprint 3 (Payment Service)
