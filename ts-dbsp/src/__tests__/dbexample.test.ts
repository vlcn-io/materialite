import { test } from "vitest";
import { GraphBuilder } from "../differential/dataflow/differential-dataflow";
import { Multiset } from "../differential/multiset";
import { inspect } from "../inspect";

/**
 * Craft an example where we have a bunch of relations and compute over those relations.
 *
 * Something like an Overtone example? Music tracks and music table?
 *
 * See if we can re-render a react component on relation change...
 *
 * - Tieing into render would be about identifying the changed row and binding to rows.
 * - Incremental update of a tree?
 */
test("tables", () => {
  type Track = {
    id: number;
    name: string;
    album_id: number;
    length: number;
  };
  type Artist = {
    id: number;
    name: string;
  };
  type TrackArtist = {
    track_id: number;
    artist_id: number;
  };
  type Album = {
    id: number;
    name: string;
  };
  type Playlist = {
    id: number;
    name: string;
  };
  type TrackPlaylist = {
    track_id: number;
    playlist_id: number;
  };

  // const tracks = new Map<number, Track>();
  // const artists = new Map<number, Artist>();
  // const trackArtists = new Map<number, TrackArtist>();
  // const albums = new Map<number, Album>();
  // const playlists = new Map<number, Playlist>();
  // // playlist_id -> TrackPlaylist
  // const playlistTrack = new Map<number, TrackPlaylist>();

  const graphBuilder = new GraphBuilder();
  const [tracksStream, tracksStreamWriter] =
    graphBuilder.newInput<[number, Track]>();
  const [artistsStream, artistsStreamWriter] =
    graphBuilder.newInput<[number, Artist]>();
  const [trackArtistsStream, trackArtistsStreamWriter] =
    graphBuilder.newInput<[number, TrackArtist]>();
  const [albumsStream, albumsStreamWriter] =
    graphBuilder.newInput<[number, Album]>();
  const [playlistStream, playlistStreamWriter] =
    graphBuilder.newInput<[number, Playlist]>();
  const [playlistTrackStream, playlistTrackStreamWriter] =
    graphBuilder.newInput<[number, TrackPlaylist]>();

  // create a view of the items in a playlist
  /**
   * SELECT track.title, artist.name, album.name, track.length FROM track
   * JOIN track_artist ON track.id = track_artist.track_id
   * JOIN artist ON artist.id = track_artist.artist_id
   * JOIN album ON album.id = track.album_id
   * JOIN playlist_track ON playlist_track.track_id = track.id
   * WHERE playlist_track.playlist_id = 1
   */
  const playlistView = playlistStream
    // filter down to playlist 1
    .filter(([_, playlist]) => playlist.id === 1)
    // join in the playlist->track table
    .join(playlistTrackStream)
    .map((v: any) => {
      // re-key by track_id
      const [_, [playlist, tp]] = v;
      return [tp.track_id, playlist];
    })
    // join in tracks
    .join(tracksStream)
    // re-key by album_id
    .map((v: any) => {
      const [_, [_playlist, track]] = v;
      return [track.album_id, track];
    })
    // join in album
    .join(albumsStream)
    // re-key by artist_id
    // join in artist id
    // re-key by track id
    // reduce to a single row per track
    .debug(inspect);

  const graph = graphBuilder.build();

  const playlists = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Playlist ${i}`,
  }));
  const tracks = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Track ${i}`,
    album_id: Math.floor(i / 10),
    length: i * 1000,
  }));
  const albums = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Album ${i}`,
  }));
  const playlistsTracks: TrackPlaylist[] = [];
  let j = 0;
  for (const playlist of playlists) {
    for (let i = 0; i < 10; i++) {
      playlistsTracks.push({
        track_id: j++,
        playlist_id: playlist.id,
      });
    }
  }

  // Just add them all in a single mutliset
  playlistStreamWriter.sendData(
    new Multiset(playlists.map((p) => [[p.id, p], 1]))
  );
  playlistTrackStreamWriter.sendData(
    new Multiset(playlistsTracks.map((p) => [[p.playlist_id, p], 1]))
  );
  tracksStreamWriter.sendData(new Multiset(tracks.map((t) => [[t.id, t], 1])));
  albumsStreamWriter.sendData(new Multiset(albums.map((a) => [[a.id, a], 1])));

  graph.step();

  // const playlistView = tracksStream
  //   .join(trackArtistsStream)
  //   .join(artistsStream)
  //   .join(albumsStream)
  //   .join(playlistTrackStream)
  //   .filter(([_, [_, [_, [_, [playlistId, _]]]]]) => playlistId === 1)
  //   .map(([[trackId, track], [_, [artistId, artist]], [_, [_, album]], _]) => {
  //     return {
  //       trackId,
  //       track,
  //       artistId,
  //       artist,
  //       album,
  //     };
  //   });
});
