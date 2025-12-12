// SoundGenerator - 使用 Web Audio API 生成音效
// 无需外部 MP3 文件，完全在浏览器端生成

export class SoundGenerator {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // 播放紧急警报音 (高频急促)
  playCritical(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // 三声急促的高频音
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, now + i * 0.2); // A5

      gainNode.gain.setValueAtTime(0, now + i * 0.2);
      gainNode.gain.linearRampToValueAtTime(0.3, now + i * 0.2 + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.15);

      oscillator.start(now + i * 0.2);
      oscillator.stop(now + i * 0.2 + 0.15);
    }
  }

  // 播放警告音 (中频两声)
  playWarning(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // 两声中频音
    for (let i = 0; i < 2; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, now + i * 0.25); // E5

      gainNode.gain.setValueAtTime(0, now + i * 0.25);
      gainNode.gain.linearRampToValueAtTime(0.25, now + i * 0.25 + 0.03);
      gainNode.gain.linearRampToValueAtTime(0, now + i * 0.25 + 0.2);

      oscillator.start(now + i * 0.25);
      oscillator.stop(now + i * 0.25 + 0.2);
    }
  }

  // 播放成功音 (上升音阶)
  playSuccess(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + i * 0.1);

      gainNode.gain.setValueAtTime(0, now + i * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.15);

      oscillator.start(now + i * 0.1);
      oscillator.stop(now + i * 0.1 + 0.15);
    });
  }

  // 播放开始音 (短促提示)
  playStart(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now); // A4

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  // 播放停止音 (下降音)
  playStop(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.linearRampToValueAtTime(220, now + 0.15);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // 播放通知音 (柔和单音)
  playNotification(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(587.33, now); // D5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // 清理资源
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 单例实例
let soundGeneratorInstance: SoundGenerator | null = null;

export function getSoundGenerator(): SoundGenerator {
  if (!soundGeneratorInstance) {
    soundGeneratorInstance = new SoundGenerator();
  }
  return soundGeneratorInstance;
}

// 便捷方法
export const playSound = {
  critical: () => getSoundGenerator().playCritical(),
  warning: () => getSoundGenerator().playWarning(),
  success: () => getSoundGenerator().playSuccess(),
  start: () => getSoundGenerator().playStart(),
  stop: () => getSoundGenerator().playStop(),
  notification: () => getSoundGenerator().playNotification(),
};
