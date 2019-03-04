function secToTime(t) {
  let minutes = Math.floor(t/60);
  let seconds = (t % 60).toFixed(3);
  let str = '';
  if(minutes != 0)
    str += minutes + ':';
  if(minutes != 0 && seconds < 10)
    str += '0' + seconds;
  else
    str += seconds;
  return str;
}
