const SAMPLE_COUNT = 1000;

/**
 * Decodes an audio File using the Web Audio API and returns
 * downsampled peak amplitude data — one number[] per channel.
 * Each value is in [0, 1]. Returns null if decoding fails.
 */
export async function extractPeaks(file: File): Promise<number[][] | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = new AudioContext();
    let decoded: AudioBuffer;
    try {
      decoded = await ctx.decodeAudioData(arrayBuffer);
    } finally {
      ctx.close();
    }

    const peaks: number[][] = [];
    const blockSize = Math.max(1, Math.floor(decoded.length / SAMPLE_COUNT));

    for (let c = 0; c < decoded.numberOfChannels; c++) {
      const channelData = decoded.getChannelData(c);
      const channelPeaks: number[] = new Array(SAMPLE_COUNT);

      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channelData.length);
        let max = 0;
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        channelPeaks[i] = Math.round(max * 1000) / 1000;
      }
      peaks.push(channelPeaks);
    }

    return peaks;
  } catch {
    return null;
  }
}
