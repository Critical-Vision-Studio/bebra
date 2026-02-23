-- migrate:up

CREATE TABLE shader_scenes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fragment_shader TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN shader_scene_id INTEGER REFERENCES shader_scenes(id) ON DELETE SET NULL;

CREATE INDEX idx_users_shader_scene ON users USING btree (shader_scene_id);

-- Seed predefined shader scenes
INSERT INTO shader_scenes (name, fragment_shader) VALUES
(
  'Plasma',
  E'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n  float t = iTime * 0.4;\n  float v = 0.0;\n  v += sin(uv.x * 10.0 + t);\n  v += sin((uv.y * 10.0 + t) * 0.5);\n  v += sin((uv.x * 10.0 + uv.y * 10.0 + t) * 0.5);\n  vec3 col = vec3(\n    0.5 + 0.5 * cos(v + 0.0),\n    0.5 + 0.5 * cos(v + 2.094),\n    0.5 + 0.5 * cos(v + 4.188)\n  );\n  fragColor = vec4(col, 1.0);\n}'
),
(
  'Voronoi',
  E'vec2 hash2(vec2 p) {\n  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);\n}\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n  vec2 st = uv * 5.0;\n  vec2 i_st = floor(st);\n  vec2 f_st = fract(st);\n  float m_dist = 1.0;\n  vec2 m_point = vec2(0.0);\n  for (int y = -1; y <= 1; y++) {\n    for (int x = -1; x <= 1; x++) {\n      vec2 neighbor = vec2(float(x), float(y));\n      vec2 point = hash2(i_st + neighbor);\n      point = 0.5 + 0.5 * sin(iTime * 0.6 + 6.2831 * point);\n      float dist = length(neighbor + point - f_st);\n      if (dist < m_dist) { m_dist = dist; m_point = point; }\n    }\n  }\n  vec3 col = 0.5 + 0.5 * cos(6.2831 * (m_point.xyx + vec3(0.0, 0.33, 0.67)));\n  col *= 1.0 - 0.5 * m_dist;\n  fragColor = vec4(col, 1.0);\n}'
),
(
  'Fractal',
  E'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);\n  float t = iTime * 0.15;\n  vec2 c = uv * 2.5 + vec2(-0.5 + 0.2 * cos(t), 0.0 + 0.2 * sin(t));\n  vec2 z = vec2(0.0);\n  float i;\n  for (i = 0.0; i < 64.0; i++) {\n    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;\n    if (dot(z, z) > 4.0) break;\n  }\n  float f = i / 64.0;\n  vec3 col = 0.5 + 0.5 * cos(3.0 + f * 6.2831 * 2.0 + vec3(0.0, 0.6, 1.0));\n  if (i >= 64.0) col = vec3(0.0);\n  fragColor = vec4(col, 1.0);\n}'
),
(
  'Waves',
  E'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n  float t = iTime * 0.5;\n  float wave = 0.0;\n  wave += sin(uv.x * 6.0 + t) * 0.15;\n  wave += sin(uv.x * 12.0 - t * 1.3) * 0.08;\n  wave += sin(uv.x * 20.0 + t * 0.7) * 0.04;\n  float y = uv.y - 0.5 - wave;\n  vec3 deep = vec3(0.02, 0.05, 0.2);\n  vec3 surface = vec3(0.1, 0.4, 0.7);\n  vec3 sky = vec3(0.6, 0.8, 1.0);\n  vec3 col = y < 0.0 ? mix(surface, deep, clamp(-y * 4.0, 0.0, 1.0)) : mix(surface, sky, clamp(y * 4.0, 0.0, 1.0));\n  col += 0.15 * exp(-abs(y) * 20.0);\n  fragColor = vec4(col, 1.0);\n}'
),
(
  'Nebula',
  E'float noise(vec2 p) {\n  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);\n}\nfloat fbm(vec2 p) {\n  float v = 0.0; float a = 0.5;\n  for (int i = 0; i < 5; i++) {\n    v += a * noise(p); p = p * 2.0 + 0.5; a *= 0.5;\n  }\n  return v;\n}\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n  float t = iTime * 0.08;\n  float n = fbm(uv * 4.0 + t);\n  float n2 = fbm(uv * 6.0 - t * 0.7 + n);\n  vec3 col = mix(\n    vec3(0.1, 0.0, 0.2),\n    vec3(0.8, 0.2, 0.5),\n    n\n  );\n  col = mix(col, vec3(0.2, 0.5, 1.0), n2 * 0.6);\n  col += 0.1 * pow(n * n2, 2.0);\n  fragColor = vec4(col, 1.0);\n}'
),
(
  'Crystal',
  E'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);\n  float t = iTime * 0.3;\n  float a = atan(uv.y, uv.x);\n  float r = length(uv);\n  float sides = 6.0;\n  float angle = 3.14159 / sides;\n  float sector = mod(a + angle, 2.0 * angle) - angle;\n  vec2 p = r * vec2(cos(sector), sin(sector));\n  float d = abs(p.x) * 0.866 + p.y * 0.5;\n  float pattern = sin(d * 20.0 - t * 2.0) * 0.5 + 0.5;\n  pattern *= sin(r * 15.0 - t * 3.0) * 0.5 + 0.5;\n  vec3 col = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + pattern * 4.0 + t);\n  col *= 1.0 - 0.4 * r;\n  fragColor = vec4(col, 1.0);\n}'
);

-- migrate:down

ALTER TABLE users DROP COLUMN shader_scene_id;
ALTER TABLE users DROP COLUMN avatar_url;
DROP TABLE IF EXISTS shader_scenes;
