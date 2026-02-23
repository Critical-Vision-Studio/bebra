import { useRef, useEffect, useCallback } from 'react'

const VERTEX_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

function wrapFragmentShader(userCode: string): string {
  return `
precision mediump float;
uniform float iTime;
uniform vec2 iResolution;

${userCode}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

interface ShaderAvatarProps {
  fragmentShader: string
  size?: number
  style?: React.CSSProperties
  className?: string
}

export default function ShaderAvatar({ fragmentShader, size = 64, style, className }: ShaderAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const startRef = useRef(performance.now())
  const locRef = useRef<{ time: WebGLUniformLocation | null; res: WebGLUniformLocation | null }>({ time: null, res: null })

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false

    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false })
    if (!gl) return false
    glRef.current = gl

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, wrapFragmentShader(fragmentShader))
    if (!vs || !fs) return false

    const prog = gl.createProgram()
    if (!prog) return false
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog)
      return false
    }

    programRef.current = prog
    gl.useProgram(prog)

    locRef.current.time = gl.getUniformLocation(prog, 'iTime')
    locRef.current.res = gl.getUniformLocation(prog, 'iResolution')

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    gl.viewport(0, 0, canvas.width, canvas.height)
    startRef.current = performance.now()
    return true
  }, [fragmentShader, size])

  useEffect(() => {
    if (!init()) return

    const draw = () => {
      const gl = glRef.current
      if (!gl) return
      const t = (performance.now() - startRef.current) / 1000
      gl.uniform1f(locRef.current.time, t)
      gl.uniform2f(locRef.current.res, gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      const gl = glRef.current
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current)
        programRef.current = null
      }
    }
  }, [init])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'block',
        ...style,
      }}
    />
  )
}
