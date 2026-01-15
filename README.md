# 🚗 Gokeral - Frontend

A modern React + TypeScript + Vite frontend for the Gokeral ride-sharing platform. Supports both user and driver workflows with real-time ride notifications via SSE and REST API polling.

## ✨ Features

- 🔐 **User & Driver Authentication** - JWT-based login and registration
- 🗺️ **Google Maps Integration** - Real-time location tracking and route visualization
- 🚗 **Driver Profile Management** - Add vehicles, manage personal info, view bookings
- 👤 **User Profile Management** - Book rides, view ride history, rate drivers
- 📲 **Real-Time Notifications** - SSE (Server-Sent Events) for ride requests
- 📍 **Smart Driver Matching** - Find nearby drivers based on location
- 💰 **Fare Calculation** - Estimated and final fare display with INR formatting
- 🎯 **OTP Verification** - Secure ride start with 4-digit OTP
- 📊 **Ride History & Ratings** - Track completed rides and rate drivers
- 🎨 **Responsive UI** - Built with Ant Design and Tailwind CSS

---

## 🧰 Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| React Router | Client-side Routing |
| Ant Design | UI Components |
| Tailwind CSS | Styling |
| Axios | HTTP Client |
| Google Maps API | Location & Maps |
| Cloudinary | Image CDN |

---

## 🚀 Installation & Setup

### 1️⃣ Clone & Install

```sh
git clone https://github.com/sourabhoncode/Gokeral.git
cd Gokeral/Gokeral_Frontend
npm install
```

### 2️⃣ Configure Environment

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### 3️⃣ Start Development Server

```sh
npm run dev
```

Frontend running 👉 [http://localhost:5173](http://localhost:5173)

### 4️⃣ Build for Production

```sh
npm run build
npm run preview
```

---

## 📁 Folder Structure

```
src/
├── components/
│   ├── driver/
│   │   └── driverprofile/
│   │       ├── modal/
│   │       │   ├── RideRequestModal.tsx       # Ride request display
│   │       │   ├── driverAddVehicle.tsx       # Add vehicle modal
│   │       │   └── driverAddDetails.tsx       # Personal info modal
│   │       └── DriverProfile.tsx              # Main driver profile
│   ├── user/
│   │   ├── UserProfile.tsx                    # Main user profile
│   │   └── BookingCard.tsx                    # Booking display
│   ├── map/
│   │   ├── MapComponent.tsx                   # Map rendering
│   │   └── DriverMarkers.tsx                  # Driver location markers
│   ├── booking/
│   │   ├── BookingForm.tsx                    # Create booking
│   │   └── RideStatus.tsx                     # Ride tracking
│   ├── Header.tsx                             # Navigation
│   ├── Footer.tsx                             # Footer
│   └── UserHeader.tsx                         # User-specific header
│
├── hooks/
│   ├── useDriverRideListener.ts               # Driver: SSE ride requests
│   └── useCustomerRideListener.ts             # User: REST polling for ride status
│
├── pages/
│   ├── Home.tsx                               # Landing page
│   ├── UserLogin.tsx                          # User login
│   ├── UserRegistration.tsx                   # User signup
│   ├── UserProfilePage.tsx                    # User dashboard
│   ├── DriverLogin.tsx                        # Driver login
│   ├── DriverRegistration.tsx                 # Driver signup
│   ├── DriverProfilePage.tsx                  # Driver dashboard
│   ├── map/
│   │   └── Maps.tsx                           # Map view for finding drivers
│   ├── about/
│   │   └── TermsPrivacyPage.tsx               # Terms & Privacy
│   └── contact/
│       └── ContackPage.tsx                    # Contact form
│
├── services/
│   ├── api.tsx                                # Axios instance & base config
│   ├── authServices.tsx                       # Auth endpoints
│   ├── bookingService.tsx                     # Booking endpoints
│   └── vehicleService.tsx                     # Vehicle endpoints
│
├── utils/
│   ├── formatters.ts                          # Currency, date formatting
│   ├── validators.ts                          # Form validation
│   └── constants.ts                           # App constants
│
├── routes/
│   └── index.tsx                              # Router configuration
│
├── App.tsx                                    # Main app component
└── main.tsx                                   # Entry point
```

---

## 🔐 Authentication

### User Registration
```
POST /auth/register-user
```
**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "Password123"
}
```

### Driver Registration
```
POST /auth/register-driver
```
**Request:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "phoneNumber": "+1987654321",
  "driverLicenseNumber": "DL123456789",
  "password": "Password123"
}
```

