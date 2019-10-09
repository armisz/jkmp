import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KodiService implements OnDestroy {

  private static KODI_URL = 'http://192.168.1.3/jsonrpc';
  private static PLAYER_POLL_INTERVAL_MS = 5000;
  private static HTTP_OPTIONS = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    })
  };

  private requestId = 1;
  private unsubscribe: Subject<void> = new Subject();
  private readonly interval: any;

  playerPlaying = new Subject<string>();
  playerSpeedChanged = new Subject<number>();
  playerStopped = new Subject<void>();
  playerChanged = new Subject<any>();

  constructor(private httpClient: HttpClient) {
    this.interval = setInterval(() => {
      this.pollPlayer();
    }, KodiService.PLAYER_POLL_INTERVAL_MS);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  loadLibraryInfo() {
    const musicSources = this.createJsonRpcRequest('Files.GetSources', {media: 'music'});
    return this.httpClient
      .post(KodiService.KODI_URL, musicSources, KodiService.HTTP_OPTIONS)
      .pipe(map((res: any) => {
        const library = res.result.sources.filter((source: any) => source.file.startsWith('nfs://'))[0];
        return {
          file: library.file,
          name: library.label
        };
      }));
  }

  private pollPlayer() {
    const playerProperties = this.createJsonRpcRequest('Player.GetProperties', {playerid: 0, properties: ['speed', 'time', 'totaltime']});
    const playerItem = this.createJsonRpcRequest('Player.GetItem', {playerid: 0, properties: ['file', 'album', 'artist']});
    this.httpClient
      .post(KodiService.KODI_URL, [playerProperties, playerItem].join(','), KodiService.HTTP_OPTIONS)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: any) => {
          let playerItemInfo = {};
          if (res[1].result.item.file) {
            playerItemInfo = {
              file: res[1].result.item.file,
              label: res[1].result.item.label,
              album: res[1].result.item.album,
              artist: res[1].result.item.artist[0],
              speed: res[0].result.speed,
              time: res[0].result.time,
              totaltime: res[0].result.totaltime,
            };
          }
          this.playerChanged.next(playerItemInfo);
        },
        err => this.panic(err)
      );
  }

  loadDirectory(directory: string) {
    const musicDirectories = this.createJsonRpcRequest('Files.GetDirectory', {
      directory: directory,
      media: 'music',
      sort: {method: 'label', order: 'ascending'}
    });

    return this.httpClient
      .post(KodiService.KODI_URL, musicDirectories, KodiService.HTTP_OPTIONS)
      .pipe(map((res: any) => {
        return {
          url: directory,
          toc: res.result.files.filter((elm: any) => elm.label !== '@eaDir')
        };
      }));
  }

  playDirectory(directory: string) {
    this.play(directory, {directory: directory});
  }

  playFile(file: string) {
    this.play(file, {file: file});
  }

  private play(url: string, playlistItem: any) {
    const clearPlaylist = this.createJsonRpcRequest('Playlist.Clear', {playlistid: 0});
    const insertIntoPlaylist = this.createJsonRpcRequest('Playlist.Insert', {playlistid: 0, position: 0, item: playlistItem});
    const openPlayer = this.createJsonRpcRequest('Player.Open', {item: {playlistid: 0, position: 0}, options: {}});

    this.httpClient
      .post(KodiService.KODI_URL, [clearPlaylist, insertIntoPlaylist, openPlayer].join(','), KodiService.HTTP_OPTIONS)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => this.playerPlaying.next(url),
        err => this.panic(err)
      );
  }

  pauseOrResume() {
    const togglePlayer = this.createJsonRpcRequest('Player.PlayPause', {playerid: 0, play: 'toggle'});
    this.httpClient
      .post(KodiService.KODI_URL, togglePlayer, KodiService.HTTP_OPTIONS)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (res: any) => this.playerSpeedChanged.next(res.result.speed),
        err => this.panic(err)
      );
  }

  stop() {
    const stopPlayer = this.createJsonRpcRequest('Player.Stop', {playerid: 0});
    const clearPlaylist = this.createJsonRpcRequest('Playlist.Clear', {playlistid: 0});
    this.httpClient
      .post(KodiService.KODI_URL, [stopPlayer, clearPlaylist].join(','), KodiService.HTTP_OPTIONS)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => this.playerStopped.next(),
        err => this.panic(err)
      );
  }

  gotoPrevious() {
    this.goto('previous');
  }

  gotoNext() {
    this.goto('next');
  }

  private goto(where: string) {
    const gotoPlayer = this.createJsonRpcRequest('Player.GoTo', {playerid: 0, to: where});
    this.httpClient
      .post(KodiService.KODI_URL, gotoPlayer, KodiService.HTTP_OPTIONS)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        () => {
        },
        err => this.panic(err)
      );
  }

  private createJsonRpcRequest(method: string, params: any) {
    return {
      method: method,
      params: params,
      id: this.requestId++,
      jsonrpc: '2.0'
    };
  }

  panic = (err) => {
    console.error(err);
  }

}
