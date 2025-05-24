export function formatDate(datetime) {
  if (!datetime) return "";
  const [datePart, timePart] = datetime.split('T');
  const [year, month, day] = datePart.split('-');
  const time = timePart ? timePart.slice(0,5) : '';
  return `${day}/${month}/${year}${time ? ' (' + time + ')' : ''}`;
}