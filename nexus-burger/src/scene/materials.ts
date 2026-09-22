import * as THREE from 'three'
import { random } from './geometry'

let noiseTexture: THREE.DataTexture | undefined
function grainTexture() {
  if (noiseTexture) return noiseTexture
  const size = 256,
    rng = random(872),
    data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = Math.floor(rng() * 255)
    data[i * 4 + 1] = Math.floor(rng() * 255)
    data[i * 4 + 2] = Math.floor(rng() * 255)
    data[i * 4 + 3] = 255
  }
  noiseTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping
  noiseTexture.magFilter = THREE.LinearFilter
  noiseTexture.minFilter = THREE.LinearMipmapLinearFilter
  noiseTexture.generateMipmaps = true
  noiseTexture.needsUpdate = true
  return noiseTexture
}

const noiseGLSL = `
  varying vec3 vFoodPosition;
  uniform sampler2D uFoodGrain;
  float foodHash(vec3 p) { p = fract(p * .3183099 + vec3(.1,.2,.3)); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float foodNoise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(mix(foodHash(i),foodHash(i+vec3(1,0,0)),f.x),mix(foodHash(i+vec3(0,1,0)),foodHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(foodHash(i+vec3(0,0,1)),foodHash(i+vec3(1,0,1)),f.x),mix(foodHash(i+vec3(0,1,1)),foodHash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float foodFbm(vec3 p) { return .58 * foodNoise(p) + .28 * foodNoise(p * 2.13) + .14 * foodNoise(p * 4.37); }
  float foodPores(vec2 p) {
    vec2 cell = floor(p), f = fract(p);
    vec2 center = vec2(foodHash(vec3(cell, 3.)), foodHash(vec3(cell, 7.))) * .58 + .21;
    float radius = .035 + .2 * foodHash(vec3(cell, 11.));
    return (1. - smoothstep(radius * .22, radius, length((f - center) * vec2(1.,1.25)))) * step(.22,foodHash(vec3(cell, 17.)));
  }
`

