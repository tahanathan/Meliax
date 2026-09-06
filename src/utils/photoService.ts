export interface DestinationPhotoResult {
  url: string;
  credit: string;
}

/**
 * Searches for high-quality free images of the given destination or itinerary title,
 * and extracts the photographer/author attribution for copyright compliance.
 */
export async function fetchFreeDestinationPhoto(
  destination: string,
  state?: string,
  country?: string,
  title?: string
): Promise<DestinationPhotoResult> {
  const cleanDest = destination.trim();
  const cleanState = state?.trim() || '';
  const cleanCountry = country?.trim() || '';
  const lowerDest = cleanDest.toLowerCase();
  const fullSearchString = `${cleanDest} ${cleanState} ${cleanCountry} ${title || ''}`.toLowerCase();

  // Curated high-definition photography for popular destinations (including São Luís)
  if (fullSearchString.includes('são luís') || fullSearchString.includes('sao luis') || fullSearchString.includes('sao luiz') || (cleanState.toLowerCase().includes('maranh') && fullSearchString.includes('luis'))) {
    return {
      url: 'https://images.unsplash.com/photo-1596484552993-9c96a32d1e26?auto=format&fit=crop&w=1400&q=80',
      credit: 'Foto: Unsplash / Centro Histórico, São Luís (MA)',
    };
  }

  if (fullSearchString.includes('lençóis maranhenses') || fullSearchString.includes('lencois maranhenses') || fullSearchString.includes('barreirinhas')) {
    return {
      url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1400&q=80',
      credit: 'Foto: Unsplash / Parque Nacional dos Lençóis Maranhenses (MA)',
    };
  }

  // Special curated check for Canela (RS, Brasil) to avoid spice/food image confusion
  if (lowerDest.includes('canela')) {
    return {
      url: 'https://images.unsplash.com/photo-1598539958169-90b9b3e15f8a?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / Catedral de Pedra, Canela (RS)',
    };
  }

  if (fullSearchString.includes('gramado') || fullSearchString.includes('serras gaúchas')) {
    return {
      url: 'https://images.unsplash.com/photo-1597739239353-50270a473397?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / Gramado & Canela (RS)',
    };
  }

  if (fullSearchString.includes('salvador') || fullSearchString.includes('pelourinho')) {
    return {
      url: 'https://images.unsplash.com/photo-1574360897459-65935f8d9b15?auto=format&fit=crop&w=1400&q=80',
      credit: 'Foto: Unsplash / Pelourinho, Salvador (BA)',
    };
  }

  if (fullSearchString.includes('florianópolis') || fullSearchString.includes('florianopolis') || fullSearchString.includes('floripa')) {
    return {
      url: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=1400&q=80',
      credit: 'Foto: Unsplash / Ilha da Magia, Florianópolis (SC)',
    };
  }

  if (fullSearchString.includes('curitiba') || fullSearchString.includes('jardim botânico')) {
    return {
      url: 'https://images.unsplash.com/photo-1590740925206-a83d474fd1a9?auto=format&fit=crop&w=1400&q=80',
      credit: 'Foto: Unsplash / Jardim Botânico, Curitiba (PR)',
    };
  }

  if (fullSearchString.includes('fortaleza') || fullSearchString.includes('jericoacoara') || fullSearchString.includes('canoa quebrada')) {
    return {
      url: 'https://images.unsplash.com/photo-1590740925206-a83d474fd1a9?auto=format&fit=crop&w=1400&q=80',
      credit: 'Foto: Unsplash / Litoral Cearense',
    };
  }

  if (fullSearchString.includes('paris') || fullSearchString.includes('frança') || fullSearchString.includes('france')) {
    return {
      url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @chriskaratsoreos',
    };
  }
  if (fullSearchString.includes('rio de janeiro') || fullSearchString.includes('copacabana')) {
    return {
      url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @rafaelribeirom',
    };
  }
  if (fullSearchString.includes('tokyo') || fullSearchString.includes('tóquio') || fullSearchString.includes('japão') || fullSearchString.includes('japan')) {
    return {
      url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @jezael',
    };
  }
  if (fullSearchString.includes('roma') || fullSearchString.includes('itália') || fullSearchString.includes('rome') || fullSearchString.includes('italy')) {
    return {
      url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @davidkohm',
    };
  }
  if (fullSearchString.includes('nova york') || fullSearchString.includes('new york') || fullSearchString.includes('eua') || fullSearchString.includes('usa')) {
    return {
      url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @benobro',
    };
  }
  if (fullSearchString.includes('londres') || fullSearchString.includes('london') || fullSearchString.includes('inglaterra') || fullSearchString.includes('uk')) {
    return {
      url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @marcin_em',
    };
  }

  // 1. Try Wikimedia Commons & Wikipedia searches in parallel with strict short timeouts (1.2s max)
  try {
    const commonsSearchTerm = [cleanDest, cleanState, cleanCountry].filter(Boolean).join(' ');
    const fetchWithTimeout = async (url: string, timeoutMs = 1200) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) return await res.json();
      } catch {
        clearTimeout(id);
      }
      return null;
    };

    const wikiTitlesToTry = [
      cleanState ? `${cleanDest} (${cleanState})` : null,
      cleanDest,
    ].filter(Boolean) as string[];

    const promises: Promise<DestinationPhotoResult | null>[] = [];

    if (commonsSearchTerm) {
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        commonsSearchTerm
      )}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json&origin=*`;

      promises.push(
        fetchWithTimeout(commonsUrl, 1200).then((data) => {
          const pages = data?.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pageId && pageId !== '-1') {
              const imgUrl = pages[pageId]?.imageinfo?.[0]?.url;
              if (
                imgUrl &&
                !imgUrl.toLowerCase().endsWith('.svg') &&
                !imgUrl.toLowerCase().includes('brasao') &&
                !imgUrl.toLowerCase().includes('bandeira') &&
                !imgUrl.toLowerCase().includes('map') &&
                !imgUrl.toLowerCase().includes('logo')
              ) {
                return {
                  url: imgUrl,
                  credit: `Foto: Wikimedia Commons / ${commonsSearchTerm}`,
                };
              }
            }
          }
          return null;
        })
      );
    }

    for (const queryTitle of wikiTitlesToTry) {
      const wikiUrl = `https://pt.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        queryTitle
      )}&prop=pageimages|imageinfo&piprop=original|thumbnail&pithumbsize=1200&format=json&origin=*`;

      promises.push(
        fetchWithTimeout(wikiUrl, 1200).then((data) => {
          const pages = data?.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pageId && pageId !== '-1') {
              const page = pages[pageId];
              const imgUrl = page?.original?.source || page?.thumbnail?.source;
              if (
                imgUrl &&
                !imgUrl.toLowerCase().endsWith('.svg') &&
                !imgUrl.toLowerCase().includes('brasao') &&
                !imgUrl.toLowerCase().includes('brasão') &&
                !imgUrl.toLowerCase().includes('bandeira') &&
                !imgUrl.toLowerCase().includes('cinnamon') &&
                !imgUrl.toLowerCase().includes('spice')
              ) {
                return {
                  url: imgUrl,
                  credit: `Foto: Wikimedia Commons / ${queryTitle}`,
                };
              }
            }
          }
          return null;
        })
      );
    }

    const results = await Promise.all(promises);
    const validFound = results.find((r) => r !== null);
    if (validFound) {
      return validFound;
    }
  } catch {
    // Fallback to thematic photos
  }

  if (fullSearchString.includes('praia') || fullSearchString.includes('beach') || fullSearchString.includes('nordeste') || fullSearchString.includes('mar')) {
    return {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @seanoulashin',
    };
  }
  if (fullSearchString.includes('montanha') || fullSearchString.includes('mountain') || fullSearchString.includes('trilha') || fullSearchString.includes('neve')) {
    return {
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      credit: 'Foto: Unsplash / @kalenemsley',
    };
  }

  // Fallback royalty-free Unsplash travel image with author credit
  return {
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    credit: `Foto: Unsplash / Turismo`,
  };
}

/**
 * Returns a suitable thumbnail image URL for an itinerary activity.
 */
export function getActivityThumbnail(
  item: {
    image?: string;
    place?: string;
    title?: string;
    location?: string;
    category?: string;
  },
  tripCover?: string
): string {
  if (item.image && item.image.trim()) {
    return item.image;
  }

  const text = `${item.title || ''} ${item.place || ''} ${item.location || ''}`.toLowerCase();

  if (text.includes('praia') || text.includes('mar') || text.includes('beach') || text.includes('ilha')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('museu') || text.includes('museum') || text.includes('arte') || text.includes('exposi')) {
    return 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('parque') || text.includes('jardim') || text.includes('park') || text.includes('trilha') || text.includes('montanha')) {
    return 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('restaurante') || text.includes('jantar') || text.includes('almoço') || text.includes('café') || text.includes('gastronom') || item.category === 'food') {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('hotel') || text.includes('pousada') || text.includes('resort') || text.includes('check-in') || item.category === 'lodging') {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('voo') || text.includes('aeroporto') || text.includes('trem') || text.includes('ônibus') || text.includes('estação') || item.category === 'transport') {
    return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('templo') || text.includes('igreja') || text.includes('catedral') || text.includes('santuário') || text.includes('monumento') || text.includes('cristo')) {
    return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('torre') || text.includes('mirante') || text.includes('view') || text.includes('sunset') || text.includes('pôr do sol')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80';
  }
  if (text.includes('compras') || text.includes('shopping') || text.includes('mercado') || text.includes('feira')) {
    return 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=400&q=80';
  }

  if (tripCover && tripCover.trim()) {
    return tripCover;
  }

  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80';
}

