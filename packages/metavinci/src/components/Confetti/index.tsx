import React, { useEffect, useState } from "react";

interface Particle {
  top: number,
  left: number,
  speed: number,
  angle: number,
  angle_speed: number,
  size: number,
}

export const Confetti = () => {
  const [particles, setParticles] = useState<Array<Particle>>(Array.from({ length: 30 }).map(_ => ({
    top: -Math.random() * 100,
    left: Math.random() * 100,
    speed: Math.random() * 1 + 3,
    angle: 0,
    angle_speed: Math.random() * 10 + 5,
    size: Math.floor(Math.random() * 8 + 12),
  })))

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(parts => parts.map(part => ({
        ...part,
        top: (part.top > 130 ? -30 : part.top + part.speed),
        angle: (part.angle > 360 ? 0 : part.angle + part.angle_speed),
      })))
    }, 70);

    const timeout = setTimeout(() => {
      setParticles([]);
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [])

  const getStyle = (particle: Particle) => ({
    top: `${particle.top}%`,
    left: `${particle.left}%`,
    transform: `rotate(${particle.angle}deg)`,
    width: particle.size,
    height: particle.size,
  })

  return <div>
    {particles.map((particle, idx) => <span key={idx} className="particle" style={getStyle(particle)}></span>)}
  </div>
}
