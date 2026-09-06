import { fetchFreeDestinationPhoto } from './src/utils/photoService.ts';

async function run() {
  const photo = await fetchFreeDestinationPhoto('Birigüi', 'São Paulo', 'Brasil', '');
  console.log(photo);
}
run();
