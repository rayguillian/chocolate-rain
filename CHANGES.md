# Changes

## 2024-01-09
- Fixed shuffle functionality by aligning data-controller attributes with storage folder names
  - Changed brown noise data-controller from "brown-noise" to "brown-noise-stream" to match Firebase storage folder name
  - This ensures consistency between storage paths and DOM element identifiers
  - Previous fix was incomplete as it didn't account for the storage folder structure

- Fixed UI display issue where both controllers showed "Rain" as the title
  - Updated title display logic in AudioTrackController to check for "brown-noise-stream"
  - Now correctly displays "Brown Noise" and "Rain" for the respective controllers

- Fixed shuffle behavior for paused tracks
  - Modified shuffle logic to maintain paused state during shuffle
  - Tracks now remain paused when shuffling instead of auto-playing

- Fixed playback interruption during storage changes
  - Corrected track change detection logic to properly compare with previous tracks
  - Optimized audio cache updates to maintain playback state during track updates

- Enhanced track selection from storage
  - Added random selection of tracks from Firebase storage folders
  - Previously was always selecting the first 2 tracks in alphabetical order
  - Now randomly selects tracks for better variety in playback
