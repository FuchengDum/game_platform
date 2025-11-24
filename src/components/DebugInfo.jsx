import { useEffect, useState } from 'react';
import { getAllGames } from '../utils/gameRegistry';

function DebugInfo() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const allGames = getAllGames();
      console.log('Loaded games:', allGames);
      setGames(allGames);
    } catch (err) {
      console.error('Error loading games:', err);
      setError(err.message);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md">
      <h3 className="font-bold mb-2">🐛 Debug Info</h3>
      {error ? (
        <div className="text-red-400">Error: {error}</div>
      ) : (
        <div>
          <p>Games loaded: {games.length}</p>
          <ul className="mt-2 space-y-1">
            {games.map(game => (
              <li key={game.id} className="text-green-400">
                ✓ {game.name} ({game.id})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DebugInfo;
