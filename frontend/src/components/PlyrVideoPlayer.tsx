"use client"

import { useEffect, useRef } from "react"

interface PlyrVideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export default function PlyrVideoPlayer({ src, poster, className }: PlyrVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    const loadPlyr = async () => {
      if (!videoRef.current) return

      try {
        const Plyr = (await import("plyr")).default
        
        if (playerRef.current) {
          playerRef.current.destroy()
        }

        playerRef.current = new Plyr(videoRef.current, {
          seekTime: 10,
          tooltips: { controls: true, seek: true },
          controls: [
            "play-large", // The large play button in the center
            "rewind",     // -10s
            "play",
            "fast-forward", // +10s
            "progress",
            "current-time",
            "duration",   // Total time
            "mute",
            "volume",
            "settings",   // Settings menu (speed, quality)
            "pip",        // Picture-in-picture
            "fullscreen",
          ],
        })
      } catch (e) {
        console.error("Plyr failed to load", e)
      }
    }

    const timer = setTimeout(() => {
        loadPlyr()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [src])

  return (
    <div className="w-full">
      <video
        ref={videoRef}
        className={`plyr-react ${className}`}
        poster={poster}
        playsInline
      >
        <source src={src} />
      </video>
    </div>
  )
}