Token is stored in `localStorage` as `token` and sent in all API requests via `Authorization: Bearer <token>`.

---

## 🚗 Driver Workflow

### 1. Register & Add Vehicle
- Driver registers with license number
- Adds vehicle details (type, model, registration, insurance)
- Personal info (address, bank details for payments)

### 2. Receive Ride Requests (Real-Time)
Uses `useDriverRideListener` hook with **SSE (Server-Sent Events)**:
```typescript
const { newRideRequest, acceptSuccess, error } = useDriverRideListener(driverId, true);
```

- Driver socket subscribes to `/api/drivers/subscribe-to-bookings`
- Backend emits `new_ride_request` events when user books
- Modal displays pickup location, fare, distance, customer phone
- Driver can **Accept** or **Reject** ride

### 3. Accept Ride
```
POST /bookings/:id/accept
```
- Updates booking status to `ACCEPTED`
- Sends driver details to customer
- Customer sees driver on map in real-time

### 4. Arrive at Pickup
```
PATCH /bookings/:id/arrived
```
- Marks driver as arrived
- Notifies customer
- Updates UI status

### 5. Verify OTP & Start Ride
```
POST /bookings/:id/verify-otp
```
- Customer shares 4-digit OTP with driver
- Reveals drop location to driver
- Starts ride tracking

### 6. Complete & Rate
- Driver marks ride complete
- User rates driver (1-5 stars)
- Ride history updated

---

## 👤 User Workflow

### 1. Register & Create Profile
- Register with email/phone
- Complete profile (address, preferences)
- Add payment methods

### 2. Book a Ride
```
POST /bookings/create
```
**Request:**
```json
{
  "pickupLocation": "123 Main St",
  "pickupLatitude": 40.7128,
  "pickupLongitude": -74.0060,
  "dropLocation": "456 Broadway",
  "dropLatitude": 40.7489,
  "dropLongitude": -73.9680,
  "vehicleType": "SEDAN"
}
```

### 3. Wait for Driver Acceptance
Uses `useCustomerRideListener` hook with **REST polling**:
```typescript
const { rideAccepted, rideStarted, driverLocation } = useCustomerRideListener(userId, rideId);
```
- Polls ride status every 3 seconds
- Displays driver details when accepted
- Shows driver location on map (real-time)

### 4. Verify OTP
- Driver arrives and shares OTP
- User verifies OTP to start ride
- Drop location revealed on map

### 5. Track Ride
- Real-time driver location updates
- ETA calculation
- Ride status display

### 6. Complete & Rate
- Mark ride complete
- Rate driver (1-5 stars)
- Add optional feedback
- Ride added to history

---

## 🔌 Real-Time Communication

### Driver: SSE (Server-Sent Events)
**Hook:** `useDriverRideListener`
**Endpoint:** `/api/drivers/subscribe-to-bookings`
**Benefits:** Push notifications, low latency, automatic reconnection

```typescript
sseEventSourceRef.current = new EventSource(`/api/drivers/subscribe-to-bookings`);
sseEventSourceRef.current.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'new_ride_request') {
    setNewRideRequest(data.booking);
  }
};
```

### User: REST Polling
**Hook:** `useCustomerRideListener`
**Endpoints:** `/api/rides/{rideId}/status`, `/api/rides/{rideId}/driver-location`
**Polling Interval:** 3s for status, 2s for location
**Benefits:** Simpler, works with all backends

