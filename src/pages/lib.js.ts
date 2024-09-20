import TINA from '@src/lib/tina?raw'
import TINA_COMMON from '@src/lib/tina.common?raw'
import TINA_RAYMARCH_LIGHT from '@src/lib/raymarch/light?raw'
import TINA_RAYMARCH_MATERIAL from '@src/lib/raymarch/material?raw'
import TINA_RAYMARCH_SCENE from '@src/lib/raymarch/scene?raw'
import TINA_RAYMARCH from '@src/lib/raymarch/raymarch?raw'
import TINA_RAYMARCH_PHYSICS from '@src/lib/raymarch/physics.capsule?raw'

const SCRIPT = [
  TINA_COMMON,
  TINA_RAYMARCH_PHYSICS,
  TINA_RAYMARCH,
  TINA_RAYMARCH_MATERIAL,
  TINA_RAYMARCH_SCENE,
  TINA_RAYMARCH_LIGHT,
  TINA,
].join('\n')

export const GET = async () => {
  return new Response(SCRIPT)
}
