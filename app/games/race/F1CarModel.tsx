"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export interface F1CarMeshRefs {
  root: THREE.Group | null;
  chassisTilt: THREE.Group | null;
  frontLeftSteer: THREE.Group | null;
  frontRightSteer: THREE.Group | null;
  wheelSpinGroups: (THREE.Group | null)[];
  exhaustLeft: THREE.Mesh | null;
  exhaustRight: THREE.Mesh | null;
  tailLightMaterials: THREE.MeshStandardMaterial[];
}

interface BodyPartSpec {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  role: "paint" | "tail" | "default";
}

interface WheelCornerSpec {
  pivot: [number, number, number];
  parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[];
}

interface F1CarTemplate {
  bodyParts: BodyPartSpec[];
  wheels: [WheelCornerSpec, WheelCornerSpec, WheelCornerSpec, WheelCornerSpec];
}

const WHEEL_MATERIAL_PATTERN = /^(discs|redbull_wheel_hub|sidewall)/;
const PAINT_MATERIAL_PATTERN = /^(redbull_paint|redbull_color)/;
const HIDDEN_DECAL_PATTERN = /^(redbull_decals|redbull_number)/;
const TAIL_LIGHT_PATTERN = /^rear_light_2/;

const MODEL_URL = "/models/f1-rb22.glb";
const CAR_SCALE = 0.9;
const GROUND_OFFSET_Y = 0.032;

let cachedTemplatePromise: Promise<F1CarTemplate> | null = null;

function toFloatGeometryWithMatrix(
  source: THREE.BufferGeometry,
  matrix: THREE.Matrix4
): THREE.BufferGeometry {
  const unindexed = source.index ? source.toNonIndexed() : source.clone();
  const out = new THREE.BufferGeometry();

  const copyFloatAttr = (name: string, itemSize: number) => {
    const attr = unindexed.getAttribute(name);
    if (!attr) return;
    const arr = new Float32Array(attr.count * itemSize);
    for (let i = 0; i < attr.count; i++) {
      arr[i * itemSize] = attr.getX(i);
      if (itemSize >= 2) arr[i * itemSize + 1] = attr.getY(i);
      if (itemSize >= 3) arr[i * itemSize + 2] = attr.getZ(i);
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, itemSize));
  };

  copyFloatAttr("position", 3);
  copyFloatAttr("normal", 3);
  copyFloatAttr("uv", 2);

  unindexed.dispose();
  out.applyMatrix4(matrix);
  if (!out.getAttribute("normal")) {
    out.computeVertexNormals();
  }
  return out;
}

function splitWheelQuadrants(geometry: THREE.BufferGeometry): (THREE.BufferGeometry | null)[] {
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
  const nor = geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute | undefined;
  if (!pos) return [null, null, null, null];

  const buckets: number[][][] = [
    [[], [], []], // 0: Front-Left  (x < 0, z < 0)
    [[], [], []], // 1: Front-Right (x >= 0, z < 0)
    [[], [], []], // 2: Rear-Left   (x < 0, z >= 0)
    [[], [], []], // 3: Rear-Right  (x >= 0, z >= 0)
  ];

  const triCount = Math.floor(pos.count / 3);
  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const cx = (pos.getX(i0) + pos.getX(i0 + 1) + pos.getX(i0 + 2)) / 3;
    const cz = (pos.getZ(i0) + pos.getZ(i0 + 1) + pos.getZ(i0 + 2)) / 3;
    const q = (cz >= 0 ? 2 : 0) + (cx >= 0 ? 1 : 0);

    for (let k = 0; k < 3; k++) {
      const idx = i0 + k;
      buckets[q][0].push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
      if (nor) buckets[q][1].push(nor.getX(idx), nor.getY(idx), nor.getZ(idx));
      if (uv) buckets[q][2].push(uv.getX(idx), uv.getY(idx));
    }
  }

  return buckets.map(([p, n, u]) => {
    if (p.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    if (n.length === p.length) g.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
    if (u.length === (p.length / 3) * 2) g.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2));
    g.computeBoundingBox();
    return g;
  });
}

