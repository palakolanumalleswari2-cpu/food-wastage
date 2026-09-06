/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ScreenId } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AiChatDrawer } from './components/AiChatDrawer';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { DemandPredictionScreen } from './components/screens/DemandPredictionScreen';
import { WhatIfSimulatorScreen } from './components/screens/WhatIfSimulatorScreen';
import { EventAwareScreen } from './components/screens/EventAwareScreen';
import { WasteScannerScreen } from './components/screens/WasteScannerScreen';
import { DishWasteAnalysisScreen } from './components/screens/DishWasteAnalysisScreen';
import { SurplusMatchingScreen } from './components/screens/SurplusMatchingScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { AccuracyTrackerScreen } from './components/screens/AccuracyTrackerScreen';
import { ImpactCalculatorScreen } from './components/screens/ImpactCalculatorScreen';
import { AppStore, MealLog, SurplusEntry, CampusEvent } from './types';

// Fallback seed in case of offline/initial boot
const INITIAL_FALLBACK_STORE: AppStore = {
  mealLogs: [
    {
      date: '2026-08-30',
      dayOfWeek: 'Sunday',
      expectedAttendance: 450,
      predictedDemand: 410,
      prepared: 430,
      consumed: 415,
      surplus: 15,
      predictionErrorPct: 1.2,
      actualEntered: true,
      weather: 'Clear / Pleasant',
      dishes: [
        { name: 'Steamed Rice', prepared: 120, consumed: 115, surplus: 5 },
        { name: 'Dal Tadka', prepared: 110, consumed: 105, surplus: 5 },
        { name: 'Chapati / Roti', prepared: 100, consumed: 97, surplus: 3 },
        { name: 'Mix Veg Curry', prepared: 100, consumed: 98, surplus: 2 },
      ],
    },
    {
      date: '2026-08-31',
      dayOfWeek: 'Monday',
      expectedAttendance: 580,
      predictedDemand: 540,
      prepared: 560,
      consumed: 535,
      surplus: 25,
      predictionErrorPct: 0.9,
      actualEntered: true,
      weather: 'Clear / Pleasant',
      dishes: [
        { name: 'Steamed Rice', prepared: 150, consumed: 142, surplus: 8 },
        { name: 'Sambar', prepared: 140, consumed: 132, surplus: 8 },
        { name: 'Chapati / Roti', prepared: 140, consumed: 135, surplus: 5 },
        { name: 'Aloo Gobi', prepared: 130, consumed: 126, surplus: 4 },
      ],
    },
    {
      date: '2026-09-01',
      dayOfWeek: 'Tuesday',
      expectedAttendance: 570,
      predictedDemand: 530,
      prepared: 550,
      consumed: 520,
      surplus: 30,
      predictionErrorPct: 1.9,
      actualEntered: true,
      weather: 'Rainy / Stormy',
      dishes: [
        { name: 'Jeera Rice', prepared: 150, consumed: 140, surplus: 10 },
        { name: 'Dal Makhani', prepared: 140, consumed: 132, surplus: 8 },
        { name: 'Chapati / Roti', prepared: 130, consumed: 122, surplus: 8 },
        { name: 'Bhindi Masala', prepared: 130, consumed: 126, surplus: 4 },
      ],
    },
    {
      date: '2026-09-02',
      dayOfWeek: 'Wednesday',
      expectedAttendance: 560,
      predictedDemand: 525,
      prepared: 545,
      consumed: 522,
      surplus: 23,
      predictionErrorPct: 0.6,
      actualEntered: true,
      weather: 'Clear / Pleasant',
      dishes: [
        { name: 'Steamed Rice', prepared: 145, consumed: 140, surplus: 5 },
        { name: 'Rajma Curry', prepared: 140, consumed: 132, surplus: 8 },
        { name: 'Chapati / Roti', prepared: 130, consumed: 124, surplus: 6 },
        { name: 'Vegetable Curry', prepared: 130, consumed: 126, surplus: 4 },
      ],
    },
    {
      date: '2026-09-03',
      dayOfWeek: 'Thursday',
      expectedAttendance: 550,
      predictedDemand: 515,
      prepared: 535,
      consumed: 508,
      surplus: 27,
      predictionErrorPct: 1.4,
      actualEntered: true,
      weather: 'Sunny / Hot',
      dishes: [
        { name: 'Lemon Rice', prepared: 140, consumed: 132, surplus: 8 },
        { name: 'Dal Tadka', prepared: 135, consumed: 125, surplus: 10 },
        { name: 'Chapati / Roti', prepared: 130, consumed: 125, surplus: 5 },
        { name: 'Paneer Butter Masala', prepared: 130, consumed: 126, surplus: 4 },
      ],
    },
    {
      date: '2026-09-04',
      dayOfWeek: 'Friday',
      expectedAttendance: 520,
      predictedDemand: 480,
      prepared: 505,
      consumed: 475,
      surplus: 30,
      predictionErrorPct: 1.1,
      actualEntered: true,
      weather: 'Clear / Pleasant',
      dishes: [
        { name: 'Steamed Rice', prepared: 135, consumed: 125, surplus: 10 },
        { name: 'Chole', prepared: 130, consumed: 122, surplus: 8 },
        { name: 'Poori / Bhature', prepared: 125, consumed: 117, surplus: 8 },
        { name: 'Mixed Veg Curry', prepared: 115, consumed: 111, surplus: 4 },
      ],
    },
    {
      date: '2026-09-05',
      dayOfWeek: 'Saturday',
      expectedAttendance: 490,
      predictedDemand: 450,
      prepared: 470,
      consumed: 446,
      surplus: 24,
      predictionErrorPct: 0.9,
      actualEntered: true,
      weather: 'Clear / Pleasant',
      dishes: [
        { name: 'Vegetable Pulao', prepared: 125, consumed: 118, surplus: 7 },
        { name: 'Kadhi Pakora', prepared: 120, consumed: 112, surplus: 8 },
        { name: 'Chapati / Roti', prepared: 115, consumed: 110, surplus: 5 },
        { name: 'Aloo Jeera', prepared: 110, consumed: 106, surplus: 4 },
      ],
    },
  ],
  recipientOrgs: [
    {
      id: 'org-1',
      name: 'Asha Jyothi Community Kitchen',
      category: 'Community Kitchen',
      distanceKm: 1.8,
      lat: 17.442,
      lon: 78.349,
      foodTypesAccepted: ['Cooked meals', 'Rice & Dal', 'Chapatis', 'Curries'],
      typicalCapacityMeals: 120,
      phone: '+91 98490 22341',
      address: 'Old Police Station Road, Ward 4',
    },
    {
      id: 'org-2',
      name: 'Sneha Nilayam Children’s Shelter',
      category: 'Orphanage / Children Home',
      distanceKm: 3.2,
      lat: 17.438,
      lon: 78.362,
      foodTypesAccepted: ['Cooked meals', 'Fruits', 'Breads & Snacks', 'Milk/Desserts'],
      typicalCapacityMeals: 50,
      phone: '+91 94401 88723',
      address: 'Plot 42, Anand Nagar, Sector 3',
    },
    {
      id: 'org-3',
      name: 'Grace Elder Care Home',
      category: 'Elderly Shelter',
      distanceKm: 4.1,
      lat: 17.451,
      lon: 78.331,
      foodTypesAccepted: ['Mild spiced cooked meals', 'Rice', 'Lentils', 'Boiled vegetables'],
      typicalCapacityMeals: 40,
      phone: '+91 98852 33410',
      address: 'Green Avenue, Near Sub-Post Office',
    },
    {
      id: 'org-4',
      name: 'Robin Hood Army Campus Chapter',
      category: 'Volunteer Food Rescue Squad',
      distanceKm: 1.2,
      lat: 17.446,
      lon: 78.352,
      foodTypesAccepted: ['All edible fresh cafeteria food', 'Bulk hotel pans', 'Rotis'],
      typicalCapacityMeals: 200,
      phone: '+91 91210 55432',
      address: 'University Gate 2 Volunteer Hub',
    },
  ],
  surplusEntries: [
    {
      id: 'surplus-1',
      foodType: 'Cooked Basmati Rice & Dal Makhani',
      quantityMeals: 35,
      reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      status: 'available',
      verifiedSafeByStaff: true,
      notes: 'Untouched hotel pan, maintained at 65°C.',
    },
    {
      id: 'surplus-2',
      foodType: 'Fresh Whole Wheat Chapatis',
      quantityMeals: 50,
      reportedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      status: 'available',
      verifiedSafeByStaff: true,
      notes: 'Warm in insulated chafing box with parchment.',
    },
    {
      id: 'surplus-3',
      foodType: 'Mix Vegetable Pulao & Raita',
      quantityMeals: 28,
      reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      status: 'claimed',
      claimedByOrg: 'Asha Jyothi Community Kitchen',
      claimedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      verifiedSafeByStaff: true,
      notes: 'Dispatched via volunteer insulated van.',
    },
  ],
  events: [
    {
      id: 'evt-1',
      name: 'Annual Alumni Reunion & Leadership Summit',
      date: '2026-09-12',
      expectedAttendance: 450,
      description: 'Major weekend campus gathering with external visiting alumni and faculty.',
    },
    {
      id: 'evt-2',
      name: 'Inter-College Sports Meet - Day 1',
      date: '2026-09-18',
      expectedAttendance: 320,
      description: 'Athletes and coaching staff from 14 colleges requiring high-protein buffet.',
    },
    {
      id: 'evt-3',
      name: 'National Tech Symposium & Hackathon',
      date: '2026-09-24',
      expectedAttendance: 500,
      description: '36-hour hackathon with overnight attendees and rolling snack/dinner service.',
    },
  ],
  departments: [
    {
      id: 'dept-1',
      name: 'Central Dining Hall (Main Mess)',
      baselineWasteMeals: 110,
      recentWasteMeals: 25,
      predictionAccuracy: 98.4,
      surplusRescuedMeals: 430,
    },
    {
      id: 'dept-2',
      name: 'North Campus Hostel 4 Canteen',
      baselineWasteMeals: 75,
      recentWasteMeals: 18,
      predictionAccuracy: 97.1,
      surplusRescuedMeals: 280,
    },
    {
      id: 'dept-3',
      name: 'Faculty & Executive Dining Club',
      baselineWasteMeals: 40,
      recentWasteMeals: 12,
      predictionAccuracy: 95.8,
      surplusRescuedMeals: 140,
    },
    {
      id: 'dept-4',
      name: 'PG Girls Hostel Canteen',
      baselineWasteMeals: 60,
      recentWasteMeals: 22,
      predictionAccuracy: 94.2,
      surplusRescuedMeals: 195,
    },
  ],
};

