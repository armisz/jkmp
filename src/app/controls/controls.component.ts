import {Component, OnDestroy, OnInit} from '@angular/core';
import {KodiService} from '../kodi/kodi.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum PlayerStatus {
  Playing, Paused, Stopped
}

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css']
})
export class ControlsComponent implements OnInit, OnDestroy {

  private unsubscribe: Subject<void> = new Subject();

  currentlyPlaying: any = {};
  playerStatus = PlayerStatus.Stopped;

  constructor(private kodi: KodiService) {
  }

  ngOnInit() {
    this.kodi.playerPlaying.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerPlaying);
    this.kodi.playerSpeedChanged.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerSpeedChanged);
    this.kodi.playerStopped.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerStopped);
    this.kodi.playerChanged.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerChanged);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private playerPlaying = () => {
    this.playerStatus = PlayerStatus.Playing;
  }

  private playerSpeedChanged = (speed) => {
    this.playerStatus = (speed === 0) ? PlayerStatus.Paused : PlayerStatus.Playing;
  }

  private playerStopped = () => {
    this.currentlyPlaying = {};
    this.playerStatus = PlayerStatus.Stopped;
  }

  private playerChanged = (data: any) => {
    this.currentlyPlaying = data;
    this.playerStatus = data.file ? (data.speed === 0 ? PlayerStatus.Paused : PlayerStatus.Playing) : PlayerStatus.Stopped;
  }

  isPlaying() {
    return this.playerStatus !== PlayerStatus.Stopped;
  }

  hasAlbum() {
    return this.currentlyPlaying.album && this.currentlyPlaying.album !== '<Unbekannt>';
  }

  getPauseOrResumeIcon() {
    return this.playerStatus === PlayerStatus.Playing ? 'pause' : 'play_arrow';
  }

  onPauseOrResume() {
    this.kodi.pauseOrResume();
  }

  onStop() {
    this.kodi.stop();
  }

  onGotoNext() {
    this.kodi.gotoNext();
  }

  onGotoPrevious() {
    this.kodi.gotoPrevious();
  }
}