function loadF1CarTemplate(): Promise<F1CarTemplate> {
  if (cachedTemplatePromise) return cachedTemplatePromise;

  cachedTemplatePromise = (async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(MODEL_URL);
    gltf.scene.updateMatrixWorld(true);

    // Rotate nose from +Z to -Z, scale cleanly to 4.85m GP proportions, ground tires at y=0
    const bakeTransform = new THREE.Matrix4()
      .makeScale(CAR_SCALE, CAR_SCALE, CAR_SCALE)
      .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
      .premultiply(new THREE.Matrix4().makeTranslation(0, GROUND_OFFSET_Y * CAR_SCALE, 0));

    const bodyParts: BodyPartSpec[] = [];
    const cornerGeoms: { geometry: THREE.BufferGeometry; material: THREE.Material }[][] = [
      [],
      [],
      [],
      [],
    ];

    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const mat = Array.isArray(node.material) ? node.material[0] : node.material;
      if (!mat) return;
      const matName = mat.name || "";

      if (HIDDEN_DECAL_PATTERN.test(matName)) return;

      const worldAndLocal = new THREE.Matrix4().multiplyMatrices(bakeTransform, node.matrixWorld);
      const baked = toFloatGeometryWithMatrix(node.geometry, worldAndLocal);

      if (WHEEL_MATERIAL_PATTERN.test(matName)) {
        const split = splitWheelQuadrants(baked);
        baked.dispose();
        split.forEach((g, idx) => {
          if (g) cornerGeoms[idx].push({ geometry: g, material: mat });
        });
        return;
      }

      const role: BodyPartSpec["role"] = PAINT_MATERIAL_PATTERN.test(matName)
        ? "paint"
        : TAIL_LIGHT_PATTERN.test(matName)
        ? "tail"
        : "default";

      bodyParts.push({ geometry: baked, material: mat, role });
    });

    // Compute exact bounding-box center for each wheel corner and recentre around (0,0,0)
    const wheels = cornerGeoms.map((parts) => {
      const cornerBox = new THREE.Box3();
      parts.forEach(({ geometry }) => {
        geometry.computeBoundingBox();
        if (geometry.boundingBox) cornerBox.union(geometry.boundingBox);
      });
      const center = new THREE.Vector3();
      cornerBox.getCenter(center);
      parts.forEach(({ geometry }) => {
        geometry.translate(-center.x, -center.y, -center.z);
      });
      return {
        pivot: [center.x, center.y, center.z] as [number, number, number],
        parts,
      };
    }) as [WheelCornerSpec, WheelCornerSpec, WheelCornerSpec, WheelCornerSpec];

    return { bodyParts, wheels };
  })().catch((err) => {
    cachedTemplatePromise = null;
    throw err;
  });

  return cachedTemplatePromise;
}