export default function App() {
  const [store, setStore] = useState<AppStore>(INITIAL_FALLBACK_STORE);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [chatOpen, setChatOpen] = useState<boolean>(false);

  // Fetch store on mount
  useEffect(() => {
    fetch('/api/store')
      .then((res) => {
        if (!res.ok) throw new Error('Store endpoint returned ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (data && data.mealLogs) {
          setStore(data);
        }
      })
      .catch((err) => {
        console.warn('Using initial fallback dataset:', err.message);
      });
  }, []);

  // Save new prediction into meal logs
  const handleSavePrediction = async (newLog: Partial<MealLog>) => {
    try {
      const res = await fetch('/api/meal-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
      const data = await res.json();
      if (data.store) {
        setStore(data.store);
      }
    } catch (err) {
      console.error('Failed to persist meal log:', err);
    }
  };

  // Update actual consumption for an existing date
  const handleUpdateActual = async (date: string, actualConsumed: number) => {
    try {
      const res = await fetch('/api/meal-logs/actual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, actualConsumed }),
      });
      const data = await res.json();
      if (data.store) {
        setStore(data.store);
      }
    } catch (err) {
      console.error('Failed to update actual consumption:', err);
    }
  };

  // Add new surplus entry
  const handleAddSurplus = async (entry: Partial<SurplusEntry>) => {
    try {
      const res = await fetch('/api/surplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      if (data.store) {
        setStore(data.store);
      }
    } catch (err) {
      console.error('Failed to add surplus:', err);
    }
  };

  // Claim surplus entry
  const handleClaimSurplus = async (id: string, orgName: string) => {
    try {
      const res = await fetch(`/api/surplus/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName }),
      });
      const data = await res.json();
      if (data.store) {
        setStore(data.store);
      }
    } catch (err) {
      console.error('Failed to claim surplus:', err);
    }
  };

  // Add new campus event
  const handleAddEvent = async (event: CampusEvent) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (data.store) {
        setStore(data.store);
      }
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  const unclaimedSurplusCount = (store.surplusEntries || []).filter(
    (s) => s.status === 'available'
  ).length;

  const totalRescuedCumulative = (store.departments || []).reduce(
    (sum, d) => sum + (d.surplusRescuedMeals || 0),
    0
  );

  // Screen Title & Subtitle Mapping
  const screenMeta: Record<ScreenId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Operations Dashboard',
      subtitle: 'Real-time kitchen yields, surplus trends, and automated AI assistance',
    },
    prediction: {
      title: 'Daily Demand Prediction',
      subtitle: 'Neural attendance & consumption forecasting with safety buffer logic',
    },
    whatif: {
      title: 'What-If Attendance Simulator',
      subtitle: 'Dynamic batch scaling across simulated classroom swings',
    },
    events: {
      title: 'Event-Aware Preparation',
      subtitle: 'Institutional calendar integration for symposiums and tournaments',
    },
    scanner: {
      title: 'Kitchen Waste Scanner',
      subtitle: 'Multimodal vision inspection for tray surplus & container cleanliness',
    },
    dishes: {
      title: 'Dish-Level Waste Analysis',
      subtitle: 'Granular recipe audit with actionable culinary recommendations',
    },
    matching: {
      title: 'Surplus NGO Matching',
      subtitle: 'Transparent deterministic multi-criteria dispatch algorithm',
    },
    leaderboard: {
      title: 'Campus Rescue Leaderboard',
      subtitle: 'Competitive zero-waste standings across hostel mess divisions',
    },
    accuracy: {
      title: 'Prediction Accuracy Tracker',
      subtitle: 'Variance logging comparing AI projections against actual headcounts',
    },
    impact: {
      title: 'Environmental & Cost Impact',
      subtitle: 'Audited financial savings and carbon & freshwater life-cycle models',
    },
  };

  return (
    <div className="flex h-screen w-full bg-zinc-100/70 font-sans text-zinc-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        unclaimedSurplusCount={unclaimedSurplusCount}
        openChat={() => setChatOpen(true)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          activeScreenTitle={screenMeta[currentScreen].title}
          activeScreenSubtitle={screenMeta[currentScreen].subtitle}
          onOpenChat={() => setChatOpen(!chatOpen)}
          chatOpen={chatOpen}
          unclaimedSurplusCount={unclaimedSurplusCount}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentScreen === 'dashboard' && (
            <DashboardScreen store={store} onNavigate={setCurrentScreen} />
          )}
          {currentScreen === 'prediction' && (
            <DemandPredictionScreen
              onSavePrediction={handleSavePrediction}
              recentLogs={store.mealLogs}
            />
          )}
          {currentScreen === 'whatif' && <WhatIfSimulatorScreen />}
          {currentScreen === 'events' && (
            <EventAwareScreen events={store.events} onAddEvent={handleAddEvent} />
          )}
          {currentScreen === 'scanner' && (
            <WasteScannerScreen
              onLogAsSurplus={handleAddSurplus}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === 'dishes' && (
            <DishWasteAnalysisScreen mealLogs={store.mealLogs} />
          )}
          {currentScreen === 'matching' && (
            <SurplusMatchingScreen
              surplusEntries={store.surplusEntries}
              recipientOrgs={store.recipientOrgs}
              onAddSurplus={handleAddSurplus}
              onClaimSurplus={handleClaimSurplus}
            />
          )}
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen departments={store.departments} />
          )}
          {currentScreen === 'accuracy' && (
            <AccuracyTrackerScreen
              mealLogs={store.mealLogs}
              onUpdateActualConsumption={handleUpdateActual}
            />
          )}
          {currentScreen === 'impact' && (
            <ImpactCalculatorScreen totalRescuedMeals={totalRescuedCumulative} />
          )}
        </main>

        <Footer />
      </div>

      {/* Slide-in AI Assistant Drawer */}
      <AiChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
