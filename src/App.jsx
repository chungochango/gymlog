import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import History from './pages/History'
import Nutrition from './pages/Nutrition'
import WatchGuide from './pages/WatchGuide'
import StartWorkout from './pages/StartWorkout'
import Workout from './pages/Workout'
import WorkoutDetail from './pages/WorkoutDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="start" element={<StartWorkout />} />
        <Route path="workout" element={<Workout />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="watch" element={<WatchGuide />} />
        <Route path="history" element={<History />} />
        <Route path="history/:id" element={<WorkoutDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
