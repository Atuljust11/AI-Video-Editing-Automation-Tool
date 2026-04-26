import { useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:8000';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null); // url for preview
  const [videoFilename, setVideoFilename] = useState(''); // backend filename
  
  const [audioFile, setAudioFile] = useState(null);
  const [audioFilename, setAudioFilename] = useState(''); // backend filename

  const [watermarkFile, setWatermarkFile] = useState(null);
  const [watermarkFilename, setWatermarkFilename] = useState('');

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [volume, setVolume] = useState(1.0);

  const [stockAudio, setStockAudio] = useState([]);
  
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    fetch(`${BACKEND_URL}/stock-audio`)
      .then(res => res.json())
      .then(data => setStockAudio(data))
      .catch(err => console.error(err));
  }, []);

  const handleFileUpload = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (type === 'video') {
        setVideoFilename(data.filename);
        setVideoUrl(URL.createObjectURL(file));
      } else if (type === 'audio') {
        setAudioFilename(data.filename);
      } else if (type === 'watermark') {
        setWatermarkFilename(data.filename);
      }
    } catch (err) {
      console.error(err);
      alert("File upload failed!");
    }
  };

  const handleExport = async () => {
    if (!videoFilename) {
      alert("Please upload a video first!");
      return;
    }
    
    const payload = {
      video_file: videoFilename,
      start_time: parseFloat(startTime),
      end_time: parseFloat(endTime),
      audio_file: audioFilename || null,
      audio_volume: parseFloat(volume),
      watermark_file: watermarkFilename || null
    };

    try {
      const res = await fetch(`${BACKEND_URL}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setJobId(data.job_id);
      setJobStatus('processing');
    } catch (err) {
      console.error(err);
      alert("Render failed to start!");
    }
  };

  useEffect(() => {
    let interval;
    if (jobId && jobStatus === 'processing') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/status/${jobId}`);
          const data = await res.json();
          setJobStatus(data.status);
          if (data.status === 'completed') {
            setDownloadUrl(`${BACKEND_URL}/download/${data.file}`);
            clearInterval(interval);
          }
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI Video Editor
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Create stunning videos in seconds with our automated tool.</p>
          </div>
          {downloadUrl && (
            <a href={downloadUrl} download className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-semibold shadow-lg shadow-green-500/20 transition-all text-sm tracking-wide">
              Download Output →
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left - Video Player & Trim */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 overflow-hidden relative group">
              {videoUrl ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-700">
                  <video src={videoUrl} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 border-2 border-dashed border-gray-700 hover:border-indigo-500/50 rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors p-6 text-center">
                  <svg className="w-12 h-12 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium">No video selected</p>
                  <p className="text-sm mt-1">Upload an MP4 to start editing</p>
                  
                  <label className="mt-4 px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg cursor-pointer transition-colors text-sm font-semibold border border-indigo-500/30">
                    Browse Files
                    <input type="file" accept="video/mp4" className="hidden" onChange={e => {
                      setVideoFile(e.target.files[0]);
                      handleFileUpload(e.target.files[0], 'video');
                    }} />
                  </label>
                </div>
              )}
            </div>

            <div className="glass-panel p-6 space-y-5">
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Trimming
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Start Time (sec)</label>
                  <input type="number" step="0.1" value={startTime} onChange={e => setStartTime(e.target.value)}
                         className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">End Time (sec)</label>
                  <input type="number" step="0.1" value={endTime} onChange={e => setEndTime(e.target.value)}
                         className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Audio, Watermark & Export */}
          <div className="space-y-6">
            
            {/* Audio Settings */}
            <div className="glass-panel p-6 space-y-5">
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Background Music
              </h3>
              
              <div className="space-y-4">
                {/* Upload Own Music */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Upload Custom (MP3)</label>
                  <label className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-700 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 transition-colors text-sm text-gray-300">
                    <span className="truncate">{audioFile ? audioFile.name : 'Choose file...'}</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={e => {
                      setAudioFile(e.target.files[0]);
                      handleFileUpload(e.target.files[0], 'audio');
                    }} />
                  </label>
                </div>
                
                {/* Stock Music */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Or Use Stock Library</label>
                  <select 
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    onChange={e => setAudioFilename(e.target.value)}
                  >
                    <option value="">Select a genre...</option>
                    {stockAudio.map(track => (
                      <option key={track.id} value={track.file}>{track.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Volume Slider */}
                {(audioFilename || audioFile) && (
                  <div className="pt-2">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Volume</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(e.target.value)}
                           className="w-full accent-indigo-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Watermark Settings */}
            <div className="glass-panel p-6 space-y-5">
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Watermark Profile
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Overlay Image (PNG)</label>
                <label className="w-full flex flex-col items-center justify-center p-4 border border-gray-700 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                  {watermarkFile ? (
                    <span className="text-sm text-gray-300 truncate w-full text-center">{watermarkFile.name}</span>
                  ) : (
                    <>
                      <div className="px-3 py-1 bg-gray-900 rounded-md text-xs font-semibold text-gray-400 shadow-sm border border-gray-800">Choose PNG</div>
                    </>
                  )}
                  <input type="file" accept="image/png" className="hidden" onChange={e => {
                    setWatermarkFile(e.target.files[0]);
                    handleFileUpload(e.target.files[0], 'watermark');
                  }} />
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">Will be placed in the top-right corner.</p>
              </div>
            </div>

            {/* Export & Status */}
            <div className="glass-panel p-6">
              <button 
                onClick={handleExport}
                disabled={jobStatus === 'processing'}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {jobStatus === 'processing' ? 'Processing Video...' : 'Export Final Video'}
              </button>

              {jobStatus === 'processing' && (
                <div className="mt-4 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg text-center">
                  <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-sm font-medium text-indigo-300 tracking-wide">Rendering in progress...</p>
                  <p className="text-xs text-gray-400 mt-1">This might take a moment based on video size.</p>
                </div>
              )}

              {jobStatus === 'completed' && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                  <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-green-400">Rendering Complete!</p>
                </div>
              )}
              
              {jobStatus === 'failed' && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
                  <p className="text-sm font-semibold text-red-500">Rendering Failed</p>
                  <p className="text-xs text-gray-400 mt-1">Check backend logs for details.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
