"use client"

import { useEffect, useRef } from "react"

interface PlyrPlayerProps {
  src: string
  poster?: string
  className?: string
  type?: "video" | "audio"
}

export default function PlyrPlayer({ src, poster, className, type = "video" }: PlyrPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    const loadPlyr = async () => {
      if (!mediaRef.current) return

      try {
        const Plyr = (await import("plyr")).default
        
        if (playerRef.current) {
          playerRef.current.destroy()
        }

        // Base controls for both audio and video
        const controls = [
          "rewind",     // -10s
          "play",
          "fast-forward", // +10s
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "settings",   // Settings menu
        ]

        // Default settings
        let settings = ['loop'] // Audio only needs loop

        if (type === "video") {
           // Video gets large play button, pip, fullscreen
           controls.unshift("play-large")
           controls.push("pip", "fullscreen")
           // Video gets speed and quality too
           settings = ['quality', 'speed', 'loop']
        }
        
        playerRef.current = new Plyr(mediaRef.current, {
          seekTime: 10,
          speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
          tooltips: { controls: true, seek: true },
          controls: controls,
          settings: settings,
          loop: { active: false },
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
  }, [src, type])

  return (
    <div className="w-full plyr-container-custom">
      {type === "video" ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          className={`plyr-react ${className}`}
          poster={poster}
          playsInline
        >
          <source src={src} />
        </video>
      ) : (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          className={`plyr-react ${className}`}
          // Removed 'controls' attribute to prevent flash of default player
        >
          <source src={src} />
        </audio>
      )}
    </div>
  )
}
