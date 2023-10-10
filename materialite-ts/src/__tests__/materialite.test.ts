import { test } from "vitest";
import { Materialite } from "../materialite";
import util from "util";
import { DifferenceStream } from "../core/graph/DifferenceStream";
import { joinResult } from "@vlcn.io/datastructures-and-algos/tuple";

function inspect(e: any) {
  console.log(util.inspect(e, false, null, true));
}

test("Materialite#setSource", () => {
  const materialite = new Materialite();
  const set = materialite.newSet<number>();

  set.stream.map((v) => v + 1).debug((v) => inspect(v));
  set.add(1);
  set.add(1);
  set.delete(1);
});

test("Materialite#setSource - nothing released until commit", () => {});

test("db/overtone example - materialize track view", () => {
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
  type MaterializedTrack = {
    id: number;
    name: string;
    album_name: string;
    artists: string[];
    length: number;
  };

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

  const trackArtists: TrackArtist[] = [];
  for (let i = 0; i < tracks.length; i++) {
    trackArtists.push({
      track_id: i,
      artist_id: i % 10,
    });
  }
  const artists = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Artist ${i}`,
  }));

  const materialite = new Materialite();

  // TODO: what if operators are attached after the source is committed?
  // Maybe no initial construction allowed?
  const playlistSource = materialite.newSet<Playlist>();
  const trackSource = materialite.newSet<Track>();
  const albumSource = materialite.newSet<Album>();
  const playlistTrackSource = materialite.newSet<TrackPlaylist>();
  const trackArtistSource = materialite.newSet<TrackArtist>();
  const artistSource = materialite.newSet<Artist>();

  // playlistTrackSource.stream.debug((v) => inspect(v));

  // TODO: specify a key function in join rather than re-keying all the damn time.
  playlistSource.stream
    .filter((playlist) => playlist.id === 1)
    .join(
      playlistTrackSource.stream,
      (playlist) => playlist.id,
      (trackPlaylist) => trackPlaylist.playlist_id
    )
    .join(
      trackSource.stream,
      ([_playlist, trackPlaylist]) => trackPlaylist.track_id,
      (track) => track.id
    )
    .join(
      albumSource.stream,
      ([_playlist, _trackPlaylist, track]) => track.album_id,
      (album) => album.id
    )
    .join(
      trackArtistSource.stream,
      ([_playlist, _trackPlaylist, track, _album]) => track.id,
      (trackArtist) => trackArtist.track_id
    )
    .join(
      artistSource.stream,
      ([_playlist, _trackPlaylist, _track, _album, trackArtist]) =>
        trackArtist.artist_id,
      (artist) => artist.id
    )
    // .reduce((tracks) => {
    //   if (tracks.length == 0) {
    //     return [];
    //   }
    //   const firstTrack = tracks[0]![0];
    //   const track: MaterializedTrack = {
    //     id: firstTrack.id,
    //     name: firstTrack[0].name,
    //     album_name: firstTrack[1].name,
    //     artists: tracks.map((t) => t[0][2].name),
    //     length: firstTrack[0].length,
    //   };
    // })
    .debug(inspect);

  // .join(playlistTrackSource.stream)
  // .map(([_, [playlist, trackPlaylist]]) => {
  //   return [trackPlaylist.track_id, playlist];
  // })
  // .debug((v) => inspect(v));

  playlistSource.addAll(playlists);
  trackSource.addAll(tracks);
  albumSource.addAll(albums);
  playlistTrackSource.addAll(playlistsTracks);
  trackArtistSource.addAll(trackArtists);
  artistSource.addAll(artists);
});
