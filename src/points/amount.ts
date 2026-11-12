export function euroAmount(value: string): number | null {
  const input=value.trim()
  if(!/^\d{1,6}(?:[,.]\d{1,2})?$/.test(input))return null
  const [whole,decimal='']=input.replace(',','.').split('.')
  const cents=Number(whole)*100+Number((decimal+'00').slice(0,2))
  return Number.isSafeInteger(cents)&&cents>0&&cents<=10000000?cents:null
}
