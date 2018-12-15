import {Component, OnDestroy, OnInit} from '@angular/core';
import {KodiService} from '../kodi/kodi.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css']
})
export class ControlsComponent implements OnInit, OnDestroy {

  private unsubscribe: Subject<void> = new Subject();

  currentlyPlaying: string;
  paused: boolean;

  constructor(private kodi: KodiService) {
  }

  ngOnInit() {
    this.kodi.playerPlaying.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerPlaying);
    this.kodi.playerSpeedChanged.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerSpeedChanged);
    this.kodi.playerStopped.pipe(takeUntil(this.unsubscribe)).subscribe(this.playerStopped);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private playerPlaying = (url) => {
    this.currentlyPlaying = url;
    this.paused = false;
  }

  private playerSpeedChanged = (speed) => {
    this.paused = speed === 0;
  }

  private playerStopped = () => {
    this.currentlyPlaying = '';
    this.paused = false;
  }

  onPauseOrResume() {
    this.kodi.pauseOrResume();
  }

  onStop() {
    this.kodi.stop();
  }

}
