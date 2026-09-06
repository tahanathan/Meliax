import { fetchFreeDestinationPhoto } from './src/utils/photoService.ts';

async function run() {
  const photo = await fetchFreeDestinationPhoto('Ushuaia', '', '', '');
  console.log(photo);
}
run();
