import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import GameContainer from './components/GameContainer';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="game/:gameId" element={<GameContainer />} />
      </Route>
    </Routes>
  );
}

export default App;
