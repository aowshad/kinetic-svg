import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Gallery from './pages/Gallery'
import Detail from './pages/Detail'
import TopBar from './components/TopBar'
import Footer from './components/Footer'
import { useTheme } from './lib/useTheme'

function App() {
  const { mode, setMode } = useTheme()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <TopBar theme={mode} onThemeChange={setMode} />
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/a/:id" element={<Detail />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
