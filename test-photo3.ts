import { fetchFreeDestinationPhoto } from './src/utils/photoService.ts';

async function run() {
  const photo = await fetchFreeDestinationPhoto('', '', '', 'Minha Aventura');
  console.log(photo);
}
run();