export function F1CarModel({
  carId,
  color,
  isPlayer,
  isDark,
  registerRefs,
}: {
  carId: string;
  color: string;
  isPlayer: boolean;
  isDark: boolean;
  registerRefs: (id: string, refs: F1CarMeshRefs) => void;
}) {
  const [template, setTemplate] = useState<F1CarTemplate | null>(null);

  const rootRef = useRef<THREE.Group>(null);
  const chassisTiltRef = useRef<THREE.Group>(null);
  const frontLeftSteerRef = useRef<THREE.Group>(null);
  const frontRightSteerRef = useRef<THREE.Group>(null);
  const wheelSpinRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const exhaustLeftRef = useRef<THREE.Mesh>(null);
  const exhaustRightRef = useRef<THREE.Mesh>(null);
  const fallbackTailRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    let active = true;
    loadF1CarTemplate()
      .then((tpl) => {
        if (active) setTemplate(tpl);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Clone per-car team livery & tail light materials cleanly without mutating shared template
  const instanceMaterials = useMemo(() => {
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      metalness: 0.44,
      roughness: 0.17,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.6,
    });

    const tailMat = new THREE.MeshStandardMaterial({
      color: "#ff2626",
      emissive: "#ff2020",
      emissiveIntensity: 1.3,
      roughness: 0.2,
      toneMapped: false,
    });

    return { paintMat, tailMat };
  }, [color]);

  useEffect(() => {
    return () => {
      instanceMaterials.paintMat.dispose();
      instanceMaterials.tailMat.dispose();
    };
  }, [instanceMaterials]);

  useEffect(() => {
    registerRefs(carId, {
      root: rootRef.current,
      chassisTilt: chassisTiltRef.current,
      frontLeftSteer: frontLeftSteerRef.current,
      frontRightSteer: frontRightSteerRef.current,
      wheelSpinGroups: wheelSpinRefs.current,
      exhaustLeft: exhaustLeftRef.current,
      exhaustRight: exhaustRightRef.current,
      tailLightMaterials: template
        ? [instanceMaterials.tailMat]
        : fallbackTailRef.current
        ? [fallbackTailRef.current]
        : [],
    });
  }, [carId, instanceMaterials, registerRefs, template]);

  const shellDark = isDark ? "#1c1f27" : "#27272a";

  return (
    <group ref={rootRef}>
      <group ref={chassisTiltRef}>
        {template ? (
          <>
            {template.bodyParts.map((part, idx) => (
              <mesh
                key={idx}
                geometry={part.geometry}
                material={
                  part.role === "paint"
                    ? instanceMaterials.paintMat
                    : part.role === "tail"
                    ? instanceMaterials.tailMat
                    : part.material
                }
                castShadow
                receiveShadow
              />
            ))}

            {/* Front Left Steerable Wheel */}
            <group position={template.wheels[0].pivot}>
              <group ref={frontLeftSteerRef}>
                <group
                  ref={(el) => {
                    wheelSpinRefs.current[0] = el;
                  }}
                >
                  {template.wheels[0].parts.map((p, i) => (
                    <mesh key={i} geometry={p.geometry} material={p.material} castShadow />
                  ))}
                </group>
              </group>
            </group>

            {/* Front Right Steerable Wheel */}
            <group position={template.wheels[1].pivot}>
              <group ref={frontRightSteerRef}>
                <group
                  ref={(el) => {
                    wheelSpinRefs.current[1] = el;
                  }}
                >
                  {template.wheels[1].parts.map((p, i) => (
                    <mesh key={i} geometry={p.geometry} material={p.material} castShadow />
                  ))}
                </group>
              </group>
            </group>

            {/* Rear Left Wheel */}
            <group position={template.wheels[2].pivot}>
              <group
                ref={(el) => {
                  wheelSpinRefs.current[2] = el;
                }}
              >
                {template.wheels[2].parts.map((p, i) => (
                  <mesh key={i} geometry={p.geometry} material={p.material} castShadow />
                ))}
              </group>
            </group>

            {/* Rear Right Wheel */}
            <group position={template.wheels[3].pivot}>
              <group
                ref={(el) => {
                  wheelSpinRefs.current[3] = el;
                }}
              >
                {template.wheels[3].parts.map((p, i) => (
                  <mesh key={i} geometry={p.geometry} material={p.material} castShadow />
                ))}
              </group>
            </group>
          </>
        ) : (
          /* Instant sleek F1 silhouette fallback while 3.8MB GLB parses on first visit */
          <group position={[0, 0.34, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.92, 0.28, 3.8]} />
              <primitive object={instanceMaterials.paintMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.14, -2.0]} castShadow>
              <boxGeometry args={[1.68, 0.06, 0.44]} />
              <meshStandardMaterial color={shellDark} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.46, 1.75]} castShadow>
              <boxGeometry args={[1.52, 0.07, 0.42]} />
              <primitive object={instanceMaterials.paintMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.14, 1.92]}>
              <boxGeometry args={[0.35, 0.1, 0.06]} />
              <meshStandardMaterial
                ref={fallbackTailRef}
                color="#ff2626"
                emissive="#ff2020"
                emissiveIntensity={1.5}
                toneMapped={false}
              />
            </mesh>
          </group>
        )}

        {/* Twin ERS / Nitro Exhaust Flames behind F1 rear diffuser */}
        <mesh ref={exhaustLeftRef} position={[-0.14, 0.32, 2.38]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.95, 12]} />
          <meshStandardMaterial
            color={isPlayer ? "#ff7e4f" : color}
            emissive={isPlayer ? "#ed5d31" : color}
            emissiveIntensity={2.8}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>
        <mesh ref={exhaustRightRef} position={[0.14, 0.32, 2.38]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.95, 12]} />
          <meshStandardMaterial
            color={isPlayer ? "#ff7e4f" : color}
            emissive={isPlayer ? "#ed5d31" : color}
            emissiveIntensity={2.8}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Subtle overhead beacon on AI rivals so gaps across corners read clearly */}
        {!isPlayer && (
          <mesh position={[0, 1.38, 0]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1.9}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
