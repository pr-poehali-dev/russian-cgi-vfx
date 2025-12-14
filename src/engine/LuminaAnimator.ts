export interface AnimationTrack {
  id: string;
  objectId: string;
  property: 'position' | 'rotation' | 'scale' | 'color' | 'opacity' | 'custom';
  keyframes: Keyframe[];
  interpolation: 'linear' | 'bezier' | 'step' | 'cubic';
}

export interface Keyframe {
  id: string;
  time: number;
  value: number | number[];
  easing: EasingFunction;
  tangentIn?: [number, number];
  tangentOut?: [number, number];
}

export type EasingFunction = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInBack'
  | 'easeOutBack'
  | 'easeInOutBack'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInOutElastic'
  | 'easeInBounce'
  | 'easeOutBounce'
  | 'easeInOutBounce';

export interface AnimationClip {
  id: string;
  name: string;
  tracks: AnimationTrack[];
  duration: number;
  loop: boolean;
  speed: number;
}

export interface AnimationState {
  clipId: string;
  isPlaying: boolean;
  currentTime: number;
  loop: boolean;
  speed: number;
}

export class LuminaAnimator {
  private clips: Map<string, AnimationClip> = new Map();
  private states: Map<string, AnimationState> = new Map();
  private callbacks: Map<string, (value: any) => void> = new Map();

  public createClip(clip: AnimationClip): void {
    this.clips.set(clip.id, clip);
    this.states.set(clip.id, {
      clipId: clip.id,
      isPlaying: false,
      currentTime: 0,
      loop: clip.loop,
      speed: clip.speed
    });
  }

  public play(clipId: string): void {
    const state = this.states.get(clipId);
    if (state) {
      state.isPlaying = true;
    }
  }

  public pause(clipId: string): void {
    const state = this.states.get(clipId);
    if (state) {
      state.isPlaying = false;
    }
  }

  public stop(clipId: string): void {
    const state = this.states.get(clipId);
    if (state) {
      state.isPlaying = false;
      state.currentTime = 0;
    }
  }

  public seek(clipId: string, time: number): void {
    const state = this.states.get(clipId);
    if (state) {
      state.currentTime = Math.max(0, time);
    }
  }

  public setSpeed(clipId: string, speed: number): void {
    const state = this.states.get(clipId);
    if (state) {
      state.speed = speed;
    }
  }

  public registerCallback(objectId: string, property: string, callback: (value: any) => void): void {
    this.callbacks.set(`${objectId}:${property}`, callback);
  }

  public update(deltaTime: number): void {
    this.states.forEach((state, clipId) => {
      if (!state.isPlaying) return;

      const clip = this.clips.get(clipId);
      if (!clip) return;

      state.currentTime += deltaTime * state.speed;

      if (state.currentTime >= clip.duration) {
        if (state.loop) {
          state.currentTime = state.currentTime % clip.duration;
        } else {
          state.currentTime = clip.duration;
          state.isPlaying = false;
        }
      }

      clip.tracks.forEach(track => {
        const value = this.evaluateTrack(track, state.currentTime);
        const callbackKey = `${track.objectId}:${track.property}`;
        const callback = this.callbacks.get(callbackKey);
        
        if (callback) {
          callback(value);
        }
      });
    });
  }

  public addKeyframe(clipId: string, trackId: string, keyframe: Keyframe): void {
    const clip = this.clips.get(clipId);
    if (!clip) return;

    const track = clip.tracks.find(t => t.id === trackId);
    if (!track) return;

    track.keyframes.push(keyframe);
    track.keyframes.sort((a, b) => a.time - b.time);

    clip.duration = Math.max(clip.duration, keyframe.time);
  }

  public removeKeyframe(clipId: string, trackId: string, keyframeId: string): void {
    const clip = this.clips.get(clipId);
    if (!clip) return;

    const track = clip.tracks.find(t => t.id === trackId);
    if (!track) return;

    track.keyframes = track.keyframes.filter(kf => kf.id !== keyframeId);
  }

