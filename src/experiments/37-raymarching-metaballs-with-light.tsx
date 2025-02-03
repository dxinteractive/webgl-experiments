import type { ExperimentDefinition } from "../types";
import { shadertoy } from "./utils/shadertoy";

const shader = `
#define RAYMARCH_MAX_STEPS 100
#define RAYMARCH_MAX_DIST 100.
#define RAYMARCH_SURF_DIST .01

// from https://iquilezles.org/articles/smin/
float smin( float a, float b, float k )
{
    k *= 4.0;
    float h = max( k-abs(a-b), 0.0 )/k;
    return min(a,b) - h*h*k*(1.0/4.0);
}

float getDist(vec3 p) {
  vec4 s1 = vec4(sin(u_time), 1., 6., 1.5);
  vec4 s2 = vec4(sin(u_time * 2.1), 1. + sin(u_time * 1.3), 6. + sin(u_time * 2.) * 1.5, 1.5);
  vec4 s3 = vec4(cos(u_time * 3.1) * 2., 1. + sin(u_time * 1.9), 6. + sin(u_time) * 2., 1.);

  float sphereDist1 = length(p - s1.xyz) - s1.w;
  float sphereDist2 = length(p - s2.xyz) - s2.w;
  float sphereDist3 = length(p - s3.xyz) - s3.w;

  float planeDist = p.y + 2.;

  float dist = min(smin(smin(sphereDist1, sphereDist2, .2), sphereDist3, .2), planeDist);
  return dist;
}

float raymarch(vec3 rayOrigin, vec3 rayDir) {
  float totalDist = 0.;
  for(int i = 0; i < RAYMARCH_MAX_STEPS; i++) {
    vec3 p = rayOrigin + rayDir * totalDist;
    float dist = getDist(p);
    totalDist += dist;
    if(totalDist > RAYMARCH_MAX_DIST || dist < RAYMARCH_SURF_DIST) {
      break;
    }
  }
  return totalDist;
}

vec3 getNormal(vec3 p) {
	float d = getDist(p);
  vec2 e = vec2(.01, 0);
    
  vec3 n = d - vec3(
    getDist(p - e.xyy),
    getDist(p - e.yxy),
    getDist(p - e.yyx)
  );
  
  return normalize(n);
}

float getLight(vec3 p) {
  vec3 lightPos = vec3(0, 5, 4);
  lightPos.xz += vec2(sin(u_time), cos(u_time))*2.;
  vec3 l = normalize(lightPos-p);
  vec3 n = getNormal(p);
    
  float dif = clamp(dot(n, l), 0., 1.);
  float d = raymarch(p + n * RAYMARCH_SURF_DIST * 2., l);
  if(d < length(lightPos - p)) {
    dif *= .1;
  }
    
  return dif;
}

void main() {
  vec3 rayOrigin = vec3(0, 1, 0);
  vec3 rayDir = normalize(vec3(v_view, 1.));

  float dist = raymarch(rayOrigin, rayDir);

  vec3 closeColor = vec3(1., .8, .6);
  vec3 farColor = vec3(0., .2, .4);
  vec3 color = mix(closeColor, farColor, dist / 6. - .2);

  vec3 point = rayOrigin + rayDir * dist;
  float lightness = getLight(point);
  color *= mix(.05, 1., lightness);
  color = pow(color, vec3(.4545)); // gamma correction
  outColor = vec4(color, 1.);
}
`;

const example: ExperimentDefinition = {
  id: "raymarching-metaballs-with-light",
  filename: "37-raymarching-metaballs-with-light.tsx",
  name: "Shadertoy raymarching metaballs with light",
  description:
    "Raymarching lighting guided by artofcode's 'Raymarching for dummies'",
  Component: shadertoy({
    width: 800,
    height: 600,
    cssWidth: "800px",
    shader,
  }),
};

export default example;
