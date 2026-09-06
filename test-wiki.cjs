async function test() {
  const url = `https://pt.wikipedia.org/w/api.php?action=query&titles=Paris&prop=pageimages|imageinfo&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
