import subprocess
import os

async def process_video(
    job_id: str,
    video_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    audio_path: str = None,
    audio_volume: float = 1.0,
    watermark_path: str = None
):
    """
    Constructs and runs the FFmpeg filter_complex command.
    """
    # Base inputs
    cmd = ['ffmpeg', '-y', '-i', video_path]
    inputs = 1
    
    audio_idx = None
    watermark_idx = None
    
    if audio_path and os.path.exists(audio_path):
        cmd.extend(['-i', audio_path])
        audio_idx = inputs
        inputs += 1
        
    if watermark_path and os.path.exists(watermark_path):
        cmd.extend(['-i', watermark_path])
        watermark_idx = inputs
        inputs += 1
        
    filter_complex = []
    
    # 1. Trimming Video
    # PTS-STARTPTS resets timestamps so video starts at 0
    filter_complex.append(f"[0:v]trim=start={start_time}:end={end_time},setpts=PTS-STARTPTS[v1]")
    
    curr_v = "[v1]"
    
    # 2. Add Watermark
    if watermark_idx:
        # placing it top right: x=W-w-10, y=10
        filter_complex.append(f"{curr_v}[{watermark_idx}:v]overlay=W-w-10:10[v2]")
        curr_v = "[v2]"
        
    # 3. Audio Trimming and Mixing
    # trim original audio
    filter_complex.append(f"[0:a]atrim=start={start_time}:end={end_time},asetpts=PTS-STARTPTS[a1]")
    
    if audio_idx:
        # adjust volume of imported audio
        duration = end_time - start_time
        filter_complex.append(f"[{audio_idx}:a]atrim=start=0:end={duration},asetpts=PTS-STARTPTS,volume={audio_volume}[a2]")
        # Mix the two audio streams
        filter_complex.append("[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a_out]")
        curr_a = "[a_out]"
    else:
        curr_a = "[a1]"
        
    cmd.extend(['-filter_complex', ';'.join(filter_complex)])
    
    # Mapping
    cmd.extend(['-map', curr_v, '-map', curr_a])
    
    # Output settings
    cmd.extend(['-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', output_path])
    
    # Run the process
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    print("Running FFmpeg:", " ".join(cmd))
    
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        print("FFmpeg Error:", stderr.decode())
        raise Exception("FFmpeg processing failed")
    
    return True
