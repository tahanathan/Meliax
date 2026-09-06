import { fetchFreeDestinationPhoto } from './src/utils/photoService.ts';

async function run() {
  const photo = await fetchFreeDestinationPhoto('Maceió', 'Alagoas', 'Brasil', '');
  console.log(photo);
}
run();
