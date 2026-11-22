/** Bound GPU memory use of the optional 3D venue on large/high-DPR phones.
 * Gameplay, vinyl hit targets and the original SVG resolution are unaffected.
 */
export function grooveStagePixelRatio(dpr:number,width:number,height:number):number {
  const physical=Math.max(.75,Math.min(1.5,Number.isFinite(dpr)?dpr:1))
  const pixels=Math.max(1,width*height)
  return Math.max(.5,Math.min(physical,Math.sqrt(1_200_000/pixels)))
}
