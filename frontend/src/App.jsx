import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'

function App() {
  const { token } = useSelector((state) => state.auth)

  return (
    <Routes>
      <Route
        path="/login"
        element={!token ? <LoginPage /> : <Navigate to="/chat" />}
      />
      <Route
        path="/register"
        element={!token ? <RegisterPage /> : <Navigate to="/chat" />}
      />
      <Route
        path="/chat"
        element={token ? <ChatPage /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to={token ? "/chat" : "/login"} />} />
    </Routes>
  )
}

export default App
