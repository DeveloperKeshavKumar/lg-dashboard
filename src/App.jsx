import { Routes, Route } from 'react-router-dom';
import Header from './components/UI/Header';
import Footer from './components/UI/Footer';
import Homepage from './pages/Homepage';
import Region from './pages/Region';
import Branch from './pages/Branch';
import './App.css'

function App() {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/region/:regionId" element={<Region />} />
            <Route path="/branch/:branchId" element={<Branch />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;