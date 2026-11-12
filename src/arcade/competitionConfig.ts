// Matching database migration 20261112083248 is applied and verified.
// An explicit false build value can pause competition without changing practice.
const env=(import.meta as ImportMeta & {env:Record<string,string|boolean|undefined>}).env
export const COMPETITION_ENABLED=(env.VITE_SNAKE_COMPETITION_ENABLED??'true')==='true'