```typescript
const pollRideStatus = useCallback(async () => {
  const response = await fetch(`/api/rides/${rideId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (data.status === 'ACCEPTED') {
    setRideAccepted(data);
  }
}, [rideId]);
```

---

## 📊 Key Components

### RideRequestModal
Displays new ride request to driver with:
- Pickup location
- Customer phone (clickable tel: link)
- Estimated fare (INR formatted)
- Distance
- Accept/Reject buttons

**Usage:**
```tsx
<RideRequestModal
  open={modalOpen}
  pickupLocation={ride?.pickupLocation}
  phoneNumber={ride?.phoneNumber}
  fare={ride?.fare}
  distance={ride?.distance}
  onAccept={handleAccept}
  onReject={handleReject}
  onCancel={() => setModalOpen(false)}
/>
```

### Maps Component
Shows:
- Current user location
- Available nearby drivers (markers)
- Selected driver route
- Real-time driver movement
- Pickup & drop points

---

## 🧪 Testing

### 1. User Booking Flow
1. Register user account
2. Go to Map page
3. Select pickup & drop location
4. Create booking
5. Watch for driver acceptance (via driver)
6. Verify ride details on map

### 2. Driver Acceptance Flow
1. Register driver & add vehicle
2. Go to driver profile
3. Open browser console (check for SSE connection)
4. Have user create booking
5. Verify `new_ride_request` event received
6. Test Accept/Reject buttons
7. Check booking status updates

### 3. Real-Time Location Tracking
1. Accept a ride as driver
2. Verify driver marker moves on user's map
3. Check polling interval (2s) in Network tab
4. Test location updates persist across page refresh

---

## 🐛 Debugging

### Console Logs
Driver SSE listener logs:
- `✅ Connected to real-time ride notifications`
- `📬 Received SSE notification: {data}`

### Network Tab
Check:
- **SSE Connection:** `EventSource` requests to `/subscribe-to-bookings`
- **Polling:** Regular `fetch` to `/rides/{id}/status` and `/driver-location`
- **Token:** `Authorization: Bearer <token>` in headers

### Local Storage
- `token` — JWT token (persist across sessions)
- Clear with `localStorage.clear()` to logout

---

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIzaSy...` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `my-cloud` |

---

## 🚀 Deployment

### Build for Production
```sh
npm run build
```
Output: `dist/` folder

### Deploy to Vercel
```sh
npm install -g vercel
vercel
```

### Deploy to Netlify
```sh
npm run build
# Drag dist/ folder to Netlify
```

---

## 📚 Key Hooks

### `useDriverRideListener(driverId, enabled)`
- Subscribes to SSE ride notifications
- Auto-reconnects on disconnect
- Returns: `newRideRequest`, `acceptSuccess`, `error`, etc.

### `useCustomerRideListener(userId, rideId, enabled)`
- Polls ride status & driver location
- Cleanup on unmount
- Returns: `rideAccepted`, `rideStarted`, `driverLocation`, etc.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Commit: `git commit -m "Add new feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 👨‍💻 Developed by Corestone Innovations

For support and inquiries, contact the development team.

---

## 📝 Changelog

### January 15, 2026 (v2.2.0) - Driver-Specific Bookings
- ✅ Updated README with full frontend documentation
- ✅ Documented driver-specific booking flow with authorization
- 🔌 Added SSE real-time notifications for drivers
- 📍 Added REST polling for user ride status tracking
- 🎯 Improved RideRequestModal component documentation

### January 8, 2026 (v2.1.0) - OTP Implementation
- 🔢 OTP verification system for ride security
- 🎯 Privacy-first drop location (hidden until OTP verified)
- 📊 Enhanced booking tracking and status updates

### January 1, 2026 (v2.0.0) - Maps & Driver Matching
- 🗺️ Google Maps integration
- 📍 Smart driver matching (nearest 5)
- 🚗 Real-time driver location tracking

### December 2025 (v1.0.0) - Initial Release
- 🚀 User & Driver authentication
- 👤 Profile management
- 📅 Basic booking system

*Last Updated: January 15, 2026*
