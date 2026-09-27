import { analyzeSignal, type AnalyzeOptions } from './analyze';

self.onmessage = (e: MessageEvent<{ signal: Float32Array; sampleRate: number; opts: AnalyzeOptions }>) => {
  const { signal, sampleRate, opts } = e.data;
  try {
    const result = analyzeSignal(signal, sampleRate, {
      ...opts,
      onProgress: (fraction, stage) => self.postMessage({ type: 'progress', fraction, stage }),
    });
    self.postMessage({ type: 'done', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