export function foodMaterial(kind: 'bun' | 'base' | 'meat' | 'cheese' | 'leaf' | 'egg' | 'yolk') {
  const options: Record<typeof kind, THREE.MeshPhysicalMaterialParameters> = {
    bun: {
      color: '#ed9b3c',
      roughness: 0.57,
      clearcoat: 0.09,
      clearcoatRoughness: 0.6,
      sheen: 0.12,
    },
    base: { color: '#eab775', roughness: 0.83, sheen: 0.1 },
    meat: { color: '#60311c', roughness: 0.74, clearcoat: 0.23, clearcoatRoughness: 0.24 },
    cheese: {
      color: '#eea41d',
      roughness: 0.47,
      clearcoat: 0.1,
      clearcoatRoughness: 0.45,
      side: THREE.DoubleSide,
    },
    leaf: {
      color: '#669923',
      roughness: 0.66,
      sheen: 0.25,
      sheenColor: new THREE.Color('#aec467'),
      side: THREE.DoubleSide,
    },
    egg: { color: '#fff3cc', roughness: 0.53, clearcoat: 0.13, clearcoatRoughness: 0.42 },
    yolk: { color: '#f49a08', roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.3 },
  }
  const mat = new THREE.MeshPhysicalMaterial(options[kind])
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFoodGrain = { value: grainTexture() }
    shader.vertexShader = 'varying vec3 vFoodPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvFoodPosition = position;'
    )
    shader.fragmentShader = noiseGLSL + shader.fragmentShader
    let recipe = ''
    if (kind === 'bun' || kind === 'base') {
      recipe = `
        float mottling = foodFbm(vFoodPosition * 4.) + foodNoise(vFoodPosition * 27.) * .08;
        float grain = texture2D(uFoodGrain, vFoodPosition.xz * 2.2 + vFoodPosition.y * .2).r;
        float crust = smoothstep(${kind === 'bun' ? '.12, .84' : '-.12, .18'}, vFoodPosition.y);
        vec3 toasted = mix(vec3(.13,.024,.003), vec3(.65,.285,.058), smoothstep(.12,.83,mottling));
        float pores = foodPores(vFoodPosition.xz * 25.) * .72 + foodPores(vFoodPosition.xz * 67.) * .23;
        vec3 crumb = mix(vec3(.74,.49,.23), vec3(.27,.12,.035), pores);
        diffuseColor.rgb = mix(crumb, toasted, ${kind === 'bun' ? '.38 + crust * .62' : '1. - smoothstep(.16,.235,vFoodPosition.y) * .8'});
        diffuseColor.rgb *= .91 + grain * .15;
        diffuseColor.rgb *= 1. - .14 * smoothstep(.6,.8,foodNoise(vFoodPosition*110.));
      `
    } else if (kind === 'meat') {
      recipe = `
        float charred = foodFbm(vFoodPosition * 29.);
        float sear = pow(.5 + .5 * sin((vFoodPosition.x - vFoodPosition.z * .34) * 17. + foodNoise(vFoodPosition*8.)*.55), 9.);
        diffuseColor.rgb = mix(vec3(.014,.005,.002),vec3(.145,.049,.016),smoothstep(.16,.83,charred));
        diffuseColor.rgb *= 1. - sear * .73 * smoothstep(.1,.16,abs(vFoodPosition.y));
        diffuseColor.rgb += vec3(.028,.015,.006) * smoothstep(.7,.84,foodNoise(vFoodPosition * 91.));
      `
    } else if (kind === 'leaf') {
      recipe = `
        float r = length(vFoodPosition.xz);
        float leafVariation = foodFbm(vFoodPosition * 10.);
        float ribs = pow(abs(sin(atan(vFoodPosition.z, vFoodPosition.x) * 11. + r * 4.)), 28.);
        diffuseColor.rgb = mix(vec3(.028,.12,.008),vec3(.24,.43,.037),leafVariation);
        diffuseColor.rgb += vec3(.13,.17,.036) * ribs * .28;
        diffuseColor.rgb = mix(vec3(.31,.42,.12), diffuseColor.rgb, smoothstep(.03,.38,r));
        diffuseColor.rgb *= .93 + foodNoise(vFoodPosition * 115.) * .14;
        if (!gl_FrontFacing) diffuseColor.rgb *= 1.2;
      `
    } else if (kind === 'egg') {
      recipe = `
        float browned = smoothstep(.79,1.05,length(vFoodPosition.xz)) * (.23 + foodNoise(vFoodPosition * 43.) * .77);
        float bubbles = foodPores(vFoodPosition.xz * 31.);
        diffuseColor.rgb = mix(vec3(.91,.865,.72),vec3(.36,.14,.023),browned * .9);
        diffuseColor.rgb *= .97 + foodNoise(vFoodPosition * 28.) * .055 - bubbles * .03;
      `
    } else {
      recipe = `diffuseColor.rgb *= .92 + .14 * foodFbm(vFoodPosition * 12.);`
    }
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n' + recipe
    )
    const strength =
      kind === 'meat'
        ? '.0019'
        : kind === 'bun' || kind === 'base'
          ? '.0012'
          : kind === 'leaf'
            ? '.0004'
            : '.00006'
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>
      float foodHeight = foodNoise(vFoodPosition * ${kind === 'meat' ? '83.' : '125.'}) ${kind === 'base' || kind === 'bun' ? '- foodPores(vFoodPosition.xz * 25.) * 1.8' : ''};
      vec3 foodQ0 = dFdx(vViewPosition), foodQ1 = dFdy(vViewPosition);
      vec3 foodR1 = cross(foodQ1,normal), foodR2 = cross(normal,foodQ0);
      float foodDet = dot(foodQ0,foodR1);
      vec3 foodGrad = sign(foodDet) * (dFdx(foodHeight) * foodR1 + dFdy(foodHeight) * foodR2);
      normal = normalize(abs(foodDet) * normal - ${strength} * foodGrad);
    `
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor *= ${kind === 'meat' ? '.63 + foodNoise(vFoodPosition * 51.) * .6' : '.88 + foodNoise(vFoodPosition * 37.) * .19'};
    `
    )
  }
  mat.customProgramCacheKey = () => `nexus-food-${kind}-v2`
  return mat
}
