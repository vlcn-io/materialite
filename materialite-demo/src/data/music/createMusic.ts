import { albums } from "./albums";
import { artists } from "./artists";
import { songs } from "./songs";
import { playlists } from "./playlists";

export function createMusic(
  totalTracks: number,
  totalAlbums: number,
  totalArtists: number,
  totalPlaylists: number
) {
  // const TOTAL_TRACKS = 10000;
  // const TOTAL_ALBUMS = 500; // Assuming an average of 20 tracks per album
  // const TOTAL_ARTISTS = 100;
  // const TOTAL_PLAYLISTS = 250; // Assuming an average of 40 tracks per playlist
  const TOTAL_TRACKS = totalTracks;
  const TOTAL_ALBUMS = totalAlbums;
  const TOTAL_ARTISTS = totalArtists;
  const TOTAL_PLAYLISTS = totalPlaylists;

  const tracks = [];
  const albums = [];
  const artists = [];
  const playlists = [];
  const playlistTracks = [];
  const trackArtists = [];

  for (let i = 1; i <= TOTAL_ARTISTS; i++) {
    artists.push({
      id: i,
      name: makeArtistName(),
    });
  }

  for (let i = 1; i <= TOTAL_ALBUMS; i++) {
    albums.push({
      id: i,
      title: makeAlbumName(),
      cover_art_url: `http://example.com/album${i}.jpg`,
      released: 1609459200 + i * 86400, // A day apart for each release
    });
  }

  for (let i = 1; i <= TOTAL_PLAYLISTS; i++) {
    playlists.push({
      id: i,
      name: makePlaylistName(),
    });
  }

  for (let i = 1; i <= TOTAL_TRACKS; i++) {
    const albumId = 1 + Math.floor(Math.random() * TOTAL_ALBUMS);
    const artistId = 1 + Math.floor(Math.random() * TOTAL_ARTISTS);

    tracks.push({
      id: i,
      title: makeTrackName(),
      duration: 200 + Math.floor(Math.random() * 300),
      album_id: albumId,
    });

    trackArtists.push({
      track_id: i,
      artist_id: artistId,
    });

    const playlistId = 1 + Math.floor(Math.random() * TOTAL_PLAYLISTS);
    playlistTracks.push({
      playlist_id: playlistId,
      track_id: i,
    });
  }

  return {
    tracks,
    albums,
    artists,
    playlists,
    playlistTracks,
    trackArtists,
  };
}

function makeAlbumName() {
  makeName(albums[0], albums[1]);
}

function makeArtistName() {
  makeName(artists[0], artists[1]);
}

function makeTrackName() {
  makeName(songs[0], songs[1]);
}

function makePlaylistName() {
  makeName(playlists[0], playlists[1]);
}

function makeName(arr1: string[], arr2: string[]) {
  const idx1 = Math.floor(Math.random() * arr1.length);
  const idx2 = Math.floor(Math.random() * arr2.length);
  if (Math.random() < 0.5) {
    return `${arr2[idx1]} ${arr1[idx2]}`;
  } else {
    return `${arr1[idx2]} ${arr2[idx1]}`;
  }
}
