import { useState, useEffect } from 'react';
import AmbientPlayer from './components/AmbientPlayer';
import LoadingScreen from './components/ui/LoadingScreen';

function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  // Handle initialization complete
  const handleInitialized = () => {
    // Start fade out of loading screen
    setShowLoading(false);
    // After loading screen fades out, show player
    setTimeout(() => {
      setShowPlayer(true);
    }, 1000); // Match PHRASE_FADE_DURATION
  };

  return (
    <div className="min-h-screen bg-black relative">
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          showLoading ? 'opacity-100 z-50' : 'opacity-0 z-0'
        }`}
      >
        <LoadingScreen />
      </div>
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          showPlayer ? 'opacity-100 z-40' : 'opacity-0 z-0'
        }`}
      >
        <AmbientPlayer onInitialized={handleInitialized} />
      </div>
    </div>
  );
}

export default App;
