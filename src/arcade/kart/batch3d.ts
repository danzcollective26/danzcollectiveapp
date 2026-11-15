import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/** Combine stationary pieces that share a material, retaining animated groups. */
export function batchMeshes(root:THREE.Object3D,recursive=true){
  root.updateMatrixWorld(true)
  const inverse=root.matrixWorld.clone().invert(),groups=new Map<string,THREE.Mesh[]>()
  root.traverse(o=>{
    if(!(o instanceof THREE.Mesh)||o instanceof THREE.InstancedMesh||Array.isArray(o.material)||(!recursive&&o.parent!==root))return
    const key=[o.material.uuid,o.castShadow,o.receiveShadow,Object.keys(o.geometry.attributes).sort().join(',')].join('/')
    const group=groups.get(key)??[];group.push(o);groups.set(key,group)
  })
  const removed=new Set<THREE.BufferGeometry>()
  for(const group of groups.values()){
    if(group.length<2)continue
    const transformed=group.map(o=>{
      const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()
      return g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld))
    })
    const geometry=mergeGeometries(transformed,false);transformed.forEach(g=>g.dispose())
    if(!geometry)continue
    const combined=new THREE.Mesh(geometry,group[0].material)
    combined.castShadow=group[0].castShadow;combined.receiveShadow=group[0].receiveShadow
    for(const o of group){o.removeFromParent();removed.add(o.geometry)}root.add(combined)
  }
  root.traverse(o=>{if(o instanceof THREE.Mesh)removed.delete(o.geometry)})
  removed.forEach(g=>g.dispose())
}
