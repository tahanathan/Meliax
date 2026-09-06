import { fetchFreeDestinationPhoto } from './src/utils/photoService.ts';

async function run() {
  const photo = await fetchFreeDestinationPhoto('Ushuaia', '', 'Argentina', '');
  console.log(photo);
}
run();
