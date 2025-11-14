import './App.css'
import Home from '@pages/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '@pages/Auth/LoginPage'
import ProtectedRoute from './components/ProtectedRoute';
import Leads from "@pages/LeadManagement/Leads/Leads"
import NotFound from '@pages/NotFound';
import LeadDetail from '@pages/LeadManagement/Leads/LeadDetail';
import MvLogs from "./pages/LeadManagement/mvLogs/mvLogs";
import MvLogsDetail from "./pages/LeadManagement/mvLogs/mvLogsDetail";
import DefaultLayout from './layouts/DefaultLayout';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
          <Route element={<DefaultLayout />}>
            <Route index element={<Home />} />   
            <Route path="logs" element={<Leads />} />
            <Route path="mv-ivr-logs" element={<MvLogs />} />
            <Route path="mv-ivr-logs/:id" element={<MvLogsDetail />} />
            <Route path="lead-detail/:id" element={<LeadDetail />} />
          <Route path="*" element={<NotFound />} />
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
