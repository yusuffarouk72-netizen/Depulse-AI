/**
 * Audio helper for playing real audio files or generating smooth synchronized
 * playback for sample calls when no external media file is hosted.
 */

export class SynthesizedAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private duration = 420;
  private playbackRate = 1;
  private timer: number | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onEnded: (() => void) | null = null;

  constructor(durationSeconds: number = 420) {
    this.duration = durationSeconds;
  }

  setDuration(duration: number) {
    this.duration = duration;
    this.pauseTime = Math.min(this.pauseTime, duration);
  }

  setPlaybackRate(rate: number) {
    if (this.isPlaying) {
      const current = this.getCurrentTime();
      this.playbackRate = rate;
      this.startTime = performance.now() - (current / rate) * 1000;
    } else {
      this.playbackRate = rate;
    }
  }

  setCallbacks(onTimeUpdate: (time: number) => void, onEnded: () => void) {
    this.onTimeUpdate = onTimeUpdate;
    this.onEnded = onEnded;
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.startTime = performance.now() - (this.pauseTime / this.playbackRate) * 1000;

    // Optional gentle ambient tone on Web Audio to keep browser audio context awake
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.ctx) {
          this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }
    } catch {
      // Audio context may require explicit user gesture; gracefully proceed
    }

    this.tick();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.pauseTime = this.getCurrentTime();
    if (this.timer) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
  }

  seek(seconds: number) {
    const clamped = Math.max(0, Math.min(seconds, this.duration));
    this.pauseTime = clamped;
    if (this.isPlaying) {
      this.startTime = performance.now() - (clamped / this.playbackRate) * 1000;
    }
    this.onTimeUpdate?.(clamped);
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseTime;
    const elapsedMs = performance.now() - this.startTime;
    const current = (elapsedMs / 1000) * this.playbackRate;
    if (current >= this.duration) {
      this.pause();
      this.pauseTime = this.duration;
      this.onEnded?.();
      return this.duration;
    }
    return current;
  }

  private tick = () => {
    if (!this.isPlaying) return;
    const time = this.getCurrentTime();
    this.onTimeUpdate?.(time);
    if (this.isPlaying) {
      this.timer = requestAnimationFrame(this.tick);
    }
  };

  destroy() {
    this.pause();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
