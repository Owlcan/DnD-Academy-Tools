import React, { useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

const SONGS = [
  { name: "Stand Ready for My Arrival, Fools", url: "/music/Stand Ready for My Arrival, Fools.mp3" },
  { name: "Stand Up or Stand Down", url: "/music/Stand Up or Stand Down.mp3" },
  { name: "The Struggle Never Ends", url: "/music/The Struggle Never Ends.mp3" },
  { name: "Unsettling Confrontation", url: "/music/Unsettling Confrontation.mp3" },
  { name: "Face Your Foes; Face Your Fears", url: "/music/Face Your Foes; Face Your Fears.mp3" },
  { name: "I Can Win!", url: "/music/I Can Win!.mp3" },
  { name: "Sound! The War Horn Blares", url: "/music/Sound! The War Horn Blares.mp3" }
];

const MusicPlayer = () => {
  const [currentSong, setCurrentSong] = useState(null);
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '250px',
      right: '10px',
      width: '300px',
      background: 'rgba(0,0,0,0.95)', // Darker background
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid #b8860b', // Thicker gold border
      boxShadow: '0 0 15px rgba(184, 134, 11, 0.3)', // Gold glow
      zIndex: 1000,
      fontFamily: "'Cinzel', serif"
    }}>
      <select 
        value={currentSong?.url || ''}
        onChange={(e) => setCurrentSong(SONGS.find(song => song.url === e.target.value))}
        style={{
          width: '100%',
          marginBottom: '10px',
          background: '#333',
          color: 'gold',
          border: '1px solid #b8860b',
          padding: '8px',
          borderRadius: '4px',
          fontFamily: "'Cinzel', serif"
        }}
      >
        <option value="">Select a Track</option>
        {SONGS.map((song, index) => (
          <option key={index} value={song.url}>
            {song.name}
          </option>
        ))}
      </select>

      <AudioPlayer
        src={currentSong?.url}
        autoPlay={false}
        showSkipControls={false}
        showJumpControls={false}
        customStyles={{
          player: {
            backgroundColor: 'transparent',
          },
          progressBar: {
            backgroundColor: '#b8860b',
          },
          volumeBar: {
            backgroundColor: '#b8860b',
          },
          track: {
            backgroundColor: '#111', // Darker track
          },
          rail: {
            backgroundColor: '#333',
          },
          playButton: {
            color: 'gold',
            '&:hover': {
              color: '#ffd700'
            }
          },
          volumeButton: {
            color: 'gold',
          },
          currentTimeLabel: {
            color: 'gold',
          },
          durationLabel: {
            color: 'gold',
          }
        }}
        customIcons={{
          play: '▶',
          pause: '⏸',
          volume: '🔊',
          volumeMute: '🔇',
        }}
        style={{
          background: 'transparent',
          boxShadow: 'none',
          borderRadius: '4px',
          padding: '10px',
        }}
      />
      
      {currentSong && (
        <div style={{
          marginTop: '10px',
          color: 'gold',
          textAlign: 'center',
          fontSize: '14px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          Now Playing: {currentSong.name}
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
