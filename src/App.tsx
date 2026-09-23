import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Gallery from './pages/Gallery'
import Detail from './pages/Detail'
import { useTheme } from './lib/useTheme'

function App() {
  const { mode, setMode } = useTheme()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Gallery theme={mode} onThemeToggle={setMode} />} />
        <Route path="/a/:id" element={<Detail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