  public updateKeyframe(clipId: string, trackId: string, keyframeId: string, updates: Partial<Keyframe>): void {
    const clip = this.clips.get(clipId);
    if (!clip) return;

    const track = clip.tracks.find(t => t.id === trackId);
    if (!track) return;

    const keyframe = track.keyframes.find(kf => kf.id === keyframeId);
    if (!keyframe) return;

    Object.assign(keyframe, updates);
    
    if (updates.time !== undefined) {
      track.keyframes.sort((a, b) => a.time - b.time);
    }
  }

  private evaluateTrack(track: AnimationTrack, time: number): number | number[] {
    if (track.keyframes.length === 0) {
      return Array.isArray(track.keyframes[0]?.value) ? [0, 0, 0] : 0;
    }

    if (track.keyframes.length === 1) {
      return track.keyframes[0].value;
    }

    let keyframe1: Keyframe | null = null;
    let keyframe2: Keyframe | null = null;

    for (let i = 0; i < track.keyframes.length - 1; i++) {
      if (time >= track.keyframes[i].time && time <= track.keyframes[i + 1].time) {
        keyframe1 = track.keyframes[i];
        keyframe2 = track.keyframes[i + 1];
        break;
      }
    }

    if (!keyframe1 || !keyframe2) {
      if (time < track.keyframes[0].time) {
        return track.keyframes[0].value;
      }
      return track.keyframes[track.keyframes.length - 1].value;
    }

    const duration = keyframe2.time - keyframe1.time;
    const elapsed = time - keyframe1.time;
    const t = elapsed / duration;

    const easedT = this.applyEasing(t, keyframe1.easing);

    if (Array.isArray(keyframe1.value) && Array.isArray(keyframe2.value)) {
      return keyframe1.value.map((v1, i) => {
        const v2 = keyframe2!.value[i];
        return this.interpolate(v1, v2, easedT, track.interpolation, keyframe1, keyframe2);
      });
    } else {
      return this.interpolate(
        keyframe1.value as number,
        keyframe2.value as number,
        easedT,
        track.interpolation,
        keyframe1,
        keyframe2
      );
    }
  }

  private interpolate(
    v1: number,
    v2: number,
    t: number,
    method: string,
    kf1?: Keyframe | null,
    kf2?: Keyframe | null
  ): number {
    switch (method) {
      case 'linear':
        return v1 + (v2 - v1) * t;
      
      case 'step':
        return t < 1 ? v1 : v2;
      
      case 'bezier':
        if (kf1?.tangentOut && kf2?.tangentIn) {
          return this.cubicBezier(v1, v2, kf1.tangentOut[1], kf2.tangentIn[1], t);
        }
        return v1 + (v2 - v1) * t;
      
      case 'cubic':
        const t2 = t * t;
        const t3 = t2 * t;
        return v1 * (2 * t3 - 3 * t2 + 1) + v2 * (3 * t2 - 2 * t3);
      
      default:
        return v1 + (v2 - v1) * t;
    }
  }

  private cubicBezier(p0: number, p3: number, p1: number, p2: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3;
  }

  private applyEasing(t: number, easing: EasingFunction): number {
    switch (easing) {
      case 'linear':
        return t;
      
      case 'easeIn':
        return t * t;
      
      case 'easeOut':
        return t * (2 - t);
      
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      
      case 'easeInBack': {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
      }
      
      case 'easeOutBack': {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      }
      
      case 'easeInOutBack': {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
      }
      
      case 'easeInElastic': {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
      }
      
      case 'easeOutElastic': {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      }
      
      case 'easeInOutElastic': {
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
      }
      
      case 'easeInBounce':
        return 1 - this.applyEasing(1 - t, 'easeOutBounce');
      
      case 'easeOutBounce': {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
          return n1 * t * t;
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      }
      
      case 'easeInOutBounce':
        return t < 0.5
          ? (1 - this.applyEasing(1 - 2 * t, 'easeOutBounce')) / 2
          : (1 + this.applyEasing(2 * t - 1, 'easeOutBounce')) / 2;
      
      default:
        return t;
    }
  }

  public getClip(id: string): AnimationClip | undefined {
    return this.clips.get(id);
  }

  public getState(clipId: string): AnimationState | undefined {
    return this.states.get(clipId);
  }

  public getAllClips(): AnimationClip[] {
    return Array.from(this.clips.values());
  }

  public dispose(): void {
    this.clips.clear();
    this.states.clear();
    this.callbacks.clear();
  }
}

export default LuminaAnimator;
